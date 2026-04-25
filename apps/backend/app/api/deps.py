from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.auth_tokens import decode_session_token


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_email(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract email (username) from JWT Bearer token
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "", 1).strip()

    email = decode_session_token(token)

    if not email:
        raise HTTPException(status_code=401, detail="Session expired")

    return email


def get_current_settings(
    db: Session = Depends(get_db),
    email: str = Depends(get_current_email),
) -> Settings:
    """
    Fetch the user's Settings row using username (email)
    """
    settings = (
        db.query(Settings)
        .filter(Settings.username == email)
        .first()
    )

    if not settings:
        raise HTTPException(status_code=404, detail="User settings not found")

    return settings