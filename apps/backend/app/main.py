from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="OpenSynk Desktop Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/live/summary")
def live_summary():
    return {
        "solar_w": 3200,
        "load_w": 1800,
        "battery_soc": 67,
        "grid_w": -450,
    }


@app.get("/api/history/power")
def history_power(range: str = "24h"):
    data = [
        {"time": "00:00", "solar_w": 0, "load_w": 320, "grid_w": 220, "battery_w": 0},
        {"time": "02:00", "solar_w": 0, "load_w": 280, "grid_w": 200, "battery_w": 0},
        {"time": "04:00", "solar_w": 0, "load_w": 260, "grid_w": 170, "battery_w": -40},
        {"time": "06:00", "solar_w": 120, "load_w": 340, "grid_w": 120, "battery_w": -80},
        {"time": "08:00", "solar_w": 820, "load_w": 540, "grid_w": -100, "battery_w": 180},
        {"time": "10:00", "solar_w": 2100, "load_w": 760, "grid_w": -450, "battery_w": 520},
        {"time": "12:00", "solar_w": 3600, "load_w": 1100, "grid_w": -900, "battery_w": 850},
        {"time": "14:00", "solar_w": 3300, "load_w": 980, "grid_w": -700, "battery_w": 760},
        {"time": "16:00", "solar_w": 1800, "load_w": 860, "grid_w": -160, "battery_w": 320},
        {"time": "18:00", "solar_w": 420, "load_w": 1200, "grid_w": 300, "battery_w": -220},
        {"time": "20:00", "solar_w": 0, "load_w": 980, "grid_w": 420, "battery_w": -180},
        {"time": "22:00", "solar_w": 0, "load_w": 520, "grid_w": 280, "battery_w": -60},
    ]
    return {"range": range, "points": data}