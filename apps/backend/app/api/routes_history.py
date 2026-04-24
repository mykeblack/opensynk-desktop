from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import Settings
from app.db.database import SessionLocal
from app.api.deps import get_current_settings
from app.db.models import LiveSample

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/power")
def history_power(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "User not found"}
    
    if not settings.access_token:
        return {"error": "No access token configured"}
    
    if not settings.selected_site:
        return {"error": "No inverter selected"}
    
    db: Session = SessionLocal()

    try:
        samples = (
            db.query(LiveSample)
            .filter(LiveSample.username == settings.username)
            .filter(LiveSample.selected_site == settings.selected_site)
            .order_by(LiveSample.timestamp.asc())
            .limit(500)
            .all()
        )

        return {
            "points": [
                {
                    "time": s.timestamp.isoformat() if s.timestamp else None,
                    "solar_w": s.solar_w,
                    "load_w": s.load_w,
                    "battery_soc": s.battery_soc,
                    "battery_w": s.battery_w,
                    "grid_w": s.grid_w,
                }
                for s in samples
            ]
        }
    finally:
        db.close()