import httpx
from loguru import logger
from app.core.config import settings
import random
from datetime import datetime, timedelta

MOCK_STOCKS = {
    # US Stocks
    "AAPL": {"name": "Apple Inc", "price": 283.78, "change": 8.63, "change_percent": "3.14%", "high": 285.95, "low": 274.21, "volume": 261775450},
    "TSLA": {"name": "Tesla Inc", "price": 379.71, "change": 4.61, "change_percent": "1.22%", "high": 387.8, "low": 368.6, "volume": 98234567},
    "MSFT": {"name": "Microsoft Corp", "price": 415.32, "change": -2.18, "change_percent": "-0.52%", "high": 419.50, "low": 412.10, "volume": 45678901},
    "NVDA": {"name": "NVIDIA Corp", "price": 138.85, "change": 3.25, "change_percent": "2.40%", "high": 141.20, "low": 135.60, "volume": 187654321},
    "GOOGL": {"name": "Alphabet Inc", "price": 178.92, "change": 1.43, "change_percent": "0.81%", "high": 180.50, "low": 176.30, "volume": 34567890},
    "AMZN": {"name": "Amazon.com Inc", "price": 225.45, "change": -1.23, "change_percent": "-0.54%", "high": 228.90, "low": 223.10, "volume": 56789012},
    "META": {"name": "Meta Platforms", "price": 612.34, "change": 8.92, "change_percent": "1.48%", "high": 618.50, "low": 605.20, "volume": 23456789},
    # Indian Stocks - NSE
    "RELIANCE.NS": {"name": "Reliance Industries", "price": 2987.45, "change": 45.30, "change_percent": "1.54%", "high": 3010.00, "low": 2965.00, "volume": 12345678},
    "TCS.NS": {"name": "Tata Consultancy Services", "price": 3456.78, "change": -23.45, "change_percent": "-0.67%", "high": 3489.00, "low": 3440.00, "volume": 8765432},
    "INFY.NS": {"name": "Infosys Ltd", "price": 1567.89, "change": 12.34, "change_percent": "0.79%", "high": 1580.00, "low": 1555.00, "volume": 9876543},
    "HDFCBANK.NS": {"name": "HDFC Bank Ltd", "price": 1678.90, "change": -8.45, "change_percent": "-0.50%", "high": 1695.00, "low": 1670.00, "volume": 7654321},
    "WIPRO.NS": {"name": "Wipro Ltd", "price": 456.78, "change": 5.67, "change_percent": "1.26%", "high": 462.00, "low": 450.00, "volume": 6543210},
    "ICICIBANK.NS": {"name": "ICICI Bank Ltd", "price": 1234.56, "change": 15.67, "change_percent": "1.28%", "high": 1245.00, "low": 1225.00, "volume": 8901234},
    "BHARTIARTL.NS": {"name": "Bharti Airtel Ltd", "price": 1789.45, "change": 23.45, "change_percent": "1.33%", "high": 1800.00, "low": 1778.00, "volume": 5432109},
    "TATAMOTORS.NS": {"name": "Tata Motors Ltd", "price": 987.65, "change": -12.34, "change_percent": "-1.23%", "high": 1005.00, "low": 982.00, "volume": 11234567},
    "SBIN.NS": {"name": "State Bank of India", "price": 876.54, "change": 9.87, "change_percent": "1.14%", "high": 885.00, "low": 868.00, "volume": 15678901},
    "BAJFINANCE.NS": {"name": "Bajaj Finance Ltd", "price": 7654.32, "change": -45.67, "change_percent": "-0.59%", "high": 7720.00, "low": 7630.00, "volume": 2345678},
    "ADANIENT.NS": {"name": "Adani Enterprises", "price": 2345.67, "change": 34.56, "change_percent": "1.50%", "high": 2370.00, "low": 2320.00, "volume": 4567890},
    "MARUTI.NS": {"name": "Maruti Suzuki India", "price": 12345.67, "change": 123.45, "change_percent": "1.01%", "high": 12450.00, "low": 12280.00, "volume": 1234567},
    "SUNPHARMA.NS": {"name": "Sun Pharmaceutical", "price": 1678.90, "change": -8.90, "change_percent": "-0.53%", "high": 1695.00, "low": 1665.00, "volume": 3456789},
    "ZOMATO.NS": {"name": "Zomato Ltd", "price": 234.56, "change": 5.67, "change_percent": "2.48%", "high": 238.00, "low": 229.00, "volume": 23456789},
    "PAYTM.NS": {"name": "One97 Communications", "price": 456.78, "change": -12.34, "change_percent": "-2.63%", "high": 472.00, "low": 452.00, "volume": 12345678},
}

def generate_history(base_price: float):
    data = []
    price = base_price
    for i in range(30, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        change = random.uniform(-0.03, 0.03)
        open_p = round(price, 2)
        close_p = round(price * (1 + change), 2)
        high_p = round(max(open_p, close_p) * random.uniform(1.001, 1.02), 2)
        low_p = round(min(open_p, close_p) * random.uniform(0.98, 0.999), 2)
        data.append({
            "date": date,
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "volume": random.randint(1000000, 300000000),
        })
        price = close_p
    return data

class StockService:
    BASE_URL = "https://www.alphavantage.co/query"

    async def get_stock_info(self, symbol: str):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(self.BASE_URL, params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": settings.ALPHA_VANTAGE_API_KEY,
                })
                data = response.json()
                quote = data.get("Global Quote", {})
                if quote and quote.get("05. price"):
                    return {
                        "symbol": symbol.upper(),
                        "current_price": float(quote.get("05. price", 0)),
                        "open_price": float(quote.get("02. open", 0)),
                        "high_price": float(quote.get("03. high", 0)),
                        "low_price": float(quote.get("04. low", 0)),
                        "volume": int(quote.get("06. volume", 0)),
                        "change": float(quote.get("09. change", 0)),
                        "change_percent": quote.get("10. change percent", "0%"),
                    }
        except Exception as e:
            logger.warning(f"API failed for {symbol}, using mock: {e}")

        sym = symbol.upper()
        if sym in MOCK_STOCKS:
            m = MOCK_STOCKS[sym]
            noise = random.uniform(-0.5, 0.5)
            return {
                "symbol": sym,
                "name": m["name"],
                "current_price": round(m["price"] + noise, 2),
                "open_price": round(m["price"] - random.uniform(0, 2), 2),
                "high_price": round(m["high"] + noise, 2),
                "low_price": round(m["low"] + noise, 2),
                "volume": m["volume"],
                "change": round(m["change"] + noise, 2),
                "change_percent": m["change_percent"],
            }
        return None

    async def get_historical_data(self, symbol: str, period: str = "1mo"):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(self.BASE_URL, params={
                    "function": "TIME_SERIES_DAILY",
                    "symbol": symbol,
                    "outputsize": "compact",
                    "apikey": settings.ALPHA_VANTAGE_API_KEY,
                })
                data = response.json()
                time_series = data.get("Time Series (Daily)", {})
                if time_series:
                    result = []
                    for date, values in list(time_series.items())[:30]:
                        result.append({
                            "date": date,
                            "open": float(values["1. open"]),
                            "high": float(values["2. high"]),
                            "low": float(values["3. low"]),
                            "close": float(values["4. close"]),
                            "volume": int(values["5. volume"]),
                        })
                    return result
        except Exception as e:
            logger.warning(f"History API failed for {symbol}, using mock: {e}")

        sym = symbol.upper()
        base = MOCK_STOCKS.get(sym, {}).get("price", 100)
        return generate_history(base)

    async def search_stocks(self, query: str):
        results = []
        for symbol, info in MOCK_STOCKS.items():
            if query.upper() in symbol or query.lower() in info["name"].lower():
                results.append({
                    "symbol": symbol,
                    "name": info["name"],
                    "type": "NSE" if ".NS" in symbol else "NYSE/NASDAQ",
                })
        return results[:8]

stock_service = StockService()
