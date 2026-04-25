from app.db.database import Base, engine
from app.db.models import LiveSample, Settings

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")