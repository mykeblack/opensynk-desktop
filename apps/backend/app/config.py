import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent / "opensynk.config.json"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {
            "sunsynk_app_key": "",
            "sunsynk_app_secret": "",
        }

    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)