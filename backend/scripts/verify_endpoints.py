import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("."))
import httpx
from app.main import app

async def test_endpoints():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login
        login_res = await client.post("/api/v1/auth/login", json={"email": "sarah@example.com", "password": "password123"})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        tokens = login_res.json()["tokens"]
        token = tokens.get("accessToken") or tokens.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] 1. Authentication (login & token retrieval)")

        # 2. GET /api/v1/dashboard
        dash_res = await client.get("/api/v1/dashboard", headers=headers)
        assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
        dash_data = dash_res.json()
        active_count = dash_data.get("active_schemes_count")
        completion = dash_data.get("profile_completion_pct")
        print(f"[PASS] 2. GET /api/v1/dashboard: HTTP 200 (Active schemes: {active_count}, Profile completion: {completion}%)")

        # 3. POST /api/v1/hospitals/nearby
        hosp_res = await client.post("/api/v1/hospitals/nearby", json={"latitude": 13.0827, "longitude": 80.2707, "radius_km": 15.0})
        assert hosp_res.status_code == 200, f"Hospitals failed: {hosp_res.text}"
        hosp_data = hosp_res.json()
        hosp_list = hosp_data if isinstance(hosp_data, list) else hosp_data.get("hospitals", [])
        print(f"[PASS] 3. POST /api/v1/hospitals/nearby: HTTP 200 (Found {len(hosp_list)} hospitals)")

        # 4. Patient Profile
        prof_res = await client.get("/api/v1/profile", headers=headers)
        assert prof_res.status_code == 200, f"Profile failed: {prof_res.text}"
        prof_data = prof_res.json()
        print(f"[PASS] 4. GET /api/v1/profile: HTTP 200 (Profile ID: {prof_data.get('profile_id')})")

        # 5. Documents
        doc_res = await client.get("/api/v1/documents", headers=headers)
        assert doc_res.status_code == 200, f"Documents failed: {doc_res.text}"
        print(f"[PASS] 5. GET /api/v1/documents: HTTP 200 (Found {len(doc_res.json())} documents)")

        # 6. Schemes
        sch_res = await client.get("/api/v1/schemes", headers=headers)
        assert sch_res.status_code == 200, f"Schemes failed: {sch_res.text}"
        print(f"[PASS] 6. GET /api/v1/schemes: HTTP 200 (Total {len(sch_res.json())} schemes)")

        # 7. Scheme Eligibility Evaluation / Query
        eval_res = await client.post("/api/v1/schemes/query", json={"queryText": "Am I eligible for Ayushman Bharat PM-JAY?"}, headers=headers)
        assert eval_res.status_code == 200, f"Scheme eval failed: {eval_res.text}"
        print(f"[PASS] 7. POST /api/v1/schemes/query: HTTP 200 (Answer returned)")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
