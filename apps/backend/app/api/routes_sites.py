from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/sites", tags=["sites"])


@router.get("")
def get_sites():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            return []

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token or "",
            verify_ssl=settings.verify_ssl,
        )

        return client.get_sites()
    finally:
        db.close()