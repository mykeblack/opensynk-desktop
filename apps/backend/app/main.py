from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_sites import router as sites_router

from app.api.routes_history import router as history_router
from app.api.routes_live import router as live_router
from app.api.routes_settings import router as settings_router
from app.services.sample_generator import start_sample_generator

app = FastAPI(title="OpenSynk Desktop Backend")
start_sample_generator()

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


app.include_router(live_router)
app.include_router(history_router)
app.include_router(settings_router)
app.include_router(sites_router)