from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.api.deps import get_current_settings
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient
from app.config import load_config

router = APIRouter(prefix="/api/sites", tags=["sites"])


@router.get("")
def get_sites(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "User not found"}

    try:
        config = load_config()

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token or "",
            verify_ssl=settings.verify_ssl,
            app_key=config.get("sunsynk_app_key", ""),
            app_secret=config.get("sunsynk_app_secret", ""),
            username=settings.username or "",
            password= "",
        )

        sites = client.get_sites()
        print("sites response:", sites)
        return sites
    except Exception as ex:
        print("get_sites failed:", ex)
        raise HTTPException(status_code=500, detail=str(ex))