from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    symbol = Column(String, nullable=False)

    transaction_type = Column(String, nullable=False)

    quantity = Column(Float, nullable=False)

    price = Column(Float, nullable=False)

    total = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)