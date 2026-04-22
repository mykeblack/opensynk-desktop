from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsPayload(BaseModel):
    api_base_url: str
    access_token: str
    app_key: str
    app_secret: str
    username: str
    password: str
    poll_interval_seconds: int
    selected_site: str
    verify_ssl: bool


class TestConnectionPayload(BaseModel):
    api_base_url: str
    access_token: str
    app_key: str
    app_secret: str
    username: str
    password: str
    verify_ssl: bool


@router.get("")
def get_settings():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            settings = Settings(
                api_base_url="https://openapi.sunsynk.net",
                access_token="",
                app_key="",
                app_secret="",
                username="",
                password="",
                poll_interval_seconds=60,
                selected_site="Home",
                verify_ssl=True,
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        return {
            "api_base_url": settings.api_base_url,
            "access_token": settings.access_token,
            "app_key": settings.app_key or "",
            "app_secret": settings.app_secret or "",
            "username": settings.username or "",
            "password": settings.password or "",
            "poll_interval_seconds": settings.poll_interval_seconds,
            "selected_site": settings.selected_site,
            "verify_ssl": settings.verify_ssl,
        }
    finally:
        db.close()


@router.post("")
def save_settings(payload: SettingsPayload):
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            settings = Settings()
            db.add(settings)

        settings.api_base_url = payload.api_base_url
        settings.access_token = payload.access_token
        settings.app_key = payload.app_key
        settings.app_secret = payload.app_secret
        settings.username = payload.username
        settings.password = payload.password
        settings.poll_interval_seconds = payload.poll_interval_seconds
        settings.selected_site = payload.selected_site
        settings.verify_ssl = payload.verify_ssl

        db.commit()
        db.refresh(settings)

        return {
            "success": True,
            "message": "Settings saved successfully",
        }
    finally:
        db.close()


@router.post("/test-connection")
def test_connection(payload: TestConnectionPayload):
    client = SunsynkClient(
        base_url=payload.api_base_url,
        access_token=payload.access_token,
        verify_ssl=payload.verify_ssl,
        app_key=payload.app_key,
        app_secret=payload.app_secret,
        username=payload.username,
        password=payload.password,
    )

    return client.request_access_token()