"""
Dashboard metrics, settings preferences, query guardrails, and activity logging API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.models.audit import ActivityLog

pytestmark = pytest.mark.asyncio


async def _get_auth_headers_and_profile(ac: AsyncClient) -> dict:
    """Helper to register user, log in, create patient profile, and return auth header."""
    reg_payload = {
        "fullName": "Phase10 Test User",
        "email": "p10@example.com",
        "phone": "+15557778888",
        "password": "p10testpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create profile
    profile_payload = {
        "dateOfBirth": "1990-05-15",
        "gender": "Female",
        "bloodGroup": "B+",
        "emergencyContactName": "Jane Doe",
        "emergencyContactPhone": "+15555557777"
    }
    await ac.put("/api/v1/profile", json=profile_payload, headers=headers)
    return headers


async def test_guardrails_evaluation():
    """Verify that input guardrails block non-medical queries and validate symptoms."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # 1. Non-medical prompt (Adversarial input check)
        payload_fail = {
            "queryText": "Write a python script to calculate fibonacci numbers."
        }
        res_fail = await ac.post("/api/v1/guardrails", json=payload_fail, headers=headers)
        assert res_fail.status_code == 200
        data_fail = res_fail.json()
        assert data_fail["validation_status"] == "failed"
        assert "cannot answer non-medical" in data_fail["corrected_response"].lower()

        # 2. Valid symptoms prompt
        payload_pass = {
            "queryText": "I have had chest pain and difficulty breathing."
        }
        res_pass = await ac.post("/api/v1/guardrails", json=payload_pass, headers=headers)
        assert res_pass.status_code == 200
        assert res_pass.json()["validation_status"] == "passed"


async def test_dashboard_and_settings_endpoints(db_session):
    """Verify home dashboard metrics and settings update routers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # 1. Dashboard summary
        res_dash = await ac.get("/api/v1/dashboard", headers=headers)
        assert res_dash.status_code == 200
        dash = res_dash.json()
        assert "totalConversations" in dash
        assert "totalUploads" in dash
        assert "totalPredictions" in dash

        # 2. Get Settings
        res_get_set = await ac.get("/api/v1/settings", headers=headers)
        assert res_get_set.status_code == 200
        assert res_get_set.json()["theme"] == "light"

        # 3. Update Settings
        res_put_set = await ac.put(
            "/api/v1/settings",
            json={"theme": "dark", "language": "hi", "enable_notifications": False},
            headers=headers
        )
        assert res_put_set.status_code == 200
        assert res_put_set.json()["theme"] == "dark"
        assert res_put_set.json()["language"] == "hi"


async def test_activity_logs_retrieval(db_session):
    """Verify security audit logs query endpoint."""
    # Find user_id from context session or seed a mock log first
    # For testing, insert an activity log record directly
    from app.models.user import User
    res_user = await db_session.execute(select(User).where(User.email == "p10@example.com"))
    user = res_user.scalar_one_or_none()
    
    if user:
        log_entry = ActivityLog(
            user_id=user.user_id,
            activity_type="LOGIN",
            description="User logged in during testing session.",
            ip_address="127.0.0.1"
        )
        db_session.add(log_entry)
        await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Re-register or login to fetch headers
        reg_payload = {
            "fullName": "Phase10 Audit User",
            "email": "p10_audit@example.com",
            "phone": "+15557778889",
            "password": "p10testpassword123",
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        token = res.json()["tokens"]["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add profile to log action
        profile_payload = {
            "dateOfBirth": "1990-05-15",
            "gender": "Female",
            "bloodGroup": "B+",
            "emergencyContactName": "Jane Doe",
            "emergencyContactPhone": "+15555557777"
        }
        await ac.put("/api/v1/profile", json=profile_payload, headers=headers)
        
        # Add custom log entry for this new user
        res_u = await db_session.execute(select(User).where(User.email == "p10_audit@example.com"))
        audit_user = res_u.scalar_one_or_none()
        log_e = ActivityLog(
            user_id=audit_user.user_id,
            activity_type="PROFILE_UPDATED",
            description="User updated profile details.",
            ip_address="127.0.0.1"
        )
        db_session.add(log_e)
        await db_session.commit()

        # Fetch activity logs
        res_logs = await ac.get("/api/v1/activity-logs", headers=headers)
        assert res_logs.status_code == 200
        logs = res_logs.json()
        assert len(logs) >= 1
        assert logs[0]["activityType"] == "PROFILE_UPDATED"
        assert logs[0]["ipAddress"] == "127.0.0.1"
