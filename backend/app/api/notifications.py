from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.models.alert import Alert
from app.api.auth import get_current_user
from app.services.stock_service import stock_service

router = APIRouter()

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

@router.get("/check-alerts")
async def check_and_notify(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Alert).where(Alert.user_id == current_user.id, Alert.is_active == True)
    )
    alerts = result.scalars().all()
    notifications = []

    for alert in alerts:
        stock = await stock_service.get_stock_info(alert.symbol)
        if not stock:
            continue
        current_price = stock["current_price"]
        triggered = False

        if alert.condition == "above" and current_price >= alert.target_price:
            triggered = True
        elif alert.condition == "below" and current_price <= alert.target_price:
            triggered = True

        if triggered:
            notifications.append({
                "symbol": alert.symbol,
                "condition": alert.condition,
                "target": alert.target_price,
                "current": current_price,
                "message": f"{alert.symbol} is {alert.condition} your target of ${alert.target_price}! Current: ${current_price}"
            })
            alert.is_active = False

    await db.commit()
    return {"notifications": notifications, "count": len(notifications)}
