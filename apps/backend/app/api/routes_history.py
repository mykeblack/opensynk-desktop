from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LiveSample

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/power")
def history_power():
    db: Session = SessionLocal()

    try:
        samples = (
            db.query(LiveSample)
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