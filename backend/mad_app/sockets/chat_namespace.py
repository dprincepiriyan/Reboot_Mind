import logging
from datetime import datetime, timezone
import jwt
import socketio
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from mad_app.config import settings
from mad_app.db.session import AsyncSessionLocal
from mad_app.db.models import User, Profile, ChatroomMember, Message, Chatroom

logger = logging.getLogger("chat_namespace")

class ChatNamespace(socketio.AsyncNamespace):
    def __init__(self, namespace=None):
        super().__init__(namespace)
        self.sid_to_user = {}  # sid -> {user_id, profile_id, display_name, avatar_seed}

    async def on_connect(self, sid, environ, auth=None):
        logger.info(f"Socket connecting: sid={sid}")
        token = None
        if auth and isinstance(auth, dict):
            token = auth.get("token")
        
        if not token:
            # Try query string fallback
            query_str = environ.get("QUERY_STRING", "")
            for param in query_str.split("&"):
                if param.startswith("token="):
                    token = param.split("=")[1]
                    break

        if not token:
            logger.warning(f"Connection rejected: No token provided (sid={sid})")
            return False

        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                return False

            async with AsyncSessionLocal() as db:
                res = await db.execute(select(Profile).where(Profile.user_id == user_id))
                profile = res.scalar_one_or_none()
                if not profile:
                    return False

                self.sid_to_user[sid] = {
                    "user_id": user_id,
                    "profile_id": profile.id,
                    "display_name": profile.display_name,
                    "avatar_seed": profile.avatar_seed
                }

                # Join user's personal room for direct notifications (e.g. matching alert)
                await self.enter_room(sid, f"user_{user_id}")
                logger.info(f"Socket connected: sid={sid}, user={user_id}, profile={profile.display_name}")
                return True
        except Exception as e:
            logger.error(f"Socket connection error: {e}")
            return False

    async def on_disconnect(self, sid):
        if sid in self.sid_to_user:
            info = self.sid_to_user.pop(sid)
            logger.info(f"Socket disconnected: sid={sid}, display_name={info['display_name']}")

    async def on_join_room(self, sid, data):
        user_info = self.sid_to_user.get(sid)
        if not user_info:
            return

        chatroom_id = data.get("chatroom_id")
        if not chatroom_id:
            return

        async with AsyncSessionLocal() as db:
            # Verify membership
            mem_res = await db.execute(
                select(ChatroomMember)
                .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == user_info["profile_id"])
            )
            if not mem_res.scalar_one_or_none():
                await self.emit("error", {"message": "Not a member of this chatroom"}, room=sid)
                return

            socket_room = f"room_{chatroom_id}"
            await self.enter_room(sid, socket_room)
            logger.info(f"User {user_info['display_name']} joined room {socket_room}")

            # Fetch recent message history
            msgs_res = await db.execute(
                select(Message)
                .where(Message.chatroom_id == chatroom_id)
                .options(selectinload(Message.profile))
                .order_by(Message.sent_at.desc())
                .limit(50)
            )
            messages = list(reversed(msgs_res.scalars().all()))

            history = [
                {
                    "id": m.id,
                    "chatroom_id": m.chatroom_id,
                    "profile_id": m.profile_id,
                    "display_name": m.profile.display_name if m.profile else "Anon",
                    "avatar_seed": m.profile.avatar_seed if m.profile else "default",
                    "content": m.content,
                    "sent_at": m.sent_at.isoformat() if hasattr(m.sent_at, "isoformat") else str(m.sent_at)
                }
                for m in messages
            ]
            await self.emit("room_history", {"chatroom_id": chatroom_id, "messages": history}, room=sid)

    async def on_send_message(self, sid, data):
        user_info = self.sid_to_user.get(sid)
        if not user_info:
            return

        chatroom_id = data.get("chatroom_id")
        content = data.get("content", "").strip()

        if not chatroom_id or not content:
            return

        async with AsyncSessionLocal() as db:
            # Verify membership
            mem_res = await db.execute(
                select(ChatroomMember)
                .where(ChatroomMember.chatroom_id == chatroom_id, ChatroomMember.profile_id == user_info["profile_id"])
            )
            if not mem_res.scalar_one_or_none():
                return

            now_dt = datetime.now(timezone.utc)
            new_msg = Message(
                chatroom_id=chatroom_id,
                profile_id=user_info["profile_id"],
                content=content,
                sent_at=now_dt
            )
            db.add(new_msg)
            await db.commit()
            await db.refresh(new_msg)

            sent_at_str = new_msg.sent_at.isoformat() if hasattr(new_msg.sent_at, "isoformat") else str(new_msg.sent_at)

            msg_out = {
                "id": new_msg.id,
                "chatroom_id": chatroom_id,
                "profile_id": user_info["profile_id"],
                "display_name": user_info["display_name"],
                "avatar_seed": user_info["avatar_seed"],
                "content": content,
                "sent_at": sent_at_str
            }

            socket_room = f"room_{chatroom_id}"
            await self.emit("receive_message", msg_out, room=socket_room)

    async def on_typing(self, sid, data):
        user_info = self.sid_to_user.get(sid)
        if not user_info:
            return

        chatroom_id = data.get("chatroom_id")
        if chatroom_id:
            socket_room = f"room_{chatroom_id}"
            await self.emit("user_typing", {
                "chatroom_id": chatroom_id,
                "display_name": user_info["display_name"]
            }, room=socket_room, skip_sid=sid)

    async def on_trigger_sos(self, sid, data):
        user_info = self.sid_to_user.get(sid)
        if not user_info:
            return

        chatroom_id = data.get("chatroom_id")
        level = data.get("level", "struggling")

        if chatroom_id:
            socket_room = f"room_{chatroom_id}"
            await self.emit("sos_alert", {
                "chatroom_id": chatroom_id,
                "display_name": user_info["display_name"],
                "level": level
            }, room=socket_room)
