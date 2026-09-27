"""
Comprehensive Scheme Documents API Integration Tests.
Verifies all document lifecycle actions, user-profile ownership, isolation, and security.
"""

import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _register_and_get_user(ac: AsyncClient, prefix: str) -> dict:
    rand_id = uuid.uuid4().hex[:6]
    email = f"{prefix}_{rand_id}@example.com"
    phone = f"+919{int(uuid.uuid4().int % 1000000000):09d}"
    reg_payload = {
        "fullName": f"User {prefix}",
        "email": email,
        "phone": phone,
        "password": "Password123!",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def test_complete_scheme_documents_lifecycle_and_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create User A and User B
        headers_a = await _register_and_get_user(ac, "patient_a")
        headers_b = await _register_and_get_user(ac, "patient_b")

        # TEST 2: Empty state for User A
        res_empty = await ac.get("/api/v1/documents", headers=headers_a)
        assert res_empty.status_code == 200
        assert res_empty.json() == []

        # TEST 3: Upload valid PDF for User A
        pdf_content = b"%PDF-1.4 Mock Government Income Certificate Content"
        files_pdf = {
            "file": ("income_certificate_2026.pdf", pdf_content, "application/pdf")
        }
        data_pdf = {
            "category": "INCOME_CERTIFICATE"
        }
        res_upload_pdf = await ac.post(
            "/api/v1/documents",
            files=files_pdf,
            data=data_pdf,
            headers=headers_a
        )
        assert res_upload_pdf.status_code == 201
        doc_a1 = res_upload_pdf.json()
        assert doc_a1["file_name"] == "income_certificate_2026.pdf"
        assert doc_a1["category"] == "INCOME_CERTIFICATE"
        assert doc_a1["file_type"] == "pdf"
        assert doc_a1["processing_status"] == "AVAILABLE"
        doc_a1_id = doc_a1["document_id"]

        # TEST 4: Upload valid Image for User A
        img_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR Mock Eligibility Card"
        files_img = {
            "file": ("eligibility_card.png", img_content, "image/png")
        }
        data_img = {
            "category": "ELIGIBILITY_CERTIFICATE"
        }
        res_upload_img = await ac.post(
            "/api/v1/documents",
            files=files_img,
            data=data_img,
            headers=headers_a
        )
        assert res_upload_img.status_code == 201
        doc_a2 = res_upload_img.json()
        assert doc_a2["file_name"] == "eligibility_card.png"
        assert doc_a2["category"] == "ELIGIBILITY_CERTIFICATE"
        assert doc_a2["file_type"] == "image"

        # TEST 5: Upload invalid file type (e.g. .exe / .sh)
        bad_files = {
            "file": ("malicious_script.exe", b"binary content", "application/octet-stream")
        }
        res_bad_type = await ac.post(
            "/api/v1/documents",
            files=bad_files,
            data={"category": "OTHER"},
            headers=headers_a
        )
        assert res_bad_type.status_code == 422

        # TEST 6: Upload oversized file (> 10MB)
        oversized_content = b"0" * (11 * 1024 * 1024)
        large_files = {
            "file": ("huge_scan.pdf", oversized_content, "application/pdf")
        }
        res_oversized = await ac.post(
            "/api/v1/documents",
            files=large_files,
            data={"category": "OTHER"},
            headers=headers_a
        )
        assert res_oversized.status_code == 422

        # TEST 1: User A lists documents -> Gets exactly their 2 documents
        res_list_a = await ac.get("/api/v1/documents", headers=headers_a)
        assert res_list_a.status_code == 200
        docs_a = res_list_a.json()
        assert len(docs_a) == 2

        # TEST 1 & 10: User B lists documents -> Gets 0 documents (isolation)
        res_list_b = await ac.get("/api/v1/documents", headers=headers_b)
        assert res_list_b.status_code == 200
        assert len(res_list_b.json()) == 0

        # TEST 7: User A Views/Gets metadata of doc_a1
        res_view = await ac.get(f"/api/v1/documents/{doc_a1_id}", headers=headers_a)
        assert res_view.status_code == 200
        assert res_view.json()["document_id"] == doc_a1_id

        # TEST 10: User B attempts to access User A's document -> 403 Forbidden
        res_unauthorized_get = await ac.get(f"/api/v1/documents/{doc_a1_id}", headers=headers_b)
        assert res_unauthorized_get.status_code == 403

        # TEST 8: Download document for User A
        res_download = await ac.get(f"/api/v1/documents/{doc_a1_id}/download", headers=headers_a, follow_redirects=False)
        assert res_download.status_code in (200, 307, 308)

        # TEST 10: User B attempts to download User A's document -> 403 Forbidden
        res_unauthorized_download = await ac.get(f"/api/v1/documents/{doc_a1_id}/download", headers=headers_b)
        assert res_unauthorized_download.status_code == 403

        # TEST 10: User B attempts to delete User A's document -> 403 Forbidden
        res_unauthorized_del = await ac.delete(f"/api/v1/documents/{doc_a1_id}", headers=headers_b)
        assert res_unauthorized_del.status_code == 403

        # TEST 9: User A deletes doc_a1
        res_del = await ac.delete(f"/api/v1/documents/{doc_a1_id}", headers=headers_a)
        assert res_del.status_code == 204

        # Verify doc_a1 is gone for User A
        res_check_gone = await ac.get(f"/api/v1/documents/{doc_a1_id}", headers=headers_a)
        assert res_check_gone.status_code == 404

        # User A now has only 1 document remaining
        res_list_after_del = await ac.get("/api/v1/documents", headers=headers_a)
        assert len(res_list_after_del.json()) == 1
