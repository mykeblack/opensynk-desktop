from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_settings
from app.db.models import Settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsRequest(BaseModel):
    api_base_url: str
    username: str
    poll_interval_seconds: int
    selected_site: str
    verify_ssl: bool


@router.get("")
def get_settings(settings: Settings = Depends(get_current_settings)):
    return {
        "api_base_url": settings.api_base_url or "https://openapi.sunsynk.net",
        "username": settings.username or "",
        "poll_interval_seconds": settings.poll_interval_seconds or 60,
        "selected_site": settings.selected_site or "",
        "verify_ssl": settings.verify_ssl,
        "data_mode": "demo" if settings.username == "demo" else "live",
    }


@router.post("")
def save_settings(
    req: SettingsRequest,
    settings: Settings = Depends(get_current_settings),
):
    # username is identity, don't really allow changing it
    settings.api_base_url = req.api_base_url
    settings.poll_interval_seconds = req.poll_interval_seconds
    settings.selected_site = req.selected_site
    settings.verify_ssl = req.verify_ssl
    settings.data_mode = "demo" if settings.username == "demo" else "live"

    from app.db.database import SessionLocal

    db = SessionLocal()
    try:
        db.merge(settings)
        db.commit()
    finally:
        db.close()

    return {"success": True, "message": "Settings saved successfully"}