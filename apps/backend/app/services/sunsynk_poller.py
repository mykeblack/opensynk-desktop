import logging
import threading
import time
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import load_config
from app.db.database import SessionLocal
from app.db.models import LiveSample, Settings
from app.services.sample_generator import generate_demo_sample
from app.services.sunsynk_client import SunsynkClient

logger = logging.getLogger(__name__)


def is_token_expired(settings: Settings) -> bool:
    if not settings.token_expires_in or not settings.token_updated_at:
        return False

    token_updated_at = settings.token_updated_at

    if token_updated_at.tzinfo is None:
        token_updated_at = token_updated_at.replace(tzinfo=timezone.utc)

    expiry_time = token_updated_at + timedelta(seconds=settings.token_expires_in)

    return datetime.now(timezone.utc) > (expiry_time - timedelta(minutes=2))


def refresh_token_if_needed(db: Session, settings: Settings) -> None:
    if settings.data_mode != "live":
        return

    if not settings.refresh_token:
        return

    if not is_token_expired(settings):
        return

    config = load_config()

    client = SunsynkClient(
        base_url=settings.api_base_url,
        access_token=settings.access_token or "",
        verify_ssl=settings.verify_ssl,
        app_key=config.get("sunsynk_app_key", ""),
        app_secret=config.get("sunsynk_app_secret", ""),
        username=settings.username or "",
        password="",
    )

    result = client.refresh_access_token(settings.refresh_token)

    response_json = result.get("response_json") or {}
    data = response_json.get("data") or {}

    if result.get("success") and data.get("access_token"):
        settings.access_token = data.get("access_token", "")
        settings.refresh_token = data.get("refresh_token") or settings.refresh_token
        settings.token_type = data.get("token_type") or settings.token_type
        settings.token_expires_in = data.get("expires_in")
        settings.token_updated_at = datetime.now(timezone.utc)

        db.commit()

        logger.info("Sunsynk token refreshed for %s", settings.username)
    else:
        logger.warning(
            "Sunsynk token refresh failed for %s: %s",
            settings.username,
            result,
        )


def save_demo_sample(db: Session, settings: Settings) -> None:
    sample = generate_demo_sample()

    db_sample = LiveSample(
        username=settings.username,
        selected_site=settings.selected_site or "demo",
        solar_w=sample["solar_w"],
        load_w=sample["load_w"],
        battery_soc=sample["battery_soc"],
        battery_w=sample["battery_w"],
        grid_w=sample["grid_w"],
    )

    db.add(db_sample)
    db.commit()


def save_live_sample(db: Session, settings: Settings) -> None:
    if not settings.access_token or not settings.selected_site:
        logger.warning(
            "Live mode skipped for %s: missing token or inverter",
            settings.username,
        )
        return

    config = load_config()

    client = SunsynkClient(
        base_url=settings.api_base_url,
        access_token=settings.access_token or "",
        verify_ssl=settings.verify_ssl,
        app_key=config.get("sunsynk_app_key", ""),
        app_secret=config.get("sunsynk_app_secret", ""),
        username=settings.username or "",
        password="",
    )

    result = client.get_live_summary_partial(
        settings.access_token,
        settings.selected_site,
    )

    if not result or result.get("error") or result.get("success") is False:
        logger.warning("Live fetch failed for %s: %s", settings.username, result)
        return

    db_sample = LiveSample(
        username=settings.username,
        selected_site=settings.selected_site,
        solar_w=result.get("solar_w", 0),
        load_w=result.get("load_w", 0),
        battery_soc=result.get("battery_soc", 0),
        battery_w=result.get("battery_w", 0),
        grid_w=result.get("grid_w", 0),
    )

    db.add(db_sample)
    db.commit()


def run_poller() -> None:
    while True:
        sleep_for = 60
        db: Session = SessionLocal()

        try:
            settings_rows = db.query(Settings).all()

            if not settings_rows:
                time.sleep(sleep_for)
                continue

            intervals: list[int] = []

            for settings in settings_rows:
                interval = settings.poll_interval_seconds or 60
                intervals.append(interval)

                if settings.data_mode == "demo":
                    save_demo_sample(db, settings)
                    logger.debug("Demo sample saved for %s", settings.username)
                else:
                    refresh_token_if_needed(db, settings)
                    save_live_sample(db, settings)
                    logger.debug("Live sample saved for %s", settings.username)

            sleep_for = max(5, min(intervals) if intervals else 60)

        except Exception as ex:
            logger.error("Poller error: %s", ex)
            sleep_for = 10

        finally:
            db.close()

        time.sleep(sleep_for)


def start_poller() -> None:
    thread = threading.Thread(target=run_poller, daemon=True)
    thread.start()
    logger.info("OpenSynk poller started")