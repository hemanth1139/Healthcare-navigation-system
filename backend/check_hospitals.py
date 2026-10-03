import asyncio
from app.core.database import engine
from sqlalchemy import text

async def count_hospitals():
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT COUNT(*) FROM hospitals'))
        count = result.scalar()
        print(f'Hospitals in database: {count}')

if __name__ == "__main__":
    asyncio.run(count_hospitals())
