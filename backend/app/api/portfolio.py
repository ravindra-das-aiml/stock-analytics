from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.portfolio import Portfolio
from app.models.user import User
from app.api.auth import get_current_user
from app.services.stock_service import stock_service

router = APIRouter()

class BuyStockRequest(BaseModel):
    symbol: str
    quantity: float
    buy_price: float

@router.get("/")
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == current_user.id)
    )
    holdings = result.scalars().all()
    
    portfolio = []
    total_invested = 0
    total_current = 0
    
    for h in holdings:
        stock = await stock_service.get_stock_info(h.symbol)
        current_price = stock["current_price"] if stock else h.buy_price
        invested = h.buy_price * h.quantity
        current_value = current_price * h.quantity
        profit_loss = current_value - invested
        
        total_invested += invested
        total_current += current_value
        
        portfolio.append({
            "id": h.id,
            "symbol": h.symbol,
            "quantity": h.quantity,
            "buy_price": h.buy_price,
            "current_price": current_price,
            "invested": round(invested, 2),
            "current_value": round(current_value, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_loss_percent": round((profit_loss / invested) * 100, 2),
        })
    
    return {
        "holdings": portfolio,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current, 2),
        "total_profit_loss": round(total_current - total_invested, 2),
    }

@router.post("/buy")
async def buy_stock(
    data: BuyStockRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    holding = Portfolio(
        user_id=current_user.id,
        symbol=data.symbol.upper(),
        quantity=data.quantity,
        buy_price=data.buy_price,
    )
    db.add(holding)
    await db.commit()
    await db.refresh(holding)
    return {"message": f"{data.quantity} shares of {data.symbol} added!", "id": holding.id}

@router.delete("/{holding_id}")
async def sell_stock(
    holding_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == holding_id,
            Portfolio.user_id == current_user.id
        )
    )
    holding = result.scalar_one_or_none()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    await db.delete(holding)
    await db.commit()
    return {"message": "Stock sold successfully"}
