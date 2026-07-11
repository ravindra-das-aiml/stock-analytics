from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.api.auth import get_current_user
from app.services.stock_service import stock_service
from app.services.ai_service import predict_next_prices, analyze_risk, analyze_stock, screen_stocks, analyze_sentiment

router = APIRouter()

@router.get("/predict/{symbol}")
async def predict_stock(symbol: str):
    history = await stock_service.get_historical_data(symbol)
    if not history:
        raise HTTPException(status_code=404, detail="Data nahi mila")
    prediction = predict_next_prices(history)
    return {"symbol": symbol.upper(), **prediction}

@router.get("/analyze/{symbol}")
async def analyze_stock_endpoint(symbol: str):
    history = await stock_service.get_historical_data(symbol)
    if not history:
        raise HTTPException(status_code=404, detail="Data nahi mila")
    analysis = analyze_stock(symbol, history)
    return analysis

@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    sentiment = analyze_sentiment(symbol)
    return {"symbol": symbol.upper(), **sentiment}

@router.get("/screener")
async def stock_screener(
    min_market_cap: float = 0,
    max_pe: float = 999,
    min_growth: float = 0,
    min_dividend: float = 0,
    sector: str = ""
):
    results = screen_stocks(min_market_cap, max_pe, min_growth, min_dividend, sector)
    return {"results": results, "count": len(results)}

@router.get("/risk")
async def get_risk_analysis(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == current_user.id))
    holdings = result.scalars().all()
    portfolio_data = []
    for h in holdings:
        stock = await stock_service.get_stock_info(h.symbol)
        current_price = stock["current_price"] if stock else h.buy_price
        invested = h.buy_price * h.quantity
        current_value = current_price * h.quantity
        profit_loss = current_value - invested
        portfolio_data.append({
            "symbol": h.symbol,
            "current_value": current_value,
            "profit_loss": profit_loss,
            "profit_loss_percent": (profit_loss / invested) * 100 if invested > 0 else 0,
        })
    return analyze_risk(portfolio_data)
