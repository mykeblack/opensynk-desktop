from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsRequest(BaseModel):
    api_base_url: str
    access_token: str = ""
    app_key: str
    app_secret: str
    username: str
    password: str
    poll_interval_seconds: int
    selected_site: str
    verify_ssl: bool
    data_mode: str


class ModeRequest(BaseModel):
    mode: str


class TestConnectionRequest(BaseModel):
    api_base_url: str
    app_key: str
    app_secret: str
    username: str
    password: str
    verify_ssl: bool


def get_or_create_settings(db: Session) -> Settings:
    settings_rows = db.query(Settings).order_by(Settings.id.asc()).all()

    if not settings_rows:
        settings = Settings(
            api_base_url="https://openapi.sunsynk.net",
            access_token="",
            refresh_token="",
            token_type="",
            token_expires_in=None,
            app_key="",
            app_secret="",
            username="",
            password="",
            poll_interval_seconds=60,
            selected_site="",
            verify_ssl=True,
            data_mode="demo",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    # Keep the first row as the singleton settings row
    settings = settings_rows[0]

    # Remove accidental duplicates
    if len(settings_rows) > 1:
        for duplicate in settings_rows[1:]:
            db.delete(duplicate)
        db.commit()
        db.refresh(settings)

    return settings


@router.get("")
def get_settings():
    db: Session = SessionLocal()

    try:
        settings = get_or_create_settings(db)

        return {
            "api_base_url": settings.api_base_url,
            "access_token": settings.access_token or "",
            "refresh_token": settings.refresh_token or "",
            "token_type": settings.token_type or "",
            "token_expires_in": settings.token_expires_in,
            "app_key": settings.app_key or "",
            "app_secret": settings.app_secret or "",
            "username": settings.username or "",
            "password": settings.password or "",
            "poll_interval_seconds": settings.poll_interval_seconds,
            "selected_site": settings.selected_site or "",
            "verify_ssl": settings.verify_ssl,
            "data_mode": settings.data_mode or "demo",
        }
    finally:
        db.close()


@router.post("")
def save_settings(req: SettingsRequest):
    db: Session = SessionLocal()

    try:
        settings = get_or_create_settings(db)

        settings.api_base_url = req.api_base_url
        if req.access_token:
            settings.access_token = req.access_token

        settings.app_key = req.app_key
        settings.app_secret = req.app_secret
        settings.username = req.username
        settings.password = req.password
        settings.poll_interval_seconds = req.poll_interval_seconds
        settings.selected_site = req.selected_site
        settings.verify_ssl = req.verify_ssl
        settings.data_mode = req.data_mode

        db.commit()
        db.refresh(settings)

        return {"success": True, "message": "Settings saved successfully"}
    finally:
        db.close()


@router.post("/set-mode")
def set_mode(req: ModeRequest):
    db: Session = SessionLocal()

    try:
        settings = get_or_create_settings(db)

        if req.mode not in ["demo", "live"]:
            return {"success": False, "message": "Invalid mode"}

        settings.data_mode = req.mode
        db.commit()
        db.refresh(settings)

        return {"success": True, "mode": settings.data_mode}
    finally:
        db.close()


@router.post("/test-connection")
def test_connection(req: TestConnectionRequest):
    db: Session = SessionLocal()

    try:
        settings = get_or_create_settings(db)

        # Save current form values first so the DB stays in sync
        settings.api_base_url = req.api_base_url
        settings.app_key = req.app_key
        settings.app_secret = req.app_secret
        settings.username = req.username
        settings.password = req.password
        settings.verify_ssl = req.verify_ssl
        db.commit()

        client = SunsynkClient(
            base_url=req.api_base_url,
            access_token="",
            verify_ssl=req.verify_ssl,
            app_key=req.app_key,
            app_secret=req.app_secret,
            username=req.username,
            password=req.password,
        )

        result = client.request_access_token()

        if result.get("success"):
            data = result.get("response_json", {}).get("data", {})

            settings.access_token = data.get("access_token", "")
            settings.refresh_token = data.get("refresh_token", "")
            settings.token_type = data.get("token_type", "")
            settings.token_expires_in = data.get("expires_in")

            db.commit()
            db.refresh(settings)

            return {
                "success": True,
                "message": "Access token refreshed successfully",
                "status_code": result.get("status_code"),
                "url": result.get("url"),
                "token_type": settings.token_type,
                "expires_in": settings.token_expires_in,
                "access_token": settings.access_token,
            }

        return {
            "success": False,
            "message": result.get("message", "Failed to retrieve access token"),
            "status_code": result.get("status_code"),
            "url": result.get("url"),
            "response_text": result.get("response_text"),
        }
    finally:
        db.close()