"""
Async SQLAlchemy database engine and session management.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=3,          # Free tier: keep connections low
    max_overflow=2,       # Max 5 total connections (Supabase free limit)
    pool_pre_ping=True,   # Check connection health before use
    pool_recycle=300,     # Recycle connections every 5 minutes
    pool_timeout=10,      # Fail fast if no connection available
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency: yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
