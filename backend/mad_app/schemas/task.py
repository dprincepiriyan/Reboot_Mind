from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DailyTaskOut(BaseModel):
    id: str
    task_text: str
    addiction_type: Optional[str] = None
    completed: bool = False
    difficulty_tier: str = "foundational"  # foundational, growth, mastery
    min_streak_days: int = 0
    streak_stage: Optional[str] = None

    class Config:
        from_attributes = True

class TaskCompletionRequest(BaseModel):
    task_id: str
