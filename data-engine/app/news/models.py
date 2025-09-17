from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    # 역참조 (옵션) → Category.news_list 로 News 접근 가능
    news_list = relationship("News", back_populates="category")




class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False, unique=True)
    summary = Column(String(1000), nullable=False)
    published_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)

    # Category와의 관계 설정
    category = relationship("Category", back_populates="news_list")
