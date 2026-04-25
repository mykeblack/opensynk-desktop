from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_settings, get_db
from app.db.models import Settings

router = APIRouter(prefix="/api/tariffs", tags=["tariffs"])


class TariffsRequest(BaseModel):
    tariff_daily_rate: str
    tariff_unit_rate: str
    tariff_export_rate: str
    tariff_has_night_rate: bool
    tariff_night_rate: str
    tariff_night_start: str
    tariff_night_end: str
    tariff_investment_cost: str


@router.get("")
def get_tariffs(settings: Settings = Depends(get_current_settings)):
    return {
        "tariff_daily_rate": settings.tariff_daily_rate or "0.00",
        "tariff_unit_rate": settings.tariff_unit_rate or "0.00",
        "tariff_export_rate": settings.tariff_export_rate or "0.00",
        "tariff_has_night_rate": settings.tariff_has_night_rate or False,
        "tariff_night_rate": settings.tariff_night_rate or "0.00",
        "tariff_night_start": settings.tariff_night_start or "00:30",
        "tariff_night_end": settings.tariff_night_end or "04:30",
        "tariff_investment_cost": settings.tariff_investment_cost or "0.00",
    }


@router.post("")
def save_tariffs(
    req: TariffsRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_current_settings),
):
    settings.tariff_daily_rate = req.tariff_daily_rate
    settings.tariff_unit_rate = req.tariff_unit_rate
    settings.tariff_export_rate = req.tariff_export_rate
    settings.tariff_has_night_rate = req.tariff_has_night_rate
    settings.tariff_night_rate = req.tariff_night_rate
    settings.tariff_night_start = req.tariff_night_start
    settings.tariff_night_end = req.tariff_night_end
    settings.tariff_investment_cost = req.tariff_investment_cost

    db.commit()
    db.refresh(settings)

    return {"success": True, "message": "Tariffs saved successfully"}