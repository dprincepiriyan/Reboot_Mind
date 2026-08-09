from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileOut(BaseModel):
    id: str
    display_name: str
    avatar_seed: str
    created_at: datetime
    has_completed_questionnaire: bool = False
    chatroom_id: str | None = None

    class Config:
        from_attributes = True
