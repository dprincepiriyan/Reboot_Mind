import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mad_app.db.models import Chatroom, ChatroomMember, SobrietyLog, GraduationOffer, Profile

logger = logging.getLogger("graduation_service")

async def get_user_streak(db: AsyncSession, user_id: str) -> int:
    res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = res.scalars().all()
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
    diff = now - anchor_dt
    current_streak = max(0, diff.days)
    if start_date is None and last_reset is None:
        current_streak = max(0, (now - logs[0].event_at.replace(tzinfo=timezone.utc)).days)
    return current_streak

async def check_graduated_groups(db: AsyncSession, sio=None):
    logger.info("Running check_graduated_groups job...")
    res = await db.execute(
        select(Chatroom)
        .where(Chatroom.active == True, Chatroom.is_general == False)
        .options(selectinload(Chatroom.members).selectinload(ChatroomMember.profile))
    )
    rooms = res.scalars().all()

    for room in rooms:
        # Check if room already has a pending graduation offer
        offer_res = await db.execute(
            select(GraduationOffer)
            .where(GraduationOffer.chatroom_id == room.id, GraduationOffer.status == "pending")
        )
        if offer_res.scalars().first():
            continue

        if not room.members:
            continue

        member_streaks = []
        for m in room.members:
            if m.profile:
                streak = await get_user_streak(db, m.profile.user_id)
                member_streaks.append(streak)
            else:
                member_streaks.append(0)

        if not member_streaks:
            continue

        min_streak = min(member_streaks)
        logger.info(f"Chatroom {room.id} has minimum streak {min_streak} days.")

        target_tier = None
        if min_streak >= 365:
            target_tier = "1_year"
        elif min_streak >= 90:
            target_tier = "90_day"
        elif min_streak >= 30:
            target_tier = "30_day"

        if target_tier and room.milestone_tier != target_tier:
            room.milestone_tier = target_tier
            await db.flush()

            # Find target chatroom at the same tier and addiction type
            target_room_res = await db.execute(
                select(Chatroom)
                .where(
                    Chatroom.id != room.id,
                    Chatroom.active == True,
                    Chatroom.is_general == False,
                    Chatroom.milestone_tier == target_tier,
                    Chatroom.addiction_type == room.addiction_type
                )
                .options(selectinload(Chatroom.members))
            )
            candidates = target_room_res.scalars().all()
            target_room_id = None
            for cand in candidates:
                if len(cand.members) + len(room.members) <= 8:
                    target_room_id = cand.id
                    break

            offer = GraduationOffer(
                chatroom_id=room.id,
                target_chatroom_id=target_room_id,
                milestone_tier=target_tier,
                status="pending"
            )
            db.add(offer)
            await db.commit()
            logger.info(f"Created graduation offer {offer.id} for room {room.id} targeting {target_room_id}")

            if sio:
                try:
                    await sio.emit("graduation_offer", {
                        "chatroom_id": room.id,
                        "milestone_tier": target_tier,
                        "offer_id": offer.id
                    }, room=f"room_{room.id}")
                except Exception as e:
                    logger.error(f"Error emitting graduation_offer: {e}")
