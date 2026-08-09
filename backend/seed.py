import asyncio
import hashlib
import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

import bcrypt
from mad_app.db.session import AsyncSessionLocal, engine
from mad_app.db.models import (
    User, Profile, QuestionnaireResponse, Chatroom, ChatroomMember,
    Message, SobrietyLog, DailyTask, UserTaskCompletion, SOSEvent, GraduationOffer
)
from mad_app.services.matching import compute_feature_vector, run_matching_batch
from mad_app.services.anonymizer import generate_avatar_seed

DEMO_USERS = [
    # Alcohol group (3 users)
    {"email": "fox@demo.com", "display_name": "Fox_482", "addiction": "alcohol", "freq": "daily", "disclosed": True, "knows": True},
    {"email": "owl@demo.com", "display_name": "Owl_917", "addiction": "alcohol", "freq": "daily", "disclosed": False, "knows": True},
    {"email": "bear@demo.com", "display_name": "Bear_331", "addiction": "alcohol", "freq": "weekly", "disclosed": True, "knows": False},
    # Smoking group (3 users)
    {"email": "wolf@demo.com", "display_name": "Wolf_764", "addiction": "smoking", "freq": "daily", "disclosed": True, "knows": True},
    {"email": "deer@demo.com", "display_name": "Deer_155", "addiction": "smoking", "freq": "weekly", "disclosed": False, "knows": False},
    {"email": "hawk@demo.com", "display_name": "Hawk_629", "addiction": "smoking", "freq": "monthly", "disclosed": True, "knows": True},
    # Gaming group (2 users)
    {"email": "lynx@demo.com", "display_name": "Lynx_843", "addiction": "gaming", "freq": "daily", "disclosed": False, "knows": True},
    {"email": "seal@demo.com", "display_name": "Seal_507", "addiction": "gaming", "freq": "daily", "disclosed": True, "knows": True},
]

DEMO_TASKS = [
    # Universal tasks
    {"text": "Write down 3 things you are grateful for today.", "addiction": None},
    {"text": "Drink a glass of water and take 5 deep breaths when feeling a craving.", "addiction": None},
    {"text": "Reach out to your anonymous support group with an encouraging message.", "addiction": None},
    {"text": "Identify one craving trigger today and write a simple coping strategy.", "addiction": None},
    # Alcohol specific
    {"text": "Replace evening drinking routine with herbal tea or sparkling water.", "addiction": "alcohol"},
    {"text": "Refine your response when offered a drink in social situations.", "addiction": "alcohol"},
    # Smoking specific
    {"text": "Keep your hands busy for 10 minutes after meals (stretch, draw, squeeze stress ball).", "addiction": "smoking"},
    {"text": "Clean your primary living space to remove smoke odors and triggers.", "addiction": "smoking"},
    # Gaming specific
    {"text": "Set a screen-free timer 1 hour before going to bed.", "addiction": "gaming"},
    {"text": "Engage in a physical activity or outdoor walk for 20 minutes.", "addiction": "gaming"},
]

async def seed_data():
    print("Seeding database with demo data...")
    # Create tables if not existing
    async with engine.begin() as conn:
        from mad_app.db.models import Base
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Clear existing data
        await db.execute(delete(SOSEvent))
        await db.execute(delete(UserTaskCompletion))
        await db.execute(delete(DailyTask))
        await db.execute(delete(SobrietyLog))
        await db.execute(delete(Message))
        await db.execute(delete(ChatroomMember))
        await db.execute(delete(Chatroom))
        await db.execute(delete(QuestionnaireResponse))
        await db.execute(delete(Profile))
        await db.execute(delete(User))
        await db.execute(delete(GraduationOffer))
        await db.commit()

        # Seed Daily Tasks
        for task_data in DEMO_TASKS:
            dt = DailyTask(task_text=task_data["text"], addiction_type=task_data["addiction"])
            db.add(dt)
        await db.commit()
        print(f"[OK] Created {len(DEMO_TASKS)} daily support tasks")

        # Create Demo Users & Profiles & Questionnaires
        created_users = []
        now_dt = datetime.now(timezone.utc)
        for udata in DEMO_USERS:
            email_h = hashlib.sha256(udata["email"].encode("utf-8")).hexdigest()
            pass_h = bcrypt.hashpw("demo123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            user = User(email_hash=email_h, password_hash=pass_h)
            db.add(user)
            await db.flush()

            longest_streak = 0
            total_checkins = 0
            if udata["display_name"] == "Fox_482":
                longest_streak = 39
                total_checkins = 38
            elif udata["addiction"] in ["alcohol", "smoking"]:
                longest_streak = 40
                total_checkins = 35

            profile = Profile(
                user_id=user.id,
                display_name=udata["display_name"],
                avatar_seed=generate_avatar_seed(),
                longest_streak_days=longest_streak,
                total_checkins=total_checkins
            )
            db.add(profile)

            feat_vec = compute_feature_vector(
                addiction_type=udata["addiction"],
                frequency=udata["freq"],
                disclosed_to_others=udata["disclosed"],
                knows_similar_others=udata["knows"]
            )

            q_resp = QuestionnaireResponse(
                user_id=user.id,
                addiction_type=udata["addiction"],
                frequency=udata["freq"],
                disclosed_to_others=udata["disclosed"],
                knows_similar_others=udata["knows"],
                onset_description=f"Struggling with {udata['addiction']} for a few months.",
                feature_vector=feat_vec,
                matched=False
            )
            db.add(q_resp)

            # Seed Sobriety Logs
            if udata["addiction"] in ["alcohol", "smoking"]:
                s_log = SobrietyLog(
                    user_id=user.id,
                    event_type="start",
                    event_at=now_dt - timedelta(days=40),
                    note="Starting my recovery journey today!"
                )
                db.add(s_log)

                for d in range(1, 35):
                    c_log = SobrietyLog(
                        user_id=user.id,
                        event_type="checkin",
                        event_at=now_dt - timedelta(days=40 - d),
                        note=f"Day {d} check-in"
                    )
                    db.add(c_log)

                if udata["display_name"] == "Fox_482":
                    r_log = SobrietyLog(
                        user_id=user.id,
                        event_type="relapse",
                        event_at=now_dt - timedelta(days=1),
                        note="Had a slip last night. Getting back on track today."
                    )
                    db.add(r_log)
                    
                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="craving",
                        trigger_tag="stress",
                        event_at=now_dt - timedelta(days=10),
                        note="Work stress trigger"
                    ))
                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="craving",
                        trigger_tag="boredom",
                        event_at=now_dt - timedelta(days=8),
                        note="Late night boredom"
                    ))
                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="craving",
                        trigger_tag="social",
                        event_at=now_dt - timedelta(days=5),
                        note="Triggered at a dinner party"
                    ))
                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="craving",
                        trigger_tag="late night",
                        event_at=now_dt - timedelta(days=3),
                        note="Late night urge"
                    ))
                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="craving",
                        trigger_tag="stress",
                        event_at=now_dt - timedelta(days=2),
                        note="High stress evening"
                    ))

                    db.add(SobrietyLog(
                        user_id=user.id,
                        event_type="checkin",
                        event_at=now_dt - timedelta(hours=2),
                        note="Checked in after the slip. Feeling motivated."
                    ))

            elif udata["display_name"] == "Wolf_764":
                s_log = SobrietyLog(user_id=user.id, event_type="start", note="Starting my recovery journey today!")
                db.add(s_log)

            created_users.append((user, profile, udata))

        await db.commit()
        print(f"[OK] Created {len(DEMO_USERS)} demo users with questionnaires")

        # Run matching algorithm immediately
        print("Running initial algorithmic matching...")
        await run_matching_batch(db)
        print("[OK] Algorithmic matching completed!")

        # Add sample messages to matched rooms
        res = await db.execute(select(Chatroom))
        rooms = res.scalars().all()
        for room in rooms:
            mem_res = await db.execute(select(ChatroomMember).where(ChatroomMember.chatroom_id == room.id))
            members = mem_res.scalars().all()
            if members:
                m1 = Message(
                    chatroom_id=room.id,
                    profile_id=members[0].profile_id,
                    content="Hello everyone! Glad to join this support circle."
                )
                db.add(m1)
                if len(members) > 1:
                    m2 = Message(
                        chatroom_id=room.id,
                        profile_id=members[1].profile_id,
                        content="Hi! Welcome. We're in this together."
                    )
                    db.add(m2)
        await db.commit()
        print("[OK] Created sample messages in matched chatrooms")

    print("\n---------------------------------------------------")
    print("Seed process complete! Demo accounts ready:")
    print("Password for all accounts: demo123")
    for udata in DEMO_USERS:
        print(f" - Email: {udata['email']} | Display Name: {udata['display_name']} | Addiction: {udata['addiction']}")
    print("---------------------------------------------------\n")

if __name__ == "__main__":
    asyncio.run(seed_data())
