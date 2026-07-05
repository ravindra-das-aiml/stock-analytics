import httpx
from loguru import logger
from datetime import datetime

MOCK_NEWS = [
    {"title": "Apple hits new quarterly revenue record", "source": "Reuters", "url": "#", "time": "2h ago", "sentiment": "positive", "symbol": "AAPL"},
    {"title": "Tesla delivery numbers beat expectations", "source": "Bloomberg", "url": "#", "time": "3h ago", "sentiment": "positive", "symbol": "TSLA"},
    {"title": "Microsoft Azure cloud growth slows down", "source": "CNBC", "url": "#", "time": "4h ago", "sentiment": "negative", "symbol": "MSFT"},
    {"title": "NVIDIA announces next-gen AI chips", "source": "TechCrunch", "url": "#", "time": "5h ago", "sentiment": "positive", "symbol": "NVDA"},
    {"title": "Fed signals interest rate cut in September", "source": "WSJ", "url": "#", "time": "6h ago", "sentiment": "positive", "symbol": "MARKET"},
    {"title": "Oil prices rise amid Middle East tensions", "source": "Reuters", "url": "#", "time": "7h ago", "sentiment": "negative", "symbol": "MARKET"},
    {"title": "Google faces antitrust ruling in Europe", "source": "FT", "url": "#", "time": "8h ago", "sentiment": "negative", "symbol": "GOOGL"},
    {"title": "Amazon expands same-day delivery to 50 cities", "source": "Forbes", "url": "#", "time": "9h ago", "sentiment": "positive", "symbol": "AMZN"},
]

class NewsService:
    async def get_news(self, symbol: str = None):
        if symbol:
            filtered = [n for n in MOCK_NEWS if n["symbol"] == symbol.upper() or n["symbol"] == "MARKET"]
            return filtered if filtered else MOCK_NEWS[:4]
        return MOCK_NEWS

news_service = NewsService()
