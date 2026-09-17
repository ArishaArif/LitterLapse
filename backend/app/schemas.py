from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Optional

# Base URL where evidence files are served from (static mount in main.py)
EVIDENCE_BASE_URL = "http://127.0.0.1:8000/evidence"


class IncidentBase(BaseModel):
    violation_type: str
    confidence: float
    plate_number: Optional[str] = None
    plate_confidence: Optional[float] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    evidence_path: Optional[str] = None
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    bbox_x2: Optional[float] = None
    bbox_y2: Optional[float] = None
    frame_width: Optional[float] = None
    frame_height: Optional[float] = None



class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    review_status: Optional[str] = None
    notes: Optional[str] = None

class BBox(BaseModel):
    x: float
    y: float
    w: float
    h: float

class IncidentOut(BaseModel):
    id: int
    timestamp: datetime
    violation_type: str
    confidence: float
    plate_number: Optional[str] = None
    plate_confidence: Optional[float] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    evidence_path: Optional[str] = None
    review_status: str
    notes: Optional[str] = None
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    bbox_x2: Optional[float] = None
    bbox_y2: Optional[float] = None
    frame_width: Optional[float] = None
    frame_height: Optional[float] = None

    class Config:
        from_attributes = True

    @computed_field
    @property
    def evidence_url(self) -> Optional[str]:
        if self.evidence_path:
            return f"{EVIDENCE_BASE_URL}/{self.evidence_path}"
        return None
    @computed_field
    @property
    def bbox(self) -> Optional[BBox]:
        """
        Normalized 0.0-1.0 bbox for the frontend's overlay component.
        Requires all four pixel corners plus frame_width/frame_height;
        returns None (frontend renders no box) if any are missing,
        which keeps rollout safe for incidents that predate this field.
        """
        vals = (self.bbox_x1, self.bbox_y1, self.bbox_x2, self.bbox_y2,
                self.frame_width, self.frame_height)
        if any(v is None for v in vals):
            return None
        x1, y1, x2, y2, fw, fh = vals
        if fw <= 0 or fh <= 0:
            return None
        x = min(x1, x2) / fw
        y = min(y1, y2) / fh
        w = abs(x2 - x1) / fw
        h = abs(y2 - y1) / fh
        return BBox(x=x, y=y, w=w, h=h)


# ---- Auth ----

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"