import time
import threading
import logging

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Settings, LiveSample
from app.services.sunsynk_client import SunsynkClient
from app.services.sample_generator import generate_demo_sample

logger = logging.getLogger(__name__)


def run_poller():
    while True:
        db: Session = SessionLocal()

        try:
            settings = db.query(Settings).first()

            if not settings:
                time.sleep(5)
                continue

            interval = settings.poll_interval_seconds or 60

            # =========================
            # DEMO MODE
            # =========================
            if settings.data_mode == "demo":
                sample = generate_demo_sample()

                db_sample = LiveSample(
                    solar_w=sample["solar_w"],
                    load_w=sample["load_w"],
                    battery_soc=sample["battery_soc"],
                    battery_w=sample["battery_w"],
                    grid_w=sample["grid_w"],
                )

                db.add(db_sample)
                db.commit()

                logger.debug("Demo sample saved")

            # =========================
            # LIVE MODE
            # =========================
            else:
                if not settings.access_token or not settings.selected_site:
                    logger.warning("Live mode but missing token or inverter")
                    time.sleep(interval)
                    continue

                client = SunsynkClient(
                    base_url=settings.api_base_url,
                    access_token=settings.access_token,
                    verify_ssl=settings.verify_ssl,
                    app_key=settings.app_key,
                    app_secret=settings.app_secret,
                    username=settings.username,
                    password=settings.password,
                )

                result = client.get_live_summary_partial(
                    settings.access_token,
                    settings.selected_site,
                )

                if "error" in result:
                    logger.warning(f"Live fetch failed: {result}")
                    time.sleep(interval)
                    continue

                db_sample = LiveSample(
                    solar_w=result["solar_w"],
                    load_w=result["load_w"],
                    battery_soc=result["battery_soc"],
                    battery_w=result["battery_w"],
                    grid_w=result["grid_w"],
                )

                db.add(db_sample)
                db.commit()

                logger.debug("Live sample saved")

            time.sleep(interval)

        except Exception as e:
            logger.error(f"Poller error: {e}")
            time.sleep(10)

        finally:
            db.close()


def start_poller():
    thread = threading.Thread(target=run_poller, daemon=True)
    thread.start()