from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    google_sub = Column(String(64), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    nickname = Column(String(50))
    profile_image = Column(String(500))
    role = Column(String(10), nullable=False, default="USER")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)