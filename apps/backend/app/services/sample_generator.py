import random
import threading
import time
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import LiveSample


def generate_sample() -> LiveSample:
    hour = datetime.now().hour

    if 6 <= hour <= 18:
        solar_w = max(0, int(random.gauss(2200, 900)))
    else:
        solar_w = 0

    load_w = random.randint(300, 2200)

    battery_soc = random.randint(25, 100)

    if solar_w > load_w:
        battery_w = random.randint(100, 900)
        grid_w = -random.randint(50, 800)
    else:
        battery_w = -random.randint(50, 500)
        grid_w = random.randint(50, 900)

    return LiveSample(
        solar_w=solar_w,
        load_w=load_w,
        battery_soc=battery_soc,
        battery_w=battery_w,
        grid_w=grid_w,
    )


def save_sample():
    db: Session = SessionLocal()

    try:
        sample = generate_sample()
        db.add(sample)
        db.commit()
    finally:
        db.close()


def sample_generation_loop():
    while True:
        try:
            save_sample()
            print("Generated new live sample")
        except Exception as ex:
            print(f"Sample generation failed: {ex}")

        time.sleep(10) #change back to 60 later


def start_sample_generator():
    thread = threading.Thread(target=sample_generation_loop, daemon=True)
    thread.start()