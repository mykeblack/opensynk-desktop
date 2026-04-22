from datetime import datetime

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LiveSample

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/summary")
def live_summary():
    db: Session = SessionLocal()

    try:
        latest_sample = db.query(LiveSample).order_by(LiveSample.timestamp.desc()).first()

        if not latest_sample:
            latest_sample = LiveSample(
                solar_w=3200,
                load_w=1800,
                battery_soc=67,
                battery_w=450,
                grid_w=-450,
            )
            db.add(latest_sample)
            db.commit()
            db.refresh(latest_sample)

        return {
            "timestamp": latest_sample.timestamp.isoformat()
            if latest_sample.timestamp
            else datetime.utcnow().isoformat(),
            "solar_w": latest_sample.solar_w,
            "load_w": latest_sample.load_w,
            "battery_soc": latest_sample.battery_soc,
            "battery_w": latest_sample.battery_w,
            "grid_w": latest_sample.grid_w,
        }
    finally:
        db.close()