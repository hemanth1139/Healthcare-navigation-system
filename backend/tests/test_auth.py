"""
Auth API unit tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def test_register_login_refresh_flow():
    """Verify registration, login, and token refresh endpoints work together."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register a new user
        reg_payload = {
            "fullName": "Test Patient",
            "email": "test@example.com",
            "phone": "+15555551234",
            "password": "strongpassword123",
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data_reg = res_reg.json()
        assert "user" in data_reg
        assert data_reg["user"]["fullName"] == "Test Patient"
        assert "tokens" in data_reg
        
        access_token = data_reg["tokens"]["accessToken"]
        refresh_token = data_reg["tokens"]["refreshToken"]
        assert access_token
        assert refresh_token

        # 2. Try to register same email (should fail with conflict error)
        res_dup = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_dup.status_code == 409

        # 3. Log in with the registered credentials
        login_payload = {
            "email": "test@example.com",
            "password": "strongpassword123",
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200
        data_login = res_login.json()
        assert "tokens" in data_login
        
        new_access = data_login["tokens"]["accessToken"]
        new_refresh = data_login["tokens"]["refreshToken"]

        # 4. Refresh token
        refresh_payload = {
            "refreshToken": new_refresh,
        }
        res_refresh = await ac.post("/api/v1/auth/refresh", json=refresh_payload)
        assert res_refresh.status_code == 200
        data_ref = res_refresh.json()
        assert "tokens" in data_ref
        assert data_ref["tokens"]["accessToken"]

        # 5. Access profile page with token (Phase 3 sanity check)
        headers = {"Authorization": f"Bearer {data_ref['tokens']['accessToken']}"}
        res_profile = await ac.get("/api/v1/profile", headers=headers)
        assert res_profile.status_code == 200
        assert "profileId" in res_profile.json()

        # 6. Logout
        res_logout = await ac.post("/api/v1/auth/logout", headers=headers)
        assert res_logout.status_code == 200
        assert "message" in res_logout.json()
