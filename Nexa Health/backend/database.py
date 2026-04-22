from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use PostgreSQL if available, otherwise fallback to SQLite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nexa_health.db")

if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

