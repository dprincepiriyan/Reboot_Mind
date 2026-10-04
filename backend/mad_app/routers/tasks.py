from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import DailyTask, UserTaskCompletion, QuestionnaireResponse, SobrietyLog, Profile
from mad_app.schemas.task import DailyTaskOut, TaskCompletionRequest
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

TIERED_TASKS = [
    # Foundational (Days 0-7)
    {"task_text": "Drink a large glass of ice water and take 5 physiological sighs.", "tier": "foundational", "min_days": 0, "addiction_type": None},
    {"task_text": "Complete a 3-minute guided box breathing session in the Wellness Hub.", "tier": "foundational", "min_days": 0, "addiction_type": None},
    {"task_text": "Write down 3 basic things you are grateful for today.", "tier": "foundational", "min_days": 0, "addiction_type": None},
    {"task_text": "Clear your immediate environment of any cues, triggers, or reminders.", "tier": "foundational", "min_days": 0, "addiction_type": None},
    {"task_text": "Check in with your anonymous support circle and send a supportive word.", "tier": "foundational", "min_days": 0, "addiction_type": None},

    # Growth (Days 8-30)
    {"task_text": "Review your trigger patterns and write an If-Then plan for your top trigger.", "tier": "growth", "min_days": 8, "addiction_type": None},
    {"task_text": "Log an honest private entry in your journal about an uncomfortable emotion.", "tier": "growth", "min_days": 8, "addiction_type": None},
    {"task_text": "Prepare and practice an evening non-chemical replacement ritual.", "tier": "growth", "min_days": 8, "addiction_type": None},
    {"task_text": "Watch Dr. K's recovery video in the Wellness hub and identify your habit loop.", "tier": "growth", "min_days": 8, "addiction_type": None},
    {"task_text": "Practice 15 minutes of outdoor walking or clean dopamine activity.", "tier": "growth", "min_days": 8, "addiction_type": None},

    # Mastery (Days 31+)
    {"task_text": "Write a reflective note to your Day 1 self honoring how far you've come.", "tier": "mastery", "min_days": 31, "addiction_type": None},
    {"task_text": "Pre-plan your exact refusal response for an upcoming high-risk social event.", "tier": "mastery", "min_days": 31, "addiction_type": None},
    {"task_text": "Share an encouraging insight or milestone victory in your circle to inspire peers.", "tier": "mastery", "min_days": 31, "addiction_type": None},
    {"task_text": "Practice 20 minutes of restorative somatic yoga or deep nervous system meditation.", "tier": "mastery", "min_days": 31, "addiction_type": None},
    {"task_text": "Identify one area of life where your reclaimed time & money has created positive growth.", "tier": "mastery", "min_days": 31, "addiction_type": None},
]

async def _get_current_streak(user_id: str, db: AsyncSession) -> int:
    logs_res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = logs_res.scalars().all()
    if not logs:
        return 0

    start_date = None
    last_reset = None
    for log in logs:
        if log.event_type == "start" and start_date is None:
            start_date = log.event_at
        elif log.event_type in ["reset", "relapse"]:
            last_reset = log.event_at

    anchor = last_reset or start_date or logs[0].event_at
    if anchor.tzinfo is None:
        anchor = anchor.replace(tzinfo=timezone.utc)
    return max(0, (datetime.now(timezone.utc) - anchor).days)

@router.get("/daily", response_model=List[DailyTaskOut])
async def get_daily_tasks(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Calculate user's streak to determine adaptive difficulty
    streak = await _get_current_streak(user_id, db)

    if streak < 8:
        current_tier = "foundational"
        stage_name = "🌱 Foundational Stage (Days 1–7)"
    elif streak <= 30:
        current_tier = "growth"
        stage_name = "🌿 Growth Stage (Days 8–30)"
    else:
        current_tier = "mastery"
        stage_name = "🌳 Mastery Stage (Days 31+)"

    # Get user's addiction type if available
    q_res = await db.execute(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id))
    q_resp = q_res.scalar_one_or_none()
    addiction_type = q_resp.addiction_type if q_resp else None

    # Fetch tasks for current tier
    query = select(DailyTask).where(
        DailyTask.difficulty_tier == current_tier,
        (DailyTask.addiction_type == None) | (DailyTask.addiction_type == addiction_type)
    )
    res = await db.execute(query)
    tasks = res.scalars().all()

    # If DB has no tasks for this tier, auto-seed tiered tasks
    if not tasks:
        for t in TIERED_TASKS:
            dt = DailyTask(
                task_text=t["task_text"],
                addiction_type=t["addiction_type"],
                difficulty_tier=t["tier"],
                min_streak_days=t["min_days"]
            )
            db.add(dt)
        await db.commit()
        res = await db.execute(query)
        tasks = res.scalars().all()

    # Fallback to any tasks if needed
    if not tasks:
        fallback_res = await db.execute(select(DailyTask))
        tasks = fallback_res.scalars().all()

    # Check completions for today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    comp_res = await db.execute(
        select(UserTaskCompletion)
        .where(
            UserTaskCompletion.user_id == user_id,
            UserTaskCompletion.completed_at >= today_start
        )
    )
    completed_task_ids = {c.task_id for c in comp_res.scalars().all()}

    return [
        DailyTaskOut(
            id=t.id,
            task_text=t.task_text,
            addiction_type=t.addiction_type,
            completed=(t.id in completed_task_ids),
            difficulty_tier=getattr(t, "difficulty_tier", current_tier) or current_tier,
            min_streak_days=getattr(t, "min_streak_days", 0) or 0,
            streak_stage=stage_name
        )
        for t in tasks[:4]  # Curate top 4 tasks daily
    ]

@router.post("/{task_id}/complete")
async def complete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Check task exists
    t_res = await db.execute(select(DailyTask).where(DailyTask.id == task_id))
    if not t_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if already completed today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing_comp = await db.execute(
        select(UserTaskCompletion)
        .where(
            UserTaskCompletion.user_id == user_id,
            UserTaskCompletion.task_id == task_id,
            UserTaskCompletion.completed_at >= today_start
        )
    )
    if existing_comp.scalar_one_or_none():
        return {"status": "already_completed"}

    completion = UserTaskCompletion(user_id=user_id, task_id=task_id)
    db.add(completion)
    await db.commit()

    return {"status": "success"}
