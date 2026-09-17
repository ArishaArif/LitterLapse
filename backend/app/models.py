from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from .database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    violation_type = Column(String, nullable=False)      # "littering" 
    confidence = Column(Float, nullable=False)            # 0.0–1.0 from the AI model
    plate_number = Column(String, nullable=True)          # from ANPR, may be null
    plate_confidence = Column(Float, nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    evidence_path = Column(String, nullable=True)         # path/URL to the saved frame image
    review_status = Column(String, default="pending")     # pending | accepted | rejected | needs_investigation
    notes = Column(Text, nullable=True)

     # Pixel-space bounding box of the vehicle on the full evidence frame,
    # as sent by report_littering.py. Nullable since older/manual incidents
    # (seed data, /docs testing) won't have this.
    bbox_x1 = Column(Float, nullable=True)
    bbox_y1 = Column(Float, nullable=True)
    bbox_x2 = Column(Float, nullable=True)
    bbox_y2 = Column(Float, nullable=True)

    # Dimensions of the evidence frame the bbox was measured against.
    # Needed to normalize bbox_x1..y2 into the 0.0-1.0 fractional
    # {x, y, w, h} shape the frontend's BoundingBox overlay expects.
    # Nullable for the same reason as the bbox fields above.
    frame_width = Column(Float, nullable=True)
    frame_height = Column(Float, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Reviewer")  # "Admin" | "Reviewer"
    is_active = Column(Boolean, default=True)