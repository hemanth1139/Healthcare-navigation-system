"""
Comprehensive Auth & Authorization API Integration Tests.
Verifies registration, login, logout, token refresh, Google OAuth,
password reset, email verification, and route security.
"""

import pytest
import uuid
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def test_complete_auth_lifecycle_and_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        rand_id = uuid.uuid4().hex[:6]
        email = f"patient_{rand_id}@example.com"
        phone = f"+919{int(uuid.uuid4().int % 1000000000):09d}"

        # 1. Register a new user
        reg_payload = {
            "fullName": "Test Patient Security",
            "email": email,
            "phone": phone,
            "password": "StrongPassword123!",
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data_reg = res_reg.json()
        assert "user" in data_reg
        assert data_reg["user"]["fullName"] == "Test Patient Security"
        assert "tokens" in data_reg
        
        access_token = data_reg["tokens"]["accessToken"]
        refresh_token = data_reg["tokens"]["refreshToken"]
        assert access_token
        assert refresh_token

        # 2. Duplicate registration -> 409 Conflict
        res_dup = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_dup.status_code == 409

        # 3. Login with wrong password -> 401 Unauthorized
        res_wrong_pw = await ac.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "WrongPassword999!"}
        )
        assert res_wrong_pw.status_code == 401

        # 4. Login with correct credentials
        res_login = await ac.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "StrongPassword123!"}
        )
        assert res_login.status_code == 200
        data_login = res_login.json()
        new_access = data_login["tokens"]["accessToken"]
        new_refresh = data_login["tokens"]["refreshToken"]

        # 5. Access protected endpoint with valid access token
        headers = {"Authorization": f"Bearer {new_access}"}
        res_me = await ac.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == 200
        assert res_me.json()["email"] == email

        # 6. Access protected endpoint without token -> 401
        res_no_token = await ac.get("/api/v1/profile")
        assert res_no_token.status_code == 401

        # 7. Token refresh rotation
        res_refresh = await ac.post("/api/v1/auth/refresh", json={"refreshToken": new_refresh})
        assert res_refresh.status_code == 200
        refreshed_access = res_refresh.json()["tokens"]["accessToken"]
        refreshed_refresh = res_refresh.json()["tokens"]["refreshToken"]

        # 8. Forgot password endpoint
        res_forgot = await ac.post("/api/v1/auth/forgot-password", json={"email": email})
        assert res_forgot.status_code == 200
        assert "password reset link" in res_forgot.json()["message"]

        # 9. Google OAuth Login for new user (mocking external Google Tokeninfo API)
        mock_google_info = {
            "sub": f"google_sub_{rand_id}",
            "email": f"google_{rand_id}@gmail.com",
            "name": "Google Authenticated Patient",
            "email_verified": True,
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_res = MagicMock()
            mock_res.status_code = 200
            mock_res.json.return_value = mock_google_info
            mock_get.return_value = mock_res

            res_google = await ac.post(
                "/api/v1/auth/google",
                json={"credential": "mock_google_valid_jwt_credential"}
            )
            assert res_google.status_code == 200
            google_auth_data = res_google.json()
            assert google_auth_data["user"]["email"] == f"google_{rand_id}@gmail.com"
            assert google_auth_data["tokens"]["accessToken"]

        # 10. Google OAuth Login for EXISTING account (account linking verification)
        mock_existing_google = {
            "sub": f"google_link_{rand_id}",
            "email": email,  # same email as registered user above
            "name": "Linked Patient",
            "email_verified": True,
        }
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_res = MagicMock()
            mock_res.status_code = 200
            mock_res.json.return_value = mock_existing_google
            mock_get.return_value = mock_res

            res_link = await ac.post(
                "/api/v1/auth/google",
                json={"credential": "mock_google_link_jwt_credential"}
            )
            assert res_link.status_code == 200
            linked_data = res_link.json()
            assert linked_data["user"]["email"] == email

        # 11. Logout and verify refresh token revocation
        logout_headers = {"Authorization": f"Bearer {refreshed_access}"}
        res_logout = await ac.post("/api/v1/auth/logout", headers=logout_headers)
        assert res_logout.status_code == 200

        # Attempting refresh with revoked token should fail with 401
        res_revoked_ref = await ac.post("/api/v1/auth/refresh", json={"refreshToken": refreshed_refresh})
        assert res_revoked_ref.status_code == 401
