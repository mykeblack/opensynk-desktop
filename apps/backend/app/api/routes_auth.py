from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import load_config
from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.auth_tokens import create_session_token
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str
    keep_signed_in: bool = False
    verify_ssl: bool = False


@router.post("/login")
def login(req: LoginRequest):
    username = req.email.strip().lower()

    if username == "demo" and req.password == "demo":
        session_token = create_session_token("demo", req.keep_signed_in)

        db: Session = SessionLocal()

        try:
            settings = (
                db.query(Settings)
                .filter(Settings.username == "demo")
                .first()
            )

            if not settings:
                settings = Settings(
                    username="demo",
                    api_base_url="https://openapi.sunsynk.net",
                    access_token="demo",
                    refresh_token="",
                    token_type="Bearer",
                    token_expires_in=None,
                    token_updated_at=datetime.now(timezone.utc),
                    poll_interval_seconds=60,
                    selected_site="",
                    verify_ssl=False,
                    data_mode="demo",
                    tariff_daily_rate="0.00",
                    tariff_unit_rate="0.00",
                    tariff_export_rate="0.00",
                    tariff_has_night_rate=False,
                    tariff_night_rate="0.00",
                    tariff_night_start="00:30",
                    tariff_night_end="04:30",
                    tariff_investment_cost="0.00",
                )
                db.add(settings)
                db.commit()

        finally:
            db.close()

        return {
            "success": True,
            "email": "demo",
            "mode": "demo",
            "session_token": session_token,
        }

    config = load_config()

    app_key = config.get("sunsynk_app_key", "")
    app_secret = config.get("sunsynk_app_secret", "")

    if not app_key or not app_secret:
        return {
            "success": False,
            "message": "Server is missing Sunsynk app key or app secret.",
        }

    client = SunsynkClient(
        base_url="https://openapi.sunsynk.net",
        access_token="",
        verify_ssl=req.verify_ssl,
        app_key=app_key,
        app_secret=app_secret,
        username=username,
        password=req.password,
    )

    result = client.request_access_token()

    response_json = result.get("response_json") or {}
    data = response_json.get("data") or {}

    if not result.get("success") or not data.get("access_token"):
        return {
            "success": False,
            "message": (
                response_json.get("msg")
                or result.get("message")
                or "Login failed: no access token returned"
            ),
            "status_code": result.get("status_code"),
            "response_text": result.get("response_text"),
        }

    db: Session = SessionLocal()

    try:
        settings = (
            db.query(Settings)
            .filter(Settings.username == username)
            .first()
        )

        if not settings:
            settings = Settings(
                username=username,
                api_base_url="https://openapi.sunsynk.net",
                poll_interval_seconds=60,
                selected_site="",
                verify_ssl=req.verify_ssl,
                data_mode="live",
                tariff_daily_rate="0.00",
                tariff_unit_rate="0.00",
                tariff_export_rate="0.00",
                tariff_has_night_rate=False,
                tariff_night_rate="0.00",
                tariff_night_start="00:30",
                tariff_night_end="04:30",
                tariff_investment_cost="0.00",
            )
            db.add(settings)

        settings.access_token = data.get("access_token", "")
        settings.refresh_token = data.get("refresh_token", "")
        settings.token_type = data.get("token_type", "")
        settings.token_expires_in = data.get("expires_in")
        settings.token_updated_at = datetime.now(timezone.utc)
        settings.verify_ssl = req.verify_ssl
        settings.data_mode = "live"

        db.commit()

        session_token = create_session_token(username, req.keep_signed_in)

        return {
            "success": True,
            "email": username,
            "mode": "live",
            "session_token": session_token,
        }

    finally:
        db.close()