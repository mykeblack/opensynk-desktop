from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.db.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    api_base_url = Column(String, nullable=False)
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    token_type = Column(String, nullable=True)
    token_expires_in = Column(Integer, nullable=True)
    token_updated_at = Column(DateTime, nullable=True)
    username = Column(String, nullable=True)
    poll_interval_seconds = Column(Integer, nullable=False, default=60)
    selected_site = Column(String, nullable=True)
    solar_capacity_kwp = Column(String, nullable=False, default="2.37")
    verify_ssl = Column(Boolean, nullable=False, default=True)
    data_mode = Column(String, nullable=False, default="demo")
    tariff_daily_rate = Column(String, nullable=True, default="0.00")
    tariff_unit_rate = Column(String, nullable=True, default="0.00")
    tariff_has_night_rate = Column(Boolean, nullable=False, default=False)
    tariff_night_rate = Column(String, nullable=True, default="0.00")
    tariff_night_start = Column(String, nullable=True, default="00:00")
    tariff_night_end = Column(String, nullable=True, default="06:00")
    tariff_investment_cost = Column(String, nullable=True, default="0.00")
    tariff_export_rate = Column(String, nullable=True, default="0.00")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class LiveSample(Base):
    __tablename__ = "live_samples"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    username = Column(String, nullable=False, index=True, default="demo")
    selected_site = Column(String, nullable=False, index=True, default="")
    solar_w = Column(Integer, nullable=False)
    load_w = Column(Integer, nullable=False)
    battery_soc = Column(Integer, nullable=False)
    battery_w = Column(Integer, nullable=False)
    grid_w = Column(Integer, nullable=False)