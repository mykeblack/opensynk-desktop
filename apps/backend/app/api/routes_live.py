from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.api.deps import get_current_settings
from app.db.models import LiveSample, Settings
from app.services.sunsynk_client import SunsynkClient
from app.config import load_config

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/summary")
def live_summary(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "User not found"}
    
    db: Session = SessionLocal()

    try:
        latest = (
            db.query(LiveSample)
            .filter(LiveSample.username == settings.username)
            .filter(LiveSample.selected_site == settings.selected_site)
            .order_by(LiveSample.timestamp.desc())
            .first()
        )

        if not latest:
            return {
                "solar_w": 0,
                "load_w": 0,
                "battery_soc": 0,
                "battery_w": 0,
                "grid_w": 0,
            }

        return {
            "solar_w": latest.solar_w,
            "load_w": latest.load_w,
            "battery_soc": latest.battery_soc,
            "battery_w": latest.battery_w,
            "grid_w": latest.grid_w,
            "timestamp": latest.timestamp.isoformat() if latest else None
        }

    finally:
        db.close()


@router.get("/summary-real")
def live_summary_real(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "No settings found"}

    if not settings.access_token:
        return {"error": "No access token configured"}
    
    db: Session = SessionLocal()
    try:
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

        return client.get_live_summary_partial(
            settings.access_token or "",
            settings.selected_site,
        )
    finally:
        db.close()

@router.get("/probe-realtime")
def probe_realtime(settings: Settings = Depends(get_current_settings)):

    if not settings:
        return {"error": "User not found"}
    
    db: Session = SessionLocal()

    try:
        if not settings or not settings.access_token or not settings.selected_site:
            return {"error": "Missing config"}

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token,
            verify_ssl=settings.verify_ssl,
        )

        return client.probe_realtime(
            settings.access_token,
            settings.selected_site,
        )

    finally:
        db.close()

@router.get("/summary-real")
def live_summary_real(settings: Settings = Depends(get_current_settings)):

    if not settings:
        return {"error": "User not found"}
    
    db: Session = SessionLocal()
    try:
        
        if not settings:
            return {"error": "No settings found"}

        if not settings.access_token:
            return {"error": "No access token configured"}

        if not settings.selected_site:
            return {"error": "No inverter selected"}
        
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

        return client.get_live_summary_partial(
            settings.access_token,
            settings.selected_site,
        )
    finally:
        db.close()