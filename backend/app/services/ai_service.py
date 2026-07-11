import numpy as np
from loguru import logger
import random

def simple_moving_average(prices: list, window: int = 5) -> list:
    result = []
    for i in range(len(prices)):
        if i < window:
            result.append(prices[i])
        else:
            result.append(sum(prices[i-window:i]) / window)
    return result

def analyze_sentiment(symbol: str) -> dict:
    sentiments = {
        "AAPL": {"positive": 75, "negative": 15, "neutral": 10, "overall": "Bullish"},
        "TSLA": {"positive": 72, "negative": 18, "neutral": 10, "overall": "Bullish"},
        "MSFT": {"positive": 80, "negative": 10, "neutral": 10, "overall": "Very Bullish"},
        "NVDA": {"positive": 85, "negative": 8, "neutral": 7, "overall": "Very Bullish"},
        "GOOGL": {"positive": 70, "negative": 20, "neutral": 10, "overall": "Bullish"},
        "RELIANCE.NS": {"positive": 68, "negative": 22, "neutral": 10, "overall": "Bullish"},
        "TCS.NS": {"positive": 65, "negative": 25, "neutral": 10, "overall": "Neutral"},
        "INFY.NS": {"positive": 60, "negative": 28, "neutral": 12, "overall": "Neutral"},
    }
    default = {
        "positive": random.randint(50, 80),
        "negative": random.randint(10, 30),
        "neutral": random.randint(5, 20),
        "overall": random.choice(["Bullish", "Bearish", "Neutral"])
    }
    return sentiments.get(symbol.upper(), default)

def analyze_stock(symbol: str, historical_data: list) -> dict:
    try:
        prices = [d["close"] for d in historical_data]
        volumes = [d["volume"] for d in historical_data]
        prices_arr = np.array(prices)
        recent = prices_arr[-5:]
        older = prices_arr[-10:-5]
        trend = (recent.mean() - older.mean()) / older.mean() * 100
        returns = np.diff(prices_arr) / prices_arr[:-1]
        volatility = returns.std() * 100
        ma5 = simple_moving_average(prices, 5)[-1]
        ma10 = simple_moving_average(prices, 10)[-1]
        ma20 = simple_moving_average(prices, 20)[-1] if len(prices) >= 20 else prices[-1]
        support = round(float(prices_arr[-20:].min()), 2)
        resistance = round(float(prices_arr[-20:].max()), 2)
        current_price = prices[-1]
        avg_volume = sum(volumes) / len(volumes)
        if trend > 2 and ma5 > ma10:
            trend_label = "Bullish"
            trend_color = "green"
            suggestion = "Buy"
        elif trend < -2 and ma5 < ma10:
            trend_label = "Bearish"
            trend_color = "red"
            suggestion = "Sell"
        else:
            trend_label = "Neutral"
            trend_color = "yellow"
            suggestion = "Hold"
        if volatility > 3:
            risk = "High"
        elif volatility > 1.5:
            risk = "Medium"
        else:
            risk = "Low"
        rsi = max(0, min(100, 50 + trend * 2))
        sentiment = analyze_sentiment(symbol)
        return {
            "symbol": symbol.upper(),
            "current_price": round(current_price, 2),
            "trend": round(trend, 2),
            "trend_label": trend_label,
            "trend_color": trend_color,
            "risk": risk,
            "suggestion": suggestion,
            "support": support,
            "resistance": resistance,
            "ma5": round(ma5, 2),
            "ma10": round(ma10, 2),
            "ma20": round(ma20, 2),
            "volatility": round(volatility, 2),
            "rsi": round(rsi, 1),
            "avg_volume": int(avg_volume),
            "sentiment": sentiment,
        }
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return {"error": str(e)}

def predict_next_prices(historical_data: list, days: int = 7) -> dict:
    try:
        prices = [d["close"] for d in historical_data]
        if len(prices) < 10:
            return {"error": "Data kam hai"}
        prices_arr = np.array(prices)
        recent = prices_arr[-5:]
        older = prices_arr[-10:-5]
        trend = (recent.mean() - older.mean()) / older.mean()
        returns = np.diff(prices_arr) / prices_arr[:-1]
        volatility = returns.std()
        ma5 = simple_moving_average(prices, 5)
        ma10 = simple_moving_average(prices, 10)
        last_price = prices[-1]
        predictions = []
        price = last_price
        for i in range(1, days + 1):
            daily_return = trend * 0.1 + np.random.normal(0, volatility * 0.5)
            price = price * (1 + daily_return)
            predictions.append({
                "day": i,
                "predicted_price": round(price, 2),
                "confidence": round(max(50, 85 - i * 3), 1),
            })
        current_ma5 = ma5[-1]
        current_ma10 = ma10[-1]
        if current_ma5 > current_ma10 and trend > 0:
            signal = "BUY"
            signal_strength = "Strong"
        elif current_ma5 < current_ma10 and trend < 0:
            signal = "SELL"
            signal_strength = "Strong"
        elif trend > 0:
            signal = "BUY"
            signal_strength = "Weak"
        else:
            signal = "HOLD"
            signal_strength = "Neutral"
        return {
            "current_price": round(last_price, 2),
            "predicted_7day": predictions,
            "signal": signal,
            "signal_strength": signal_strength,
            "trend": round(trend * 100, 2),
            "volatility": round(volatility * 100, 2),
            "ma5": round(current_ma5, 2),
            "ma10": round(current_ma10, 2),
            "support": round(float(prices_arr[-20:].min()), 2),
            "resistance": round(float(prices_arr[-20:].max()), 2),
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {"error": str(e)}

def analyze_risk(holdings: list) -> dict:
    try:
        if not holdings:
            return {"risk_score": 0, "message": "Portfolio khali hai"}
        total_value = sum(h["current_value"] for h in holdings)
        total_pl = sum(h["profit_loss"] for h in holdings)
        weights = []
        pl_percents = []
        for h in holdings:
            weight = h["current_value"] / total_value if total_value > 0 else 0
            weights.append(weight)
            pl_percents.append(h["profit_loss_percent"])
        max_weight = max(weights) if weights else 0
        concentration_risk = max_weight * 100
        avg_pl = sum(pl_percents) / len(pl_percents) if pl_percents else 0
        risk_score = min(100, concentration_risk * 0.5 + abs(avg_pl) * 0.5)
        if risk_score < 30:
            risk_level = "Low"
            risk_color = "green"
        elif risk_score < 60:
            risk_level = "Medium"
            risk_color = "yellow"
        else:
            risk_level = "High"
            risk_color = "red"
        sharpe = avg_pl / (sum(abs(p) for p in pl_percents) / len(pl_percents) + 0.001) if pl_percents else 0
        return {
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "total_value": round(total_value, 2),
            "total_pl": round(total_pl, 2),
            "total_pl_percent": round((total_pl / (total_value - total_pl)) * 100, 2) if total_value > total_pl else 0,
            "sharpe_ratio": round(sharpe, 2),
            "concentration_risk": round(concentration_risk, 1),
            "num_holdings": len(holdings),
            "recommendation": "Diversify karo" if concentration_risk > 50 else "Portfolio balanced hai",
        }
    except Exception as e:
        logger.error(f"Risk analysis error: {e}")
        return {"error": str(e)}

SCREENER_DATA = [
    {"symbol": "AAPL", "name": "Apple Inc", "price": 283.78, "market_cap": 4300, "pe_ratio": 28.5, "growth": 12.5, "dividend": 0.5, "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft", "price": 415.32, "market_cap": 3100, "pe_ratio": 35.2, "growth": 18.3, "dividend": 0.8, "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA", "price": 138.85, "market_cap": 3400, "pe_ratio": 45.6, "growth": 85.2, "dividend": 0.1, "sector": "Technology"},
    {"symbol": "TSLA", "name": "Tesla", "price": 379.71, "market_cap": 1200, "pe_ratio": 65.3, "growth": 22.1, "dividend": 0.0, "sector": "Automotive"},
    {"symbol": "GOOGL", "name": "Alphabet", "price": 178.92, "market_cap": 2200, "pe_ratio": 22.4, "growth": 15.7, "dividend": 0.0, "sector": "Technology"},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "price": 2987.45, "market_cap": 2000, "pe_ratio": 26.8, "growth": 14.2, "dividend": 1.2, "sector": "Conglomerate"},
    {"symbol": "TCS.NS", "name": "TCS", "price": 3456.78, "market_cap": 1260, "pe_ratio": 28.9, "growth": 11.5, "dividend": 3.2, "sector": "IT Services"},
    {"symbol": "INFY.NS", "name": "Infosys", "price": 1567.89, "market_cap": 650, "pe_ratio": 24.5, "growth": 9.8, "dividend": 2.8, "sector": "IT Services"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "price": 1678.90, "market_cap": 1250, "pe_ratio": 18.5, "growth": 16.3, "dividend": 1.5, "sector": "Banking"},
    {"symbol": "SBIN.NS", "name": "SBI", "price": 876.54, "market_cap": 780, "pe_ratio": 9.8, "growth": 22.5, "dividend": 2.1, "sector": "Banking"},
]

def screen_stocks(min_market_cap=0, max_pe=999, min_growth=0, min_dividend=0, sector=None):
    results = []
    for stock in SCREENER_DATA:
        if (stock["market_cap"] >= min_market_cap and
            stock["pe_ratio"] <= max_pe and
            stock["growth"] >= min_growth and
            stock["dividend"] >= min_dividend):
            if sector is None or sector == "" or stock["sector"].lower() == sector.lower():
                results.append(stock)
    return results
