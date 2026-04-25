from datetime import datetime, timezone, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.api.deps import get_current_settings
from app.db.models import LiveSample, Settings

router = APIRouter(prefix="/api/costs", tags=["costs"])


def is_night_rate(now: datetime, start: str, end: str) -> bool:
    start_t = time.fromisoformat(start)
    end_t = time.fromisoformat(end)
    current_t = now.time()

    if start_t < end_t:
        return start_t <= current_t <= end_t
    else:
        # overnight window (e.g. 00:30–04:30)
        return current_t >= start_t or current_t <= end_t


@router.get("/today")
def cost_today(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "No settings found"}

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
            .all()
        )

        if not samples:
            return {"cost_today": 0}

        unit_rate = float(settings.tariff_unit_rate or 0)
        night_rate = float(settings.tariff_night_rate or 0)
        has_night = settings.tariff_has_night_rate

        total_cost = 0
        total_kwh = 0
        night_kwh = 0
        day_kwh = 0

        for i in range(1, len(samples)):
            prev = samples[i - 1]
            curr = samples[i]

            if not prev.timestamp or not curr.timestamp:
                continue

            delta_seconds = (curr.timestamp - prev.timestamp).total_seconds()
            if delta_seconds <= 0:
                continue

            # only count grid import (positive)
            power_w = max(curr.grid_w, 0)

            kwh = (power_w / 1000) * (delta_seconds / 3600)

            total_kwh += kwh

            if has_night and is_night_rate(curr.timestamp, settings.tariff_night_start, settings.tariff_night_end):
                total_cost += kwh * night_rate
                night_kwh += kwh
            else:
                total_cost += kwh * unit_rate
                day_kwh += kwh

        daily_charge = float(settings.tariff_daily_rate or 0)

        return {
            "cost_today": round(total_cost + daily_charge, 2),
            "energy_kwh": round(total_kwh, 2),
            "day_kwh": round(day_kwh, 2),
            "night_kwh": round(night_kwh, 2),
            "daily_charge": daily_charge,
        }

    finally:
        db.close()