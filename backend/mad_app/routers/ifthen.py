from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import IfThenPlan
from mad_app.schemas.ifthen import IfThenPlanCreate, IfThenPlanOut
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/ifthen", tags=["ifthen"])

@router.get("", response_model=List[IfThenPlanOut])
async def get_plans(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(IfThenPlan)
        .where(IfThenPlan.user_id == user_id)
        .order_by(IfThenPlan.updated_at.desc())
    )
    return res.scalars().all()

@router.post("", response_model=IfThenPlanOut)
async def upsert_plan(
    req: IfThenPlanCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    normalized_tag = req.trigger_tag.strip().lower()
    coping_action = req.coping_action.strip()

    res = await db.execute(
        select(IfThenPlan)
        .where(
            IfThenPlan.user_id == user_id,
            IfThenPlan.trigger_tag == normalized_tag
        )
    )
    plan = res.scalar_one_or_none()

    if plan:
        plan.coping_action = coping_action
    else:
        plan = IfThenPlan(
            user_id=user_id,
            trigger_tag=normalized_tag,
            coping_action=coping_action
        )
        db.add(plan)

    await db.commit()
    await db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(IfThenPlan)
        .where(IfThenPlan.id == plan_id, IfThenPlan.user_id == user_id)
    )
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="If-Then plan not found")

    await db.delete(plan)
    await db.commit()
    return {"status": "success"}
