from fastapi import APIRouter, HTTPException
from app.services.stock_service import stock_service

router = APIRouter()

@router.get("/search")
async def search_stocks(q: str):
    results = await stock_service.search_stocks(q)
    return {"results": results}

@router.get("/{symbol}")
async def get_stock(symbol: str):
    data = await stock_service.get_stock_info(symbol)
    if not data:
        raise HTTPException(status_code=404, detail="Stock not found")
    return data

@router.get("/{symbol}/history")
async def get_history(symbol: str, period: str = "1mo"):
    data = await stock_service.get_historical_data(symbol, period)
    if not data:
        raise HTTPException(status_code=404, detail="No data found")
    return {"symbol": symbol, "period": period, "data": data}
