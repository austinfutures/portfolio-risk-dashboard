from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    weight = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)