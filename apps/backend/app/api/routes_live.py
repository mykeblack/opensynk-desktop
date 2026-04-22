from fastapi import APIRouter

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/summary")
def live_summary():
    return {
        "solar_w": 3200,
        "load_w": 1800,
        "battery_soc": 67,
        "grid_w": -450,
    }