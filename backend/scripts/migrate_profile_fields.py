"""
Migration script to add enhanced profile fields for RAG system.
Adds: annual_income, employment_status, family_size, ration_card_type, disability_status, pregnancy_status

Usage:
    # From backend directory with venv activated:
    python scripts/migrate_profile_fields.py
    
    # Or with venv explicitly:
    venv/Scripts/python scripts/migrate_profile_fields.py
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from sqlalchemy import text
    from app.core.database import engine
except ImportError as e:
    print("Error: Could not import required modules.")
    print("Please ensure you're running this script with the virtual environment activated:")
    print("  venv\\Scripts\\python scripts\\migrate_profile_fields.py")
    sys.exit(1)


async def migrate():
    print("Starting profile fields migration...")

    async with engine.begin() as conn:
        # Check if columns already exist (SQLite-compatible)
        result = await conn.execute(text("""
            PRAGMA table_info(patient_profiles)
        """))
        existing_columns = {row[1] for row in result}  # column_name is at index 1

        # Add new columns if they don't exist
        new_columns = {
            'annual_income': 'NUMERIC(12, 2)',
            'employment_status': 'VARCHAR(50)',
            'family_size': 'INTEGER',
            'ration_card_type': 'VARCHAR(50)',
            'disability_status': 'VARCHAR(50)',
            'pregnancy_status': 'VARCHAR(50)',
        }

        for col_name, col_type in new_columns.items():
            if col_name not in existing_columns:
                print(f"Adding column: {col_name}")
                await conn.execute(text(f"""
                    ALTER TABLE patient_profiles 
                    ADD COLUMN {col_name} {col_type}
                """))
            else:
                print(f"Column {col_name} already exists, skipping...")

    print("Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
