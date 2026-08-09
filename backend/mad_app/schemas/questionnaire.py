from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class QuestionnaireSubmit(BaseModel):
    addiction_type: str
    onset_description: Optional[str] = None
    frequency: str  # 'daily', 'weekly', 'monthly', 'rarely'
    awareness_date: Optional[str] = None
    disclosed_to_others: bool = False
    knows_similar_others: bool = False

class QuestionnaireStatusResponse(BaseModel):
    has_submitted: bool
    matched: bool
    chatroom_id: Optional[str] = None
