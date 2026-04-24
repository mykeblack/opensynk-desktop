from collections import defaultdict
from datetime import date, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_settings, get_db
from app.db.models import LiveSample, Settings

router = APIRouter(prefix="/api/roi", tags=["roi"])


def is_night_rate(sample_time, start: str, end: str) -> bool:
    start_t = time.fromisoformat(start)
    end_t = time.fromisoformat(end)
    current_t = sample_time.time()

    if start_t < end_t:
        return start_t <= current_t <= end_t

    return current_t >= start_t or current_t <= end_t


def get_import_rate(settings: Settings, sample_time) -> float:
    unit_rate = float(settings.tariff_unit_rate or 0)
    night_rate = float(settings.tariff_night_rate or 0)

    if settings.tariff_has_night_rate and is_night_rate(
        sample_time,
        settings.tariff_night_start or "00:30",
        settings.tariff_night_end or "04:30",
    ):
        return night_rate

    return unit_rate


def calculate_roi(settings: Settings, samples: list[LiveSample]):
    investment_cost = float(settings.tariff_investment_cost or 0)
    export_rate = float(settings.tariff_export_rate or 0)

    total_savings = 0.0
    total_export_credit = 0.0
    total_benefit = 0.0
    solar_generated_kwh = 0.0
    self_consumed_kwh = 0.0
    exported_kwh = 0.0

    daily = defaultdict(lambda: {
        "savings": 0.0,
        "export_credit": 0.0,
        "total_benefit": 0.0,
        "solar_kwh": 0.0,
        "self_consumed_kwh": 0.0,
        "exported_kwh": 0.0,
    })

    for i in range(1, len(samples)):
        prev = samples[i - 1]
        curr = samples[i]

        if not prev.timestamp or not curr.timestamp:
            continue

        delta_seconds = (curr.timestamp - prev.timestamp).total_seconds()

        # Ignore invalid or huge gaps.
        if delta_seconds <= 0 or delta_seconds > 3600:
            continue

        hours = delta_seconds / 3600
        import_rate = get_import_rate(settings, curr.timestamp)

        solar_kwh = (max(curr.solar_w, 0) / 1000) * hours
        exported_interval_kwh = (abs(min(curr.grid_w, 0)) / 1000) * hours
        self_consumed_interval_kwh = max(solar_kwh - exported_interval_kwh, 0)

        savings = self_consumed_interval_kwh * import_rate
        export_credit = exported_interval_kwh * export_rate
        benefit = savings + export_credit

        day_key = curr.timestamp.date().isoformat()

        solar_generated_kwh += solar_kwh
        self_consumed_kwh += self_consumed_interval_kwh
        exported_kwh += exported_interval_kwh
        total_savings += savings
        total_export_credit += export_credit
        total_benefit += benefit

        daily[day_key]["savings"] += savings
        daily[day_key]["export_credit"] += export_credit
        daily[day_key]["total_benefit"] += benefit
        daily[day_key]["solar_kwh"] += solar_kwh
        daily[day_key]["self_consumed_kwh"] += self_consumed_interval_kwh
        daily[day_key]["exported_kwh"] += exported_interval_kwh

    today_key = date.today().isoformat()
    today = daily[today_key]

    roi_percent = 0.0
    if investment_cost > 0:
        roi_percent = min((total_benefit / investment_cost) * 100, 100)

    return {
        "investment_cost": round(investment_cost, 2),
        "estimated_savings": round(total_savings, 2),
        "export_credit": round(total_export_credit, 2),
        "total_benefit": round(total_benefit, 2),
        "solar_generated_kwh": round(solar_generated_kwh, 2),
        "self_consumed_solar_kwh": round(self_consumed_kwh, 2),
        "exported_kwh": round(exported_kwh, 2),
        "roi_percent": round(roi_percent, 2),
        "today_savings": round(today["savings"], 2),
        "today_export_credit": round(today["export_credit"], 2),
        "today_total_benefit": round(today["total_benefit"], 2),
    }


@router.get("/summary")
def roi_summary(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_current_settings),
):
    samples = (
        db.query(LiveSample)
        .filter(LiveSample.username == settings.username)
        .filter(LiveSample.selected_site == settings.selected_site)
        .order_by(LiveSample.timestamp.asc())
        .all()
    )

    return calculate_roi(settings, samples)


@router.get("/history")
def roi_history(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_current_settings),
):
    samples = (
        db.query(LiveSample)
        .filter(LiveSample.username == settings.username)
        .filter(LiveSample.selected_site == settings.selected_site)
        .order_by(LiveSample.timestamp.asc())
        .all()
    )

    daily = calculate_roi(settings, samples)

    # Keep your existing chart endpoint if already working.
    return {"days": []}