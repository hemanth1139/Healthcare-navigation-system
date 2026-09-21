"""
Seed script to insert government healthcare schemes into the database from healthcare_schemes.json
and generate vectors for RAG similarity search.
"""

import asyncio
import sys
import os
import json
from datetime import date

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, delete
from app.core.database import engine, Base, AsyncSession, async_sessionmaker
from app.models.scheme import GovernmentScheme
from app.models import *  # Ensure all ORM models are imported so metadata includes all tables
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore


def find_schemes_json() -> str:
    """Find healthcare_schemes.json file relative to backend directory or root."""
    possible_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "healthcare_schemes.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "healthcare_schemes.json")),
        os.path.abspath("healthcare_schemes.json"),
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return path
    raise FileNotFoundError("healthcare_schemes.json not found in any expected location.")


async def seed():
    print("[INFO] Re-creating database tables for updated schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[SUCCESS] Database tables created successfully.")

    print("[INFO] Loading healthcare_schemes.json...")
    json_path = find_schemes_json()
    print(f"[INFO] Using dataset file: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        schemes_data = json.load(f)

    print(f"[INFO] Loaded {len(schemes_data)} schemes from JSON.")

    # 1. Clear vector store
    v_store = VectorStore()
    v_store.clear()

    # 2. Open DB Session
    Session = async_sessionmaker(bind=engine, class_=AsyncSession)
    async with Session() as db:
        # Clear existing schemes table for a fresh seed
        print("[INFO] Clearing existing government schemes from database...")
        await db.execute(delete(GovernmentScheme))
        await db.commit()

        for idx, s in enumerate(schemes_data, 1):
            s_id = s.get("scheme_id", f"scheme_{idx:02d}")
            s_name = s.get("scheme_name", "Unknown Healthcare Scheme")
            dept = s.get("department", "Ministry of Health & Family Welfare")
            state = s.get("state", "Central / All India")
            official_url = s.get("official_url", "")
            benefits_summary = s.get("benefits_summary", "")
            coverage_amount = s.get("coverage_amount_inr", "Coverage per scheme rules")
            cashless = s.get("cashless", True)

            elig_criteria = s.get("eligibility_criteria", {})
            target_ben = elig_criteria.get("target_beneficiaries", "")
            age_grp = elig_criteria.get("age_group", "")
            inc_limit = elig_criteria.get("income_limit_per_annum_inr", "")
            bpl_req = elig_criteria.get("bpl_or_secc_required", "")

            eligibility_str = f"Target: {target_ben}. Age: {age_grp}. Income Limit: {inc_limit}. BPL/SECC Required: {bpl_req}."
            benefits_str = f"{benefits_summary} Coverage: {coverage_amount}."

            scheme = GovernmentScheme(
                scheme_id=s_id,
                scheme_name=s_name,
                department=dept,
                state=state,
                category="State Government" if "Central" not in state and "India" not in state else "Central Government",
                coverage_amount=coverage_amount,
                cashless=cashless,
                eligibility=eligibility_str,
                benefits=benefits_str,
                official_url=official_url,
                last_updated=date(2026, 3, 1),
                eligibility_criteria=elig_criteria,
                key_covered_conditions=s.get("key_covered_conditions", []),
                key_exclusions=s.get("key_exclusions", []),
                chunks=s.get("chunks", [])
            )
            db.add(scheme)
            await db.flush()

            # Generate vectors for chunks
            chunks = s.get("chunks", [])
            if not chunks:
                chunks = [f"{s_name} - {benefits_summary}", f"Eligibility: {eligibility_str}"]

            metadatas = [
                {
                    "scheme_id": s_id,
                    "scheme_name": s_name,
                    "official_url": official_url,
                    "department": dept,
                    "state": state
                }
                for _ in chunks
            ]

            print(f"[{idx}/{len(schemes_data)}] Indexing vectors for '{s_name}'...")
            embeddings = await EmbeddingService.get_embeddings(chunks)
            v_store.add_texts(chunks, embeddings, metadatas)

        # Seed Quick Demo User (sarah@example.com)
        from app.models.user import User
        from app.models.profile import PatientProfile
        from app.core.security import hash_password

        res_user = await db.execute(select(User).where(User.email == "sarah@example.com"))
        if not res_user.scalar_one_or_none():
            print("[INFO] Creating demo user sarah@example.com...")
            demo_user = User(
                full_name="Sarah Jenkins",
                email="sarah@example.com",
                password_hash=hash_password("password123"),
                phone="+1234567890",
                role="PATIENT",
                is_verified=True,
            )
            db.add(demo_user)
            await db.flush()

            profile = PatientProfile(
                user_id=demo_user.user_id,
                gender="Female",
                blood_group="O+",
                height_cm=165.0,
                weight_kg=60.0,
                address="123 Health Ave",
                city="Boston",
                state="MA",
                pincode="02115",
            )
            db.add(profile)

        await db.commit()

    print("[SUCCESS] Seeding complete! Schemes & Demo user stored successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
