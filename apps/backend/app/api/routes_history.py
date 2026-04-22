from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LiveSample

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/power")
def history_power(range: str = "24h"):
    db: Session = SessionLocal()

    try:
        samples = (
            db.query(LiveSample)
            .order_by(LiveSample.timestamp.asc())
            .limit(24)
            .all()
        )

        if not samples:
            return {"range": range, "points": []}

        points = [
            {
                "time": sample.timestamp.strftime("%H:%M"),
                "solar_w": sample.solar_w,
                "load_w": sample.load_w,
                "grid_w": sample.grid_w,
                "battery_w": sample.battery_w,
            }
            for sample in samples
        ]

        return {
            "range": range,
            "points": points,
        }
    finally:
        db.close()