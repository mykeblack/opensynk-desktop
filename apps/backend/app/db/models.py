from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.db.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    api_base_url = Column(String, nullable=False)
    access_token = Column(String, nullable=True)
    poll_interval_seconds = Column(Integer, nullable=False, default=60)
    selected_site = Column(String, nullable=True)
    verify_ssl = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class LiveSample(Base):
    __tablename__ = "live_samples"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    solar_w = Column(Integer, nullable=False)
    load_w = Column(Integer, nullable=False)
    battery_soc = Column(Integer, nullable=False)
    battery_w = Column(Integer, nullable=False)
    grid_w = Column(Integer, nullable=False)