from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SobrietyLogCreate(BaseModel):
    event_type: str  # 'start', 'reset', 'checkin', 'relapse', 'craving'
    note: Optional[str] = None
    trigger_tag: Optional[str] = None

class SobrietyLogOut(BaseModel):
    id: str
    event_type: str
    event_at: datetime
    note: Optional[str] = None
    trigger_tag: Optional[str] = None

    class Config:
        from_attributes = True

class MilestoneBadge(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    earned: bool
    days_required: int

class SobrietyStatus(BaseModel):
    streak_days: int
    start_date: Optional[datetime] = None
    last_reset: Optional[datetime] = None
    last_checkin: Optional[datetime] = None
    checkin_today: bool = False
    badges: List[MilestoneBadge]

class SobrietySummary(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    total_checkins: int
    recent_events: List[SobrietyLogOut]
