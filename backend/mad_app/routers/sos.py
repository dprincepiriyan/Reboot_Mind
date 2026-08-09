from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from mad_app.db.session import get_db
from mad_app.db.models import SOSEvent, Profile, ChatroomMember
from mad_app.schemas.sos import SOSTriggerRequest, SOSResponse, CrisisResource
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/sos", tags=["sos"])

CRISIS_RESOURCES = [
    CrisisResource(
        name="988 Suicide & Crisis Lifeline",
        contact="Call or Text 988",
        type="phone",
        description="Free, confidential 24/7 support for anyone in distress."
    ),
    CrisisResource(
        name="SAMHSA’s National Helpline",
        contact="1-800-662-4357",
        type="phone",
        description="Free, confidential, 24/7, 365-day treatment referral and information service."
    ),
    CrisisResource(
        name="Crisis Text Line",
        contact="Text HOME to 741741",
        type="text",
        description="Connect with a crisis counselor 24/7 for free support via text."
    ),
    CrisisResource(
        name="International Crisis Resources",
        contact="https://findahelpline.com",
        type="web",
        description="Free, confidential support services around the globe."
    )
]

@router.post("", response_model=SOSResponse)
async def trigger_sos(
    req: SOSTriggerRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Verify membership
    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == req.chatroom_id, ChatroomMember.profile_id == profile.id)
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this chatroom")

    sos_entry = SOSEvent(
        user_id=user_id,
        chatroom_id=req.chatroom_id,
        level=req.level,
        resolved=False
    )
    db.add(sos_entry)
    await db.commit()
    await db.refresh(sos_entry)

    # Note: Socket event emission is handled via socket namespace or main app
    # If level == 'urgent', include resources
    resources = CRISIS_RESOURCES if req.level == "urgent" else None

    return SOSResponse(
        event_id=sos_entry.id,
        level=sos_entry.level,
        triggered_at=sos_entry.triggered_at,
        resources=resources
    )
