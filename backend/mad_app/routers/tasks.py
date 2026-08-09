from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import DailyTask, UserTaskCompletion, QuestionnaireResponse
from mad_app.schemas.task import DailyTaskOut, TaskCompletionRequest
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

DEFAULT_TASKS = [
    {"task_text": "Write down 3 things you are grateful for today.", "addiction_type": None},
    {"task_text": "Drink a glass of water and take 5 deep breaths when feeling a craving.", "addiction_type": None},
    {"task_text": "Reach out to your anonymous support group with an encouraging word.", "addiction_type": None},
    {"task_text": "Identify one craving trigger today and write a coping plan.", "addiction_type": None},
    {"task_text": "Spend 10 minutes outdoors or walking mindfully.", "addiction_type": None},
]

@router.get("/daily", response_model=List[DailyTaskOut])
async def get_daily_tasks(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    # Get user's addiction type if available
    q_res = await db.execute(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id))
    q_resp = q_res.scalar_one_or_none()
    addiction_type = q_resp.addiction_type if q_resp else None

    # Fetch tasks
    query = select(DailyTask).where(
        (DailyTask.addiction_type == None) | (DailyTask.addiction_type == addiction_type)
    )
    res = await db.execute(query)
    tasks = res.scalars().all()

    # If DB has no tasks, auto-seed defaults into DB
    if not tasks:
        for t in DEFAULT_TASKS:
            dt = DailyTask(task_text=t["task_text"], addiction_type=t["addiction_type"])
            db.add(dt)
        await db.commit()
        res = await db.execute(query)
        tasks = res.scalars().all()

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
            completed=(t.id in completed_task_ids)
        )
        for t in tasks[:4] # limit to 4 tasks daily
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
