from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.stock_service import stock_service
import asyncio
import json
from loguru import logger

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def send_to_client(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

manager = ConnectionManager()

@router.websocket("/ws/stocks")
async def stock_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    symbols = ["AAPL", "TSLA", "MSFT", "NVDA"]
    try:
        while True:
            prices = {}
            for symbol in symbols:
                data = await stock_service.get_stock_info(symbol)
                if data:
                    prices[symbol] = {
                        "price": data["current_price"],
                        "change": data["change"],
                        "change_percent": data["change_percent"],
                    }
                await asyncio.sleep(0.5)

            await manager.send_to_client(websocket, {
                "type": "price_update",
                "data": prices,
            })

            await asyncio.sleep(10)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
