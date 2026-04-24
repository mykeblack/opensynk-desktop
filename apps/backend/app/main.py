from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_history import router as history_router
from app.api.routes_live import router as live_router
from app.api.routes_settings import router as settings_router
from app.api.routes_inverters import router as inverters_router
from app.services.sunsynk_poller import start_poller
from app.api.routes_battery import router as battery_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_costs import router as costs_router
from app.api.routes_roi import router as roi_router
from app.api.routes_auth import router as auth_router
from app.api.routes_tariffs import router as tariffs_router

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

@app.on_event("startup")
def startup_event():
    start_poller()


app.include_router(live_router)
app.include_router(history_router)
app.include_router(settings_router)
app.include_router(inverters_router)
app.include_router(battery_router)
app.include_router(alerts_router)
app.include_router(costs_router)
app.include_router(roi_router)
app.include_router(auth_router)
app.include_router(tariffs_router)