from fastapi import APIRouter, Depends

from app.api.deps import get_current_settings
from app.config import load_config
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/inverters", tags=["inverters"])


@router.get("")
def get_inverters(settings: Settings = Depends(get_current_settings)):
    if not settings.access_token:
        return {"error": "No access token configured"}

    config = load_config()

    client = SunsynkClient(
        base_url=settings.api_base_url,
        access_token=settings.access_token or "",
        verify_ssl=settings.verify_ssl,
        app_key=config.get("sunsynk_app_key", ""),
        app_secret=config.get("sunsynk_app_secret", ""),
        username=settings.username or "",
        password="",
    )

    result = client.get_inverters(settings.access_token or "")

    if not result.get("success"):
        return {
            "error": "Failed to load inverters",
            "status_code": result.get("status_code"),
            "message": result.get("message"),
            "response_text": result.get("response_text"),
        }

    response_json = result.get("response_json") or {}
    data = response_json.get("data") or {}
    infos = data.get("infos") or []

    return infos