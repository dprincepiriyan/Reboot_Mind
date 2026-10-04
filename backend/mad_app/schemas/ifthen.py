from datetime import datetime
from pydantic import BaseModel, Field

class IfThenPlanCreate(BaseModel):
    trigger_tag: str = Field(min_length=1, max_length=64)
    coping_action: str = Field(min_length=3, max_length=500)

class IfThenPlanOut(BaseModel):
    id: str
    trigger_tag: str
    coping_action: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
