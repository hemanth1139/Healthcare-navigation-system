import asyncio
from app.core.database import engine
from sqlalchemy import text

async def check_schemes():
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT COUNT(*) FROM government_schemes'))
        count = result.scalar()
        print(f'Schemes in database: {count}')
        
        # Get a sample scheme
        sample = await conn.execute(text('SELECT scheme_id, scheme_name, chunks FROM government_schemes LIMIT 1'))
        row = sample.fetchone()
        if row:
            print(f'Sample scheme: {row[0]} - {row[1]}')
            print(f'Has chunks: {bool(row[2])}')

if __name__ == "__main__":
    asyncio.run(check_schemes())
