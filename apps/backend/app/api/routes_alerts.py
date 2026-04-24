from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.api.deps import get_current_settings
from app.db.models import LiveSample, Settings

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def get_alerts(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "User not found"}
    
    if not settings.access_token:
        return {"error": "No access token configured"}
    
    db: Session = SessionLocal()

    try:
        latest = (
            db.query(LiveSample)
            .order_by(LiveSample.timestamp.desc())
            .first()
        )

        if not latest:
            return {"alerts": []}

        alerts = []

        # Battery low
        if latest.battery_soc < 20:
            alerts.append({
                "id": "battery-low",
                "title": "Battery low",
                "message": f"Battery state of charge is {latest.battery_soc}%",
                "severity": "warning",
            })

        # Heavy grid import
        if latest.grid_w > 2000:
            alerts.append({
                "id": "grid-import-high",
                "title": "Heavy grid import",
                "message": f"Grid import is {latest.grid_w} W",
                "severity": "warning",
            })

        # Heavy grid export
        if latest.grid_w < -2000:
            alerts.append({
                "id": "grid-export-high",
                "title": "Heavy grid export",
                "message": f"Grid export is {abs(latest.grid_w)} W",
                "severity": "info",
            })

        # Heavy battery discharge
        if latest.battery_w < -1500:
            alerts.append({
                "id": "battery-discharging-hard",
                "title": "Heavy battery discharge",
                "message": f"Battery is discharging at {abs(latest.battery_w)} W",
                "severity": "warning",
            })

        # Heavy battery charge
        if latest.battery_w > 1500:
            alerts.append({
                "id": "battery-charging-hard",
                "title": "Heavy battery charge",
                "message": f"Battery is charging at {latest.battery_w} W",
                "severity": "info",
            })

        # Data stale
        if latest.timestamp:
            sample_time = latest.timestamp
            if sample_time.tzinfo is None:
                sample_time = sample_time.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            age_seconds = (now - sample_time).total_seconds()
            poll_interval = settings.poll_interval_seconds if settings else 60
            stale_after = poll_interval * 2

            if age_seconds > stale_after:
                alerts.append({
                    "id": "data-stale",
                    "title": "Data stale",
                    "message": f"Latest sample is {int(age_seconds)} seconds old",
                    "severity": "critical",
                })

        return {"alerts": alerts}

    finally:
        db.close()