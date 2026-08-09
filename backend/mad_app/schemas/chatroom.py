from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class MemberOut(BaseModel):
    profile_id: str
    display_name: str
    avatar_seed: str

class MessageOut(BaseModel):
    id: str
    chatroom_id: str
    profile_id: str
    display_name: str
    avatar_seed: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True

class ChatroomInfo(BaseModel):
    id: str
    addiction_type: str
    is_general: bool
    created_at: datetime
    members: List[MemberOut]
    last_message: Optional[MessageOut] = None

class MessageCreate(BaseModel):
    content: str
