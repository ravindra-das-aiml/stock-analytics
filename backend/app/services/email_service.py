from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings
from loguru import logger

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

async def send_alert_email(to_email: str, symbol: str, condition: str, target: float, current: float):
    try:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 30px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f59e0b; margin: 0;">StockAI Alert!</h1>
                <p style="color: #94a3b8;">Your price alert has been triggered</p>
            </div>
            <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #f59e0b;">
                <h2 style="color: #f59e0b; margin: 0 0 12px;">{symbol}</h2>
                <p style="color: #94a3b8; margin: 4px 0;">Condition: <span style="color: white;">{condition} ${target}</span></p>
                <p style="color: #94a3b8; margin: 4px 0;">Current Price: <span style="color: #22c55e; font-size: 24px; font-weight: bold;">${current}</span></p>
            </div>
            <p style="color: #64748b; text-align: center; font-size: 12px;">StockAI - Real-Time Market Analytics</p>
        </div>
        """
        message = MessageSchema(
            subject=f"StockAI Alert: {symbol} is {condition} ${target}!",
            recipients=[to_email],
            body=html,
            subtype="html"
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Alert email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False
