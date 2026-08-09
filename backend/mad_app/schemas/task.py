from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DailyTaskOut(BaseModel):
    id: str
    task_text: str
    addiction_type: Optional[str] = None
    completed: bool = False

    class Config:
        from_attributes = True

class TaskCompletionRequest(BaseModel):
    task_id: str
