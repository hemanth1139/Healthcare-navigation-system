"""
Clear fallback hospitals from database to avoid UNIQUE constraint errors.
Run with: python scripts/clear_fallback_hospitals.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def clear_fallback_hospitals():
    """Delete hospitals with fallback_ prefix from database."""
    async with AsyncSessionLocal() as db:
        try:
            # Delete fallback hospitals
            result = await db.execute(
                text("DELETE FROM hospitals WHERE google_place_id LIKE 'fallback_%'")
            )
            deleted_count = result.rowcount
            await db.commit()
            
            print(f"Deleted {deleted_count} fallback hospitals from database")
            print("Migration completed successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"Migration failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(clear_fallback_hospitals())
