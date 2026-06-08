from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings

from typing import Optional

class Settings(BaseSettings):
    database_url: str
    shard_1_db_url: Optional[str] = None
    shard_2_db_url: Optional[str] = None
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    env: str = "development"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_pass: str = ""
    resend_api_key: str = ""
    redis_host: str = "localhost"
    redis_password: str = ""
    redis_port: int = 6379

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Database setup
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

# Engine 1 (Users, Profiles, Competencies)
engine1 = create_engine(settings.shard_1_db_url or settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocalShard1 = sessionmaker(autocommit=False, autoflush=False, bind=engine1)

# Engine 2 (Chat, Reviews, Goals, Achievements)
engine2 = create_engine(settings.shard_2_db_url or settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocalShard2 = sessionmaker(autocommit=False, autoflush=False, bind=engine2)

Base1 = declarative_base()
Base2 = declarative_base()

def get_shard1_db():
    """Dependency for getting Shard 1 (Core Data) database session."""
    db = SessionLocalShard1()
    try:
        yield db
    finally:
        db.close()

def get_shard2_db():
    """Dependency for getting Shard 2 (Logs/Chat) database session."""
    db = SessionLocalShard2()
    try:
        yield db
    finally:
        db.close()


from sqlalchemy import event
from sqlalchemy.orm import Session
from app.websocket import manager
import asyncio

def trigger_broadcast(session):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Schedule the broadcast in the running event loop
        loop.create_task(manager.broadcast('update'))

@event.listens_for(Session, "after_commit")
def after_commit(session):
    # Any commit will trigger a broadcast
    trigger_broadcast(session)
