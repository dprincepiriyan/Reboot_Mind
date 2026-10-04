from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mad_app.db.session import get_db
from mad_app.db.models import Profile, Chatroom, ChatroomMember, Message, GraduationOffer
from mad_app.schemas.chatroom import ChatroomInfo, MessageOut, MemberOut
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/chatrooms", tags=["chatrooms"])

@router.get("", response_model=List[ChatroomInfo])
async def get_user_chatrooms(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        return []

    # Get memberships
    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.profile_id == profile.id)
    )
    memberships = mem_res.scalars().all()
    if not room_ids:
        # If user has completed questionnaire, automatically assign them to general circle for their addiction type
        from mad_app.db.models import QuestionnaireResponse
        from mad_app.services.matching import assign_to_general_room
        q_res = await db.execute(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id))
        q = q_res.scalar_one_or_none()
        if q:
            await assign_to_general_room(db, q)
            mem_res = await db.execute(
                select(ChatroomMember)
                .where(ChatroomMember.profile_id == profile.id)
            )
            memberships = mem_res.scalars().all()
            room_ids = [m.chatroom_id for m in memberships]

    if not room_ids:
        return []

    # Query room details
    rooms_res = await db.execute(
        select(Chatroom)
        .where(Chatroom.id.in_(room_ids), Chatroom.active == True)
        .options(
            selectinload(Chatroom.members).selectinload(ChatroomMember.profile)
        )
    )
    rooms = rooms_res.scalars().all()

    result = []
    for room in rooms:
        members_out = [
            MemberOut(
                profile_id=m.profile.id,
                display_name=m.profile.display_name,
                avatar_seed=m.profile.avatar_seed
            )
            for m in room.members if m.profile
        ]

        last_msg_out = None
        # Fetch the last message
        l_msg_res = await db.execute(
            select(Message)
            .where(Message.chatroom_id == room.id)
            .options(selectinload(Message.profile))
            .order_by(Message.sent_at.desc())
            .limit(1)
        )
        l_msg = l_msg_res.scalars().first()

        if l_msg:
            last_msg_out = MessageOut(
                id=l_msg.id,
                chatroom_id=l_msg.chatroom_id,
                profile_id=l_msg.profile_id,
                display_name=l_msg.profile.display_name if l_msg.profile else "Anon",
                avatar_seed=l_msg.profile.avatar_seed if l_msg.profile else "default",
                content=l_msg.content,
                sent_at=l_msg.sent_at
            )

        result.append(
            ChatroomInfo(
                id=room.id,
                addiction_type=room.addiction_type,
                is_general=room.is_general,
                created_at=room.created_at,
                members=members_out,
                last_message=last_msg_out
            )
        )

    return result

@router.get("/{chatroom_id}/messages", response_model=List[MessageOut])
async def get_room_messages(
    chatroom_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Verify membership
    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == profile.id)
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this chatroom")

    msgs_res = await db.execute(
        select(Message)
        .where(Message.chatroom_id == chatroom_id)
        .options(selectinload(Message.profile))
        .order_by(Message.sent_at.desc())
        .limit(100)
    )
    messages = list(reversed(msgs_res.scalars().all()))

    return [
        MessageOut(
            id=m.id,
            chatroom_id=m.chatroom_id,
            profile_id=m.profile_id,
            display_name=m.profile.display_name if m.profile else "Anon",
            avatar_seed=m.profile.avatar_seed if m.profile else "default",
            content=m.content,
            sent_at=m.sent_at
        )
        for m in messages
    ]

@router.get("/{chatroom_id}/graduation-offer")
async def get_graduation_offer(
    chatroom_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=403, detail="Not authorized")

    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == profile.id)
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this chatroom")

    offer_res = await db.execute(
        select(GraduationOffer)
        .where(GraduationOffer.chatroom_id == chatroom_id, GraduationOffer.status == "pending")
    )
    offer = offer_res.scalar_one_or_none()
    if not offer:
        return None

    return {
        "id": offer.id,
        "chatroom_id": offer.chatroom_id,
        "target_chatroom_id": offer.target_chatroom_id,
        "milestone_tier": offer.milestone_tier,
        "status": offer.status
    }

@router.post("/{chatroom_id}/graduation-offer/accept")
async def accept_graduation_offer(
    chatroom_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=403, detail="Not authorized")

    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == profile.id)
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this chatroom")

    # Atomically lock the offer row to prevent double-accept race condition (C-1, C-2)
    offer_res = await db.execute(
        select(GraduationOffer)
        .where(GraduationOffer.chatroom_id == chatroom_id, GraduationOffer.status == "pending")
        .with_for_update()
    )
    offer = offer_res.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=409, detail="Graduation offer already processed or not found")

    # Immediately mark as accepted to block concurrent requests
    offer.status = "accepted"
    await db.flush()

    room_res = await db.execute(select(Chatroom).where(Chatroom.id == chatroom_id))
    old_room = room_res.scalar_one_or_none()
    if not old_room:
        raise HTTPException(status_code=404, detail="Chatroom not found")

    target_room_id = offer.target_chatroom_id

    if not target_room_id:
        new_room = Chatroom(
            addiction_type=old_room.addiction_type,
            milestone_tier=offer.milestone_tier,
            is_general=False,
            active=True
        )
        db.add(new_room)
        await db.flush()
        target_room_id = new_room.id

    members_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == chatroom_id)
    )
    members = members_res.scalars().all()

    for m in members:
        t_mem_res = await db.execute(
            select(ChatroomMember)
            .where(ChatroomMember.chatroom_id == target_room_id, ChatroomMember.profile_id == m.profile_id)
        )
        if not t_mem_res.scalar_one_or_none():
            new_member = ChatroomMember(chatroom_id=target_room_id, profile_id=m.profile_id)
            db.add(new_member)
        await db.delete(m)

    old_room.active = False
    await db.commit()

    sio = request.app.state.sio
    if sio:
        try:
            await sio.emit("room_merged", {
                "old_room_id": chatroom_id,
                "new_room_id": target_room_id
            }, room=f"room_{chatroom_id}")
        except Exception as e:
            print(f"Error emitting room_merged: {e}")

    return {"status": "success", "new_chatroom_id": target_room_id}

@router.post("/{chatroom_id}/graduation-offer/decline")
async def decline_graduation_offer(
    chatroom_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=403, detail="Not authorized")

    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == profile.id)
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this chatroom")

    offer_res = await db.execute(
        select(GraduationOffer)
        .where(GraduationOffer.chatroom_id == chatroom_id, GraduationOffer.status == "pending")
    )
    offer = offer_res.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="No pending graduation offer found")

    offer.status = "declined"
    await db.commit()
    return {"status": "success"}
