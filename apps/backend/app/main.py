from fastapi import FastAPI

app = FastAPI(title="OpenSynk Desktop Backend")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/live/summary")
def live_summary():
    return {
        "solar_w": 0,
        "load_w": 0,
        "battery_soc": 0,
        "grid_w": 0
    }
