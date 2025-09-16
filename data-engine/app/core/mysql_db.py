import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Base 클래스 (모든 엔티티는 이걸 상속받음)
Base = declarative_base()

def get_engine():
    # MYSQL_URL 
    url = os.environ.get("MYSQL_URL")
    # SQLAlchemy는 "mysql+pymysql://" 형식 필요
    if url.startswith("mysql://"):
        url = url.replace("mysql://", "mysql+pymysql://")
    return create_engine(url, echo=False, pool_recycle=3600)

# 세션 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())