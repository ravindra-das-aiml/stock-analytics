import numpy as np
from loguru import logger

def simple_moving_average(prices: list, window: int = 5) -> list:
    result = []
    for i in range(len(prices)):
        if i < window:
            result.append(prices[i])
        else:
            result.append(sum(prices[i-window:i]) / window)
    return result

def predict_next_prices(historical_data: list, days: int = 7) -> dict:
    try:
        prices = [d["close"] for d in historical_data]
        if len(prices) < 10:
            return {"error": "Data kam hai"}

        prices_arr = np.array(prices)
        
        # Trend calculate karo
        recent = prices_arr[-5:]
        older = prices_arr[-10:-5]
        trend = (recent.mean() - older.mean()) / older.mean()
        
        # Volatility
        returns = np.diff(prices_arr) / prices_arr[:-1]
        volatility = returns.std()
        
        # Moving averages
        ma5 = simple_moving_average(prices, 5)
        ma10 = simple_moving_average(prices, 10)
        
        # Next 7 days predict karo
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

        # Concentration risk
        max_weight = max(weights) if weights else 0
        concentration_risk = max_weight * 100

        # Average P&L
        avg_pl = sum(pl_percents) / len(pl_percents) if pl_percents else 0
        
        # Risk Score (0-100)
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

        # Sharpe Ratio (simplified)
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
