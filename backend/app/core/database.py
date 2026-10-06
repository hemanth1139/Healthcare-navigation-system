"""
SQLAlchemy async database engine, session factory, and Base declarative class.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event

from app.config import settings


# ─── Declarative Base ────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """All ORM models inherit from this base."""
    pass


# ─── Async Engine ────────────────────────────────────────────────────────────
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine_kwargs = {"echo": settings.DATABASE_ECHO}

if db_url.startswith("sqlite"):
    # SQLite permits only one writer at a time. Wait for brief write contention
    # instead of immediately failing with "database is locked". WAL also lets
    # readers proceed while a write is in progress (writes remain serialized).
    engine_kwargs["connect_args"] = {
        "check_same_thread": False,
        "timeout": 30,
    }
else:
    # PostgreSQL-specific pooling arguments
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(
    db_url,
    **engine_kwargs
)

if db_url.startswith("sqlite"):
    @event.listens_for(engine.sync_engine, "connect")
    def _configure_sqlite_connection(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        finally:
            cursor.close()

# ─── Session Factory ─────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """
    FastAPI dependency — yields an async database session.
    Automatically commits on success, rolls back on exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
