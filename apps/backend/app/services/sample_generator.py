import random
from datetime import datetime


def generate_demo_sample() -> dict:
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

    return {
        "solar_w": solar_w,
        "load_w": load_w,
        "battery_soc": battery_soc,
        "battery_w": battery_w,
        "grid_w": grid_w,
    }