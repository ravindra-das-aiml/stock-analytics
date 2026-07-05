from fastapi import APIRouter
from app.services.news_service import news_service

router = APIRouter()

@router.get("/")
async def get_news(symbol: str = None):
    news = await news_service.get_news(symbol)
    return {"news": news}
