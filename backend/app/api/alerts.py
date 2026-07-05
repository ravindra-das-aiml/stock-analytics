from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.api.auth import get_current_user
from app.services.stock_service import stock_service

router = APIRouter()

class AlertRequest(BaseModel):
    symbol: str
    target_price: float
    condition: str  # "above" ya "below"

@router.get("/")
async def get_alerts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Alert).where(Alert.user_id == current_user.id))
    alerts = result.scalars().all()
    return {"alerts": [{"id": a.id, "symbol": a.symbol, "target_price": a.target_price, "condition": a.condition, "is_active": a.is_active} for a in alerts]}

@router.post("/")
async def create_alert(data: AlertRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = Alert(
        user_id=current_user.id,
        symbol=data.symbol.upper(),
        target_price=data.target_price,
        condition=data.condition,
        is_active=True,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return {"message": f"Alert set! {data.symbol} {data.condition} ${data.target_price}", "id": alert.id}

@router.get("/check")
async def check_alerts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Alert).where(Alert.user_id == current_user.id, Alert.is_active == True))
    alerts = result.scalars().all()
    triggered = []
    for alert in alerts:
        stock = await stock_service.get_stock_info(alert.symbol)
        if not stock:
            continue
        current_price = stock["current_price"]
        if alert.condition == "above" and current_price >= alert.target_price:
            triggered.append({"symbol": alert.symbol, "condition": "above", "target": alert.target_price, "current": current_price})
            alert.is_active = False
        elif alert.condition == "below" and current_price <= alert.target_price:
            triggered.append({"symbol": alert.symbol, "condition": "below", "target": alert.target_price, "current": current_price})
            alert.is_active = False
    await db.commit()
    return {"triggered": triggered, "total_active": len(alerts) - len(triggered)}

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert nahi mila")
    await db.delete(alert)
    await db.commit()
    return {"message": "Alert delete ho gaya"}
