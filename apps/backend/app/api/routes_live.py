from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LiveSample, Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/summary")
def live_summary():
    db: Session = SessionLocal()

    try:
        latest = (
            db.query(LiveSample)
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
            "timestamp": latest.timestamp.isoformat() if latest.timestamp else None,
        }

    finally:
        db.close()


@router.get("/summary-real")
def live_summary_real():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            return {"error": "No settings found"}

        if not settings.access_token:
            return {"error": "No access token configured"}

        if not settings.selected_site:
            return {"error": "No inverter selected"}

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token or "",
            verify_ssl=settings.verify_ssl,
            app_key=settings.app_key or "",
            app_secret=settings.app_secret or "",
            username=settings.username or "",
            password=settings.password or "",
        )

        return client.get_live_summary_partial(
            settings.access_token or "",
            settings.selected_site,
        )
    finally:
        db.close()

@router.get("/probe-realtime")
def probe_realtime():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

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
def live_summary_real():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            return {"error": "No settings found"}

        if not settings.access_token:
            return {"error": "No access token configured"}

        if not settings.selected_site:
            return {"error": "No inverter selected"}

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token or "",
            verify_ssl=settings.verify_ssl,
            app_key=settings.app_key or "",
            app_secret=settings.app_secret or "",
            username=settings.username or "",
            password=settings.password or "",
        )

        return client.get_live_summary_partial(
            settings.access_token,
            settings.selected_site,
        )
    finally:
        db.close()