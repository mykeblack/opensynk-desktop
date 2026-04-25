from fastapi import APIRouter, Depends

from app.api.deps import get_current_settings
from app.config import load_config
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/battery", tags=["battery"])


@router.get("/summary")
def battery_summary(settings: Settings = Depends(get_current_settings)):
    if not settings:
        return {"error": "User not found"}

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
        password="",  # no longer used
    )

    result = client._probe_endpoint(
        f"/api/v1/inverter/battery/{settings.selected_site}/realtime?lan=en",
        settings.access_token or "",
    )

    print("BATTERY RAW =", result)

    # 🔧 FIX: correct key from _probe_endpoint
    battery = result.get("json", {}).get("data", {})

    if not battery:
        return {
            "error": "No battery data returned",
            "raw": result,
        }

    return {
        "soc": int(float(battery.get("soc", 0) or 0)),
        "power_w": int(float(battery.get("power", 0) or 0)),
        "capacity_percent": float(battery.get("capacity", 0) or 0),
        "voltage_v": float(battery.get("voltage", 0) or 0),
        "current_a": float(battery.get("current", 0) or 0),
        "temperature_c": float(battery.get("temp", 0) or 0),

        # BMS details
        "bms_soc": float(battery.get("bmsSoc", 0) or 0),
        "bms_voltage_v": float(battery.get("bmsVolt", 0) or 0),
        "bms_current_a": float(battery.get("bmsCurrent", 0) or 0),
        "bms_temp_c": float(battery.get("bmsTemp", 0) or 0),

        # limits
        "charge_voltage_v": float(battery.get("chargeVolt", 0) or 0),
        "discharge_voltage_v": float(battery.get("dischargeVolt", 0) or 0),
        "charge_current_limit_a": float(battery.get("chargeCurrentLimit", 0) or 0),
        "discharge_current_limit_a": float(battery.get("dischargeCurrentLimit", 0) or 0),

        # status + energy
        "status": int(battery.get("status", 0) or 0),
        "today_charge_kwh": float(battery.get("etodayChg", 0) or 0),
        "today_discharge_kwh": float(battery.get("etodayDischg", 0) or 0),
        "total_charge_kwh": float(battery.get("etotalChg", 0) or 0),
        "total_discharge_kwh": float(battery.get("etotalDischg", 0) or 0),
    }