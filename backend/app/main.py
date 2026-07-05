from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from loguru import logger
from app.core.config import settings
from app.core.database import engine, Base
from app.core.limiter import limiter
from app.api.stocks import router as stocks_router
from app.api.auth import router as auth_router
from app.api.portfolio import router as portfolio_router
from app.api.alerts import router as alerts_router
from app.api.ai import router as ai_router
from app.api.websocket import router as ws_router
from app.api.news import router as news_router
from app.api.google_auth import router as google_router
import app.models
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created!")
    yield
    logger.info("Shutting down...")
    await engine.dispose()

app = FastAPI(
    title="StockAI - Real-Time Stock Market Analytics",
    description="""
## StockAI API Documentation

A professional real-time stock market analytics platform with AI predictions.

### Features
- **Live Stock Data** — Real-time prices from Alpha Vantage
- **AI Predictions** — Price forecasting using Moving Average & Trend Analysis
- **Portfolio Management** — Buy/Sell stocks, track P&L
- **Price Alerts** — Get notified when target price is reached
- **Risk Analysis** — Sharpe Ratio, Concentration Risk
- **News Feed** — Latest market news with sentiment analysis
- **WebSocket** — Real-time price streaming
- **Google OAuth** — Sign in with Google

### Authentication
Use JWT Bearer token. Get token from `/api/v1/auth/login` endpoint.
Or use Google OAuth from `/api/v1/auth/google` endpoint.
    """,
    version="1.0.0",
    contact={
        "name": "Ravindra Das",
        "url": "https://github.com/ravindra-das-aiml",
    },
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(google_router, prefix="/api/v1/auth", tags=["Google OAuth"])
app.include_router(stocks_router, prefix="/api/v1/stocks", tags=["Stocks"])
app.include_router(portfolio_router, prefix="/api/v1/portfolio", tags=["Portfolio"])
app.include_router(alerts_router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI & Predictions"])
app.include_router(news_router, prefix="/api/v1/news", tags=["News"])
app.include_router(ws_router, tags=["WebSocket"])

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "app": "StockAI API", "version": "1.0.0"}

@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="StockAI API Docs",
        swagger_ui_parameters={
            "deepLinking": True,
            "displayRequestDuration": True,
            "filter": True,
            "syntaxHighlight.theme": "monokai",
            "tryItOutEnabled": True,
        },
    )

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="StockAI API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
