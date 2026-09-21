import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import engine, async_sessionmaker, AsyncSession
from app.models.user import User
from app.models.profile import PatientProfile
from app.core.security import hash_password

async def seed_demo():
    Session = async_sessionmaker(bind=engine, class_=AsyncSession)
    async with Session() as db:
        res = await db.execute(select(User).where(User.email == "sarah@example.com"))
        if not res.scalar_one_or_none():
            print("[INFO] Creating demo user sarah@example.com...")
            user = User(
                full_name="Sarah Jenkins",
                email="sarah@example.com",
                password_hash=hash_password("password123"),
                phone="+1234567890",
                role="PATIENT",
                is_verified=True,
            )
            db.add(user)
            await db.flush()

            profile = PatientProfile(
                user_id=user.user_id,
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
            print("[SUCCESS] Demo user sarah@example.com created successfully.")
        else:
            print("[INFO] Demo user sarah@example.com already exists.")

if __name__ == "__main__":
    asyncio.run(seed_demo())
