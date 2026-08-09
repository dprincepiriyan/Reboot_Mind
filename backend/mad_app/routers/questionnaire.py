from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import QuestionnaireResponse, Profile, ChatroomMember
from mad_app.schemas.questionnaire import QuestionnaireSubmit, QuestionnaireStatusResponse
from mad_app.routers.auth import get_current_user_id
from mad_app.services.matching import compute_feature_vector, run_matching_batch

router = APIRouter(prefix="/api/questionnaire", tags=["questionnaire"])

@router.post("", response_model=QuestionnaireStatusResponse)
async def submit_questionnaire(
    req: QuestionnaireSubmit,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Check if already submitted
    res = await db.execute(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id))
    existing = res.scalar_one_or_none()

    feature_vec = compute_feature_vector(
        addiction_type=req.addiction_type,
        frequency=req.frequency,
        disclosed_to_others=req.disclosed_to_others,
        knows_similar_others=req.knows_similar_others
    )

    if existing:
        existing.addiction_type = req.addiction_type
        existing.onset_description = req.onset_description
        existing.frequency = req.frequency
        existing.awareness_date = req.awareness_date
        existing.disclosed_to_others = req.disclosed_to_others
        existing.knows_similar_others = req.knows_similar_others
        existing.feature_vector = feature_vec
        existing.matched = False  # reset matched flag to re-trigger matching if needed
    else:
        q_entry = QuestionnaireResponse(
            user_id=user_id,
            addiction_type=req.addiction_type,
            onset_description=req.onset_description,
            frequency=req.frequency,
            awareness_date=req.awareness_date,
            disclosed_to_others=req.disclosed_to_others,
            knows_similar_others=req.knows_similar_others,
            feature_vector=feature_vec,
            matched=False
        )
        db.add(q_entry)

    await db.commit()

    # Immediately attempt matching batch
    try:
        await run_matching_batch(db)
    except Exception as e:
        import logging
        logging.getLogger("questionnaire").error(f"Immediate matching failed: {e}", exc_info=True)

    # Check if profile is already in a chatroom
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.profile_id == profile.id)
        .limit(1)
    )
    membership = mem_res.scalars().first()

    return QuestionnaireStatusResponse(
        has_submitted=True,
        matched=membership is not None,
        chatroom_id=membership.chatroom_id if membership else None
    )

@router.get("/status", response_model=QuestionnaireStatusResponse)
async def get_questionnaire_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id))
    existing = res.scalar_one_or_none()

    if not existing:
        return QuestionnaireStatusResponse(has_submitted=False, matched=False, chatroom_id=None)

    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()

    membership = None
    if profile:
        mem_res = await db.execute(
            select(ChatroomMember)
            .where(ChatroomMember.profile_id == profile.id)
            .limit(1)
        )
        membership = mem_res.scalars().first()

    return QuestionnaireStatusResponse(
        has_submitted=True,
        matched=existing.matched or (membership is not None),
        chatroom_id=membership.chatroom_id if membership else None
    )
