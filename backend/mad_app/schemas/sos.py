from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SOSTriggerRequest(BaseModel):
    chatroom_id: str
    level: str  # 'struggling' or 'urgent'

class CrisisResource(BaseModel):
    name: str
    contact: str
    type: str  # 'phone', 'text', 'web'
    description: str

class SOSResponse(BaseModel):
    event_id: str
    level: str
    triggered_at: datetime
    resources: Optional[List[CrisisResource]] = None
