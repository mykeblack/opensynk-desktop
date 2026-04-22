from fastapi import APIRouter

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/power")
def history_power(range: str = "24h"):
    data = [
        {"time": "00:00", "solar_w": 0, "load_w": 320, "grid_w": 220, "battery_w": 0},
        {"time": "02:00", "solar_w": 0, "load_w": 280, "grid_w": 200, "battery_w": 0},
        {"time": "04:00", "solar_w": 0, "load_w": 260, "grid_w": 170, "battery_w": -40},
        {"time": "06:00", "solar_w": 120, "load_w": 340, "grid_w": 120, "battery_w": -80},
        {"time": "08:00", "solar_w": 820, "load_w": 540, "grid_w": -100, "battery_w": 180},
        {"time": "10:00", "solar_w": 2100, "load_w": 760, "grid_w": -450, "battery_w": 520},
        {"time": "12:00", "solar_w": 3600, "load_w": 1100, "grid_w": -900, "battery_w": 850},
    ]
    return {"range": range, "points": data}