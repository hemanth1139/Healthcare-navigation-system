"""
Migration to add opening_hours and beds fields to hospitals table.
Run with: python scripts/add_hospital_fields.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def add_hospital_fields():
    """Add opening_hours and beds columns to hospitals table."""
    async with AsyncSessionLocal() as db:
        try:
            # Check if columns already exist
            result = await db.execute(text("PRAGMA table_info(hospitals)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "opening_hours" not in columns:
                await db.execute(text("ALTER TABLE hospitals ADD COLUMN opening_hours TEXT"))
                print("Added opening_hours column")
            else:
                print("opening_hours column already exists")
            
            if "beds" not in columns:
                await db.execute(text("ALTER TABLE hospitals ADD COLUMN beds INTEGER"))
                print("Added beds column")
            else:
                print("beds column already exists")
            
            await db.commit()
            print("\nMigration completed successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"Migration failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(add_hospital_fields())
