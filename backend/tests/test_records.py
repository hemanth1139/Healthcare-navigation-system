"""
Medical Records, PII Scrubbing, and HL7 FHIR converter API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers_and_profile(ac: AsyncClient) -> dict:
    """Helper to register user, log in, create patient profile, and return auth header."""
    reg_payload = {
        "fullName": "Record Verification User",
        "email": "records@example.com",
        "phone": "+15555556666",
        "password": "recordtestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create profile
    profile_payload = {
        "dateOfBirth": "1990-05-15",
        "gender": "Male",
        "bloodType": "O+",
        "allergies": "Peanuts",
        "chronicConditions": "Asthma",
        "emergencyContactName": "Jane Doe",
        "emergencyContactPhone": "+15555557777"
    }
    await ac.post("/api/v1/profile", json=profile_payload, headers=headers)
    return headers


async def test_medical_records_upload_scrub_and_fhir_flow():
    """Verify record uploading, PII scrubbing redaction, listing, and FHIR resource conversion."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # 1. Upload report containing PII data
        pii_report_content = (
            "CLINICAL HEALTH VISIT NOTE:\n"
            "Patient Name: Record Verification User\n"
            "Email Reference: records@example.com\n"
            "Patient Phone contact: +15555556666\n"
            "Aadhaar: 5555 6666 7777\n"
            "Patient presented with chest tightness and severe coughing."
        )
        
        files = {
            "file": ("clinic_report.txt", pii_report_content.encode("utf-8"), "text/plain")
        }
        data = {
            "recordType": "LAB_REPORT"
        }
        
        res_upload = await ac.post(
            "/api/v1/records/upload",
            files=files,
            data=data,
            headers=headers
        )
        assert res_upload.status_code == 201
        record = res_upload.json()
        
        # Verify schema elements
        assert "recordId" in record
        assert "originalFileUrl" in record
        assert "anonymizedTextContent" in record
        
        record_id = record["recordId"]
        scrubbed_text = record["anonymizedTextContent"]
        
        # Verify PII Scrubbing has successfully redacted sensitive keywords
        assert "records@example.com" not in scrubbed_text
        assert "[REDACTED_EMAIL]" in scrubbed_text
        assert "5555 6666 7777" not in scrubbed_text
        assert "[REDACTED_AADHAAR]" in scrubbed_text
        assert "Record Verification User" not in scrubbed_text
        assert "[REDACTED_NAME]" in scrubbed_text

        # 2. List records
        res_list = await ac.get("/api/v1/records", headers=headers)
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1

        # 3. Retrieve record details by ID
        res_detail = await ac.get(f"/api/v1/records/{record_id}", headers=headers)
        assert res_detail.status_code == 200
        assert res_detail.json()["recordId"] == record_id

        # 4. Fetch HL7 FHIR DiagnosticReport resource
        res_fhir = await ac.get(f"/api/v1/records/{record_id}/fhir", headers=headers)
        assert res_fhir.status_code == 200
        fhir_resource = res_fhir.json()
        
        # Verify standard HL7 FHIR structure
        assert fhir_resource["resourceType"] == "DiagnosticReport"
        assert fhir_resource["id"] == record_id
        assert fhir_resource["status"] == "final"
        assert "subject" in fhir_resource
        assert fhir_resource["subject"]["reference"].startswith("Patient/")
