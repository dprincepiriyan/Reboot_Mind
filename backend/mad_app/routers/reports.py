from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import SobrietyLog, UserTaskCompletion, Profile
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/reports", tags=["reports"])


class WeeklyReport(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    total_checkins: int
    checkins_this_week: int
    relapses_this_week: int
    tasks_completed_this_week: int
    top_trigger_this_week: Optional[str]
    avg_mood_this_week: Optional[float]
    motivational_message: str
    week_start: datetime
    week_end: datetime
    daily_checkin_map: dict  # {ISO date string: bool}


def _compute_streak(logs: list) -> int:
    if not logs:
        return 0
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
    return max(0, (now - anchor_dt).days)


def _get_motivational_message(streak: int, checkins_this_week: int) -> str:
    if streak == 0:
        return "Every day is a new opportunity to begin again. You've got this."
    elif streak < 7:
        return f"Day {streak} — small steps are still steps forward. Keep showing up."
    elif streak < 30:
        return f"{streak} days strong! Your consistency is building something real."
    elif streak < 90:
        return f"Over {streak} days clean — you are proving to yourself what you're capable of."
    elif streak < 365:
        return f"{streak} days. You've become someone who keeps their promises to themselves."
    else:
        return f"Over a year of sobriety. You are a quiet source of inspiration to everyone around you."


@router.get("/weekly", response_model=WeeklyReport)
async def get_weekly_report(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)

    # All-time logs for streak calculation
    all_logs_res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    all_logs = all_logs_res.scalars().all()

    # Profile for stored aggregates
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()

    current_streak = _compute_streak(all_logs)
    longest_streak = profile.longest_streak_days if profile else 0
    total_checkins = profile.total_checkins if profile else 0

    # Weekly logs
    weekly_logs = [
        l for l in all_logs
        if (l.event_at.replace(tzinfo=timezone.utc) if l.event_at.tzinfo is None else l.event_at) >= week_start
    ]

    checkins_this_week = sum(1 for l in weekly_logs if l.event_type == "checkin")
    relapses_this_week = sum(1 for l in weekly_logs if l.event_type == "relapse")

    # Top trigger this week
    trigger_counts: dict = {}
    moods = []
    for l in weekly_logs:
        if l.event_type in ["craving", "relapse"] and l.trigger_tag:
            trigger_counts[l.trigger_tag] = trigger_counts.get(l.trigger_tag, 0) + 1

    top_trigger = max(trigger_counts, key=lambda k: trigger_counts[k]) if trigger_counts else None

    # Tasks completed this week
    tasks_res = await db.execute(
        select(UserTaskCompletion)
        .where(
            UserTaskCompletion.user_id == user_id,
            UserTaskCompletion.completed_at >= week_start
        )
    )
    tasks_completed = len(tasks_res.scalars().all())

    # Build daily check-in map for last 7 days
    daily_checkin_map = {}
    for i in range(7):
        day = (now - timedelta(days=i)).date()
        day_str = day.isoformat()
        has_checkin = any(
            (l.event_at.replace(tzinfo=timezone.utc) if l.event_at.tzinfo is None else l.event_at).date() == day
            and l.event_type == "checkin"
            for l in weekly_logs
        )
        daily_checkin_map[day_str] = has_checkin

    motivational_message = _get_motivational_message(current_streak, checkins_this_week)

    return WeeklyReport(
        current_streak_days=current_streak,
        longest_streak_days=longest_streak,
        total_checkins=total_checkins,
        checkins_this_week=checkins_this_week,
        relapses_this_week=relapses_this_week,
        tasks_completed_this_week=tasks_completed,
        top_trigger_this_week=top_trigger,
        avg_mood_this_week=None,
        motivational_message=motivational_message,
        week_start=week_start,
        week_end=now,
        daily_checkin_map=daily_checkin_map
    )
