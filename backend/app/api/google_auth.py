from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import create_access_token, hash_password
import secrets

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

@router.get("/google")
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            })
            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise HTTPException(status_code=400, detail="Google login failed")

            user_response = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
            user_info = user_response.json()

        email = user_info.get("email")
        name = user_info.get("name", email.split("@")[0])
        google_id = user_info.get("id")

        if not email:
            raise HTTPException(status_code=400, detail="Email not found")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            username = name.replace(" ", "").lower()[:20]
            result2 = await db.execute(select(User).where(User.username == username))
            if result2.scalar_one_or_none():
                username = f"{username}{google_id[:4]}"

            user = User(
                email=email,
                username=username,
                hashed_password=hash_password(secrets.token_hex(16)),
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        jwt_token = create_access_token({"sub": str(user.id), "email": user.email})
        frontend_url = f"http://localhost:3000?token={jwt_token}"
        return RedirectResponse(frontend_url)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google login error: {str(e)}")
