from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings
from app.services.sunsynk_client import SunsynkClient

router = APIRouter(prefix="/api/inverters", tags=["inverters"])


@router.get("")
def get_inverters():
    db: Session = SessionLocal()

    try:
        settings = db.query(Settings).first()

        if not settings:
            return {"results": []}

        client = SunsynkClient(
            base_url=settings.api_base_url,
            access_token=settings.access_token or "",
            verify_ssl=settings.verify_ssl,
            app_key=settings.app_key or "",
            app_secret=settings.app_secret or "",
            username=settings.username or "",
            password=settings.password or "",
        )

        data_token = settings.access_token or ""
        result = client.get_inverters(data_token)

        print("inverter probe result =", result)
        return result
    except Exception as ex:
        print("get_inverters failed:", ex)
        raise HTTPException(status_code=500, detail=str(ex))
    finally:
        db.close()