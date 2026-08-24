"""
Patient Profile API unit tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "Profile User",
        "email": "profile@example.com",
        "phone": "+15555554321",
        "password": "securepassword99",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def test_profile_crud_flow():
    """Verify that user profile can be updated and sub-resources can be managed."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 1. Get initial blank profile
        res_get = await ac.get("/api/v1/profile", headers=headers)
        assert res_get.status_code == 200
        profile = res_get.json()
        assert profile["gender"] is None

        # 2. Update profile details
        update_payload = {
            "dateOfBirth": "1995-05-15",
            "gender": "male",
            "bloodGroup": "O+",
            "heightCm": 178.5,
            "weightKg": 72.0,
            "city": "Mumbai",
            "state": "Maharashtra",
            "emergencyContactName": "John Doe",
            "emergencyContactPhone": "+15550000000",
        }
        res_put = await ac.put("/api/v1/profile", json=update_payload, headers=headers)
        assert res_put.status_code == 200
        profile_updated = res_put.json()
        assert profile_updated["gender"] == "male"
        assert profile_updated["city"] == "Mumbai"
        assert profile_updated["heightCm"] == 178.5

        # ─── Test Allergies ───
        # List allergies (should be empty)
        res_all_list = await ac.get("/api/v1/profile/allergies", headers=headers)
        assert res_all_list.status_code == 200
        assert len(res_all_list.json()) == 0

        # Create allergy
        allergy_payload = {
            "allergyName": "Peanut Allergy",
            "severity": "high",
            "notes": "Anaphylaxis risk",
        }
        res_all_create = await ac.post("/api/v1/profile/allergies", json=allergy_payload, headers=headers)
        assert res_all_create.status_code == 201
        allergy = res_all_create.json()
        assert allergy["allergyName"] == "Peanut Allergy"
        allergy_id = allergy["allergyId"]

        # Update allergy
        res_all_update = await ac.put(
            f"/api/v1/profile/allergies/{allergy_id}",
            json={"severity": "severe", "notes": "Carries EpiPen"},
            headers=headers,
        )
        assert res_all_update.status_code == 200
        assert res_all_update.json()["severity"] == "severe"

        # ─── Test Chronic Conditions ───
        condition_payload = {
            "conditionName": "Asthma",
            "diagnosedYear": 2018,
            "notes": "Mild exercise-induced",
        }
        res_cond_create = await ac.post("/api/v1/profile/conditions", json=condition_payload, headers=headers)
        assert res_cond_create.status_code == 201
        condition_id = res_cond_create.json()["conditionId"]

        # ─── Test Medications ───
        med_payload = {
            "medicineName": "Albuterol Inhaler",
            "dosage": "90 mcg",
            "frequency": "As needed for wheezing",
            "prescribedBy": "Dr. Sarah Jenkins",
        }
        res_med_create = await ac.post("/api/v1/profile/medications", json=med_payload, headers=headers)
        assert res_med_create.status_code == 201
        medication_id = res_med_create.json()["medicationId"]

        # ─── Verify all sub-resources lists reflect additions ───
        res_all = await ac.get("/api/v1/profile/allergies", headers=headers)
        assert len(res_all.json()) == 1
        res_cond = await ac.get("/api/v1/profile/conditions", headers=headers)
        assert len(res_cond.json()) == 1
        res_med = await ac.get("/api/v1/profile/medications", headers=headers)
        assert len(res_med.json()) == 1

        # ─── Delete sub-resources ───
        res_del_all = await ac.delete(f"/api/v1/profile/allergies/{allergy_id}", headers=headers)
        assert res_del_all.status_code == 204
        res_all_after = await ac.get("/api/v1/profile/allergies", headers=headers)
        assert len(res_all_after.json()) == 0
