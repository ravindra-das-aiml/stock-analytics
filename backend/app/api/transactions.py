from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    )

    transactions = result.scalars().all()

    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "type": t.transaction_type,
            "quantity": t.quantity,
            "price": t.price,
            "total": t.total,
            "date": t.created_at,
        }
        for t in transactions
    ]