from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            settings = Settings(
                api_base_url="https://openapi.sunsynk.net",
                access_token="",
                poll_interval_seconds=60,
                selected_site="Home",
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        return {
            "api_base_url": settings.api_base_url,
            "access_token": settings.access_token,
            "poll_interval_seconds": settings.poll_interval_seconds,
            "selected_site": settings.selected_site,
        }
    finally:
        db.close()