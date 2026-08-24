"""
Seed script to insert government healthcare schemes into the database
and generate vectors for RAG similarity search.
"""

import asyncio
import sys
import os
from datetime import date

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import engine, AsyncSession, async_sessionmaker
from app.models.scheme import GovernmentScheme
from app.rag.embeddings import EmbeddingService
from app.rag.vectorstore import VectorStore

# Mock scheme details database mapping
SCHEMES_DATA = [
    {
        "scheme_name": "Ayushman Bharat PM-JAY",
        "department": "National Health Authority",
        "eligibility": "Families identified in Socio-Economic Caste Census (SECC) 2011, BPL card holders, and low-income households.",
        "benefits": "Provides hospitalization coverage up to ₹5 Lakhs per family annually for secondary and tertiary care. Zero cost paperless/cashless treatment in public and empanelled private hospitals.",
        "official_url": "https://pmjay.gov.in",
        "last_updated": date(2026, 3, 1),
        "chunks": [
            "Ayushman Bharat PM-JAY provides distinct secondary and tertiary healthcare coverage up to ₹5,00,000 per family per year.",
            "PM-JAY is fully cashless and paperless, valid across all empanelled public and private hospital options in India.",
            "Eligibility for Ayushman Bharat is mapped directly to families registered under low-income thresholds and SECC 2011 lists."
        ]
    },
    {
        "scheme_name": "Central Government Health Scheme (CGHS)",
        "department": "Ministry of Health and Family Welfare",
        "eligibility": "Active central government employees, pensioners, members of parliament, and other eligible beneficiaries.",
        "benefits": "Provides comprehensive medical care including OPD consultation at wellness centers, indoor treatment at government and empanelled private hospitals, cashless facility for pensioners, and reimbursement for emergency treatment.",
        "official_url": "https://cghs.nic.in",
        "last_updated": date(2026, 1, 15),
        "chunks": [
            "Central Government Health Scheme (CGHS) provides comprehensive health care to central government employees and pensioners.",
            "CGHS includes OPD consulting, diagnostics, and cashless treatments in accredited private hospital partners.",
            "CGHS eligibility covers active central staff, retired government workers, and select parliament members."
        ]
    },
    {
        "scheme_name": "Tamil Nadu CMCHIS",
        "department": "Department of Health & Family Welfare, Tamil Nadu",
        "eligibility": "Residents of Tamil Nadu with annual family income below ₹1,20,000.",
        "benefits": "Provides cashless hospitalization up to ₹5 Lakhs per annum for secondary and tertiary care across empanelled hospitals in Tamil Nadu.",
        "official_url": "https://www.cmchistn.com",
        "last_updated": date(2026, 2, 28),
        "chunks": [
            "Tamil Nadu Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS) provides coverage up to ₹5,00,000 per year.",
            "CMCHIS covers medical and surgical procedures across empanelled hospitals for families with annual income under ₹1.2 Lakhs.",
            "CMCHIS is valid across accredited private and public hospitals located within the state of Tamil Nadu."
        ]
    }
]


async def seed():
    print("[INFO] Seeding government schemes and vector index...")
    
    # 1. Clear vector store
    v_store = VectorStore()
    v_store.clear()
    
    # 2. Open DB Session
    Session = async_sessionmaker(bind=engine, class_=AsyncSession)
    async with Session() as db:
        # Check if already seeded
        result = await db.execute(select(GovernmentScheme).limit(1))
        if result.scalar_one_or_none():
            print("[WARN] Government schemes already seeded in DB. Clearing table for fresh seed.")
            await db.execute(select(GovernmentScheme).delete())
            await db.commit()

        for s in SCHEMES_DATA:
            # Create DB row
            scheme = GovernmentScheme(
                scheme_name=s["scheme_name"],
                department=s["department"],
                eligibility=s["eligibility"],
                benefits=s["benefits"],
                official_url=s["official_url"],
                last_updated=s["last_updated"]
            )
            db.add(scheme)
            await db.flush() # Populate scheme_id

            # 3. Generate embeddings and index chunks
            texts = s["chunks"]
            metadatas = [
                {
                    "scheme_id": str(scheme.scheme_id),
                    "scheme_name": s["scheme_name"],
                    "official_url": s["official_url"]
                }
                for _ in texts
            ]
            
            print(f"[PROCESS] Generating vectors for {s['scheme_name']}...")
            embeddings = await EmbeddingService.get_embeddings(texts)
            v_store.add_texts(texts, embeddings, metadatas)
            
        await db.commit()
    print("[SUCCESS] Seeding complete! Schemes seeded in DB and Vector Store.")


if __name__ == "__main__":
    asyncio.run(seed())
