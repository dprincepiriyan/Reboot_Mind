from datetime import datetime, timezone, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import SobrietyLog, Profile
from mad_app.schemas.sobriety import SobrietyLogCreate, SobrietyLogOut, SobrietyStatus, MilestoneBadge, SobrietySummary
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/sobriety", tags=["sobriety"])

MILESTONES = [
    {"id": "day_1", "title": "First 24 Hours", "description": "Taking the crucial first step.", "icon": "🌅", "days": 1},
    {"id": "day_7", "title": "One Week Strong", "description": "7 consecutive days of determination.", "icon": "🌟", "days": 7},
    {"id": "day_30", "title": "One Month Milestone", "description": "30 days of clarity and courage.", "icon": "🏆", "days": 30},
    {"id": "day_90", "title": "Quarter Year Hero", "description": "90 days of personal transformation.", "icon": "💎", "days": 90},
]

@router.post("/log", response_model=SobrietyLogOut)
async def log_sobriety_event(
    req: SobrietyLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    if req.event_type not in ["start", "reset", "checkin", "relapse", "craving"]:
        raise HTTPException(status_code=400, detail="Invalid event type")

    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()

    if req.event_type == "checkin" and profile:
        profile.total_checkins += 1

    log_entry = SobrietyLog(
        user_id=user_id,
        event_type=req.event_type,
        note=req.note,
        trigger_tag=req.trigger_tag
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    # Re-calculate streak and update profile longest_streak_days
    if profile:
        res = await db.execute(
            select(SobrietyLog)
            .where(SobrietyLog.user_id == user_id)
            .order_by(SobrietyLog.event_at.asc())
        )
        logs = res.scalars().all()
        current_streak = 0
        if logs:
            start_date = None
            last_reset = None
            for log in logs:
                if log.event_type == "start" and start_date is None:
                    start_date = log.event_at
                elif log.event_type in ["reset", "relapse"]:
                    last_reset = log.event_at

            anchor_dt = last_reset or start_date or logs[0].event_at
            now = datetime.now(timezone.utc)
            if anchor_dt.tzinfo is None:
                anchor_dt = anchor_dt.replace(tzinfo=timezone.utc)
            diff = now - anchor_dt
            current_streak = max(0, diff.days)
            if start_date is None and last_reset is None:
                current_streak = max(0, (now - logs[0].event_at.replace(tzinfo=timezone.utc)).days)

        if current_streak > profile.longest_streak_days:
            profile.longest_streak_days = current_streak
            await db.commit()

    return log_entry

@router.get("/status", response_model=SobrietyStatus)
async def get_sobriety_status(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = res.scalars().all()

    # Fetch profile
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    longest_streak = profile.longest_streak_days if profile else 0

    if not logs:
        badges = [
            MilestoneBadge(
                id=m["id"], title=m["title"], description=m["description"],
                icon=m["icon"], earned=False, days_required=m["days"]
            )
            for m in MILESTONES
        ]
        return SobrietyStatus(
            streak_days=0, start_date=None, last_reset=None,
            last_checkin=None, checkin_today=False, badges=badges
        )

    start_date = None
    last_reset = None
    last_checkin = None
    today_utc = datetime.now(timezone.utc).date()
    checkin_today = False

    for log in logs:
        if log.event_type == "start" and start_date is None:
            start_date = log.event_at
        elif log.event_type in ["reset", "relapse"]:
            last_reset = log.event_at
        elif log.event_type == "checkin":
            last_checkin = log.event_at
            if log.event_at.date() == today_utc:
                checkin_today = True

    anchor_dt = last_reset or start_date or logs[0].event_at
    now = datetime.now(timezone.utc)
    
    if anchor_dt.tzinfo is None:
        anchor_dt = anchor_dt.replace(tzinfo=timezone.utc)
    
    diff = now - anchor_dt
    streak_days = max(0, diff.days)
    if start_date is None and last_reset is None and logs:
        streak_days = max(0, (now - logs[0].event_at.replace(tzinfo=timezone.utc)).days)

    badges = [
        MilestoneBadge(
            id=m["id"], title=m["title"], description=m["description"],
            icon=m["icon"], earned=(streak_days >= m["days"] or longest_streak >= m["days"]), days_required=m["days"]
        )
        for m in MILESTONES
    ]

    return SobrietyStatus(
        streak_days=streak_days,
        start_date=start_date,
        last_reset=last_reset,
        last_checkin=last_checkin,
        checkin_today=checkin_today,
        badges=badges
    )

@router.get("/logs", response_model=List[SobrietyLogOut])
async def get_sobriety_logs(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.desc())
        .limit(30)
    )
    return res.scalars().all()

@router.get("/summary", response_model=SobrietySummary)
async def get_sobriety_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = res.scalars().all()

    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    longest_streak = profile.longest_streak_days if profile else 0
    total_checkins = profile.total_checkins if profile else 0

    current_streak = 0
    if logs:
        start_date = None
        last_reset = None
        for log in logs:
            if log.event_type == "start" and start_date is None:
                start_date = log.event_at
            elif log.event_type in ["reset", "relapse"]:
                last_reset = log.event_at

        anchor_dt = last_reset or start_date or logs[0].event_at
        now = datetime.now(timezone.utc)
        if anchor_dt.tzinfo is None:
            anchor_dt = anchor_dt.replace(tzinfo=timezone.utc)
        diff = now - anchor_dt
        current_streak = max(0, diff.days)
        if start_date is None and last_reset is None:
            current_streak = max(0, (now - logs[0].event_at.replace(tzinfo=timezone.utc)).days)

    recent_events = sorted(logs, key=lambda x: x.event_at, reverse=True)[:5]

    return SobrietySummary(
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
        total_checkins=total_checkins,
        recent_events=recent_events
    )

@router.post("/relapse", response_model=SobrietyLogOut)
async def log_relapse(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = res.scalars().all()

    current_streak = 0
    if logs:
        start_date = None
        last_reset = None
        for log in logs:
            if log.event_type == "start" and start_date is None:
                start_date = log.event_at
            elif log.event_type in ["reset", "relapse"]:
                last_reset = log.event_at

        anchor_dt = last_reset or start_date or logs[0].event_at
        now = datetime.now(timezone.utc)
        if anchor_dt.tzinfo is None:
            anchor_dt = anchor_dt.replace(tzinfo=timezone.utc)
        diff = now - anchor_dt
        current_streak = max(0, diff.days)
        if start_date is None and last_reset is None:
            current_streak = max(0, (now - logs[0].event_at.replace(tzinfo=timezone.utc)).days)

    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if profile:
        if current_streak > profile.longest_streak_days:
            profile.longest_streak_days = current_streak

    relapse_log = SobrietyLog(
        user_id=user_id,
        event_type="relapse",
        note="Relapse logged honestly."
    )
    db.add(relapse_log)
    await db.commit()
    await db.refresh(relapse_log)

    return relapse_log

@router.post("/craving", response_model=SobrietyLogOut)
async def log_craving(
    req: SobrietyLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    log_entry = SobrietyLog(
        user_id=user_id,
        event_type="craving",
        trigger_tag=req.trigger_tag,
        note=req.note
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry

@router.get("/patterns")
async def get_sobriety_patterns(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
    )
    logs = res.scalars().all()

    trigger_counts = {}
    day_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    hour_counts = {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}

    for log in logs:
        if log.event_type not in ["craving", "relapse"]:
            continue

        if log.trigger_tag:
            trigger_counts[log.trigger_tag] = trigger_counts.get(log.trigger_tag, 0) + 1

        local_dt = log.event_at
        day_counts[local_dt.weekday()] += 1

        hour = local_dt.hour
        if 6 <= hour < 12:
            hour_counts["morning"] += 1
        elif 12 <= hour < 18:
            hour_counts["afternoon"] += 1
        elif 18 <= hour < 24:
            hour_counts["evening"] += 1
        else:
            hour_counts["night"] += 1

    return {
        "trigger_counts": trigger_counts,
        "day_counts": day_counts,
        "hour_counts": hour_counts
    }
