from fastapi import APIRouter

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings():
    return {
        "api_base_url": "https://openapi.sunsynk.net",
        "poll_interval_seconds": 60,
    }