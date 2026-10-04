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
    Message, SobrietyLog, DailyTask, UserTaskCompletion, SOSEvent, GraduationOffer, JournalEntry, IfThenPlan
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
    # Foundational (Days 0-7)
    {"text": "Drink a large glass of ice water and take 5 physiological sighs.", "tier": "foundational", "min_days": 0, "addiction": None},
    {"text": "Complete a 3-minute guided box breathing session in the Wellness Hub.", "tier": "foundational", "min_days": 0, "addiction": None},
    {"text": "Write down 3 basic things you are grateful for today.", "tier": "foundational", "min_days": 0, "addiction": None},
    {"text": "Clear your immediate environment of any cues, triggers, or reminders.", "tier": "foundational", "min_days": 0, "addiction": None},
    {"text": "Check in with your anonymous support circle and send a supportive word.", "tier": "foundational", "min_days": 0, "addiction": None},

    # Growth (Days 8-30)
    {"text": "Review your trigger patterns and write an If-Then plan for your top trigger.", "tier": "growth", "min_days": 8, "addiction": None},
    {"text": "Log an honest private entry in your journal about an uncomfortable emotion.", "tier": "growth", "min_days": 8, "addiction": None},
    {"text": "Prepare and practice an evening non-chemical replacement ritual.", "tier": "growth", "min_days": 8, "addiction": "alcohol"},
    {"text": "Watch Dr. K's recovery video in the Wellness hub and identify your habit loop.", "tier": "growth", "min_days": 8, "addiction": None},
    {"text": "Keep hands busy for 10 minutes after meals with non-smoking distraction.", "tier": "growth", "min_days": 8, "addiction": "smoking"},

    # Mastery (Days 31+)
    {"text": "Write a reflective note to your Day 1 self honoring how far you've come.", "tier": "mastery", "min_days": 31, "addiction": None},
    {"text": "Pre-plan your exact refusal response for an upcoming high-risk social event.", "tier": "mastery", "min_days": 31, "addiction": None},
    {"text": "Share an encouraging insight or milestone victory in your circle to inspire peers.", "tier": "mastery", "min_days": 31, "addiction": None},
    {"text": "Practice 20 minutes of restorative somatic yoga or deep nervous system meditation.", "tier": "mastery", "min_days": 31, "addiction": None},
    {"text": "Set a mindful digital boundary or 1-hour screen-free evening reset window.", "tier": "mastery", "min_days": 31, "addiction": "gaming"},
]

async def seed_data():
    print("Seeding database with demo data...")
    # Create tables if not existing
    async with engine.begin() as conn:
        from mad_app.db.models import Base
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Clear existing data
        await db.execute(delete(DailyTask))
        await db.execute(delete(UserTaskCompletion))
        await db.execute(delete(SOSEvent))
        await db.execute(delete(Message))
        await db.execute(delete(ChatroomMember))
        await db.execute(delete(Chatroom))
        await db.execute(delete(QuestionnaireResponse))
        await db.execute(delete(SobrietyLog))
        await db.execute(delete(JournalEntry))
        await db.execute(delete(IfThenPlan))
        await db.execute(delete(Profile))
        await db.execute(delete(User))
        await db.execute(delete(GraduationOffer))
        await db.commit()

        # Seed Daily Tasks
        for task_data in DEMO_TASKS:
            dt = DailyTask(
                task_text=task_data["text"],
                addiction_type=task_data["addiction"],
                difficulty_tier=task_data["tier"],
                min_streak_days=task_data["min_days"]
            )
            db.add(dt)
        await db.commit()
        print(f"[OK] Created {len(DEMO_TASKS)} adaptive support tasks")

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
            equipped_aura = "default"
            equipped_title = "The Seeker"

            if udata["display_name"] == "Fox_482":
                longest_streak = 39
                total_checkins = 38
                equipped_aura = "cyan"
                equipped_title = "The Pathfinder"
            elif udata["display_name"] == "Wolf_764":
                longest_streak = 40
                total_checkins = 35
                equipped_aura = "amethyst"
                equipped_title = "The Guardian"
            elif udata["addiction"] in ["alcohol", "smoking"]:
                longest_streak = 25
                total_checkins = 20

            profile = Profile(
                user_id=user.id,
                display_name=udata["display_name"],
                avatar_seed=generate_avatar_seed(),
                longest_streak_days=longest_streak,
                total_checkins=total_checkins,
                equipped_aura=equipped_aura,
                equipped_title=equipped_title
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

        # Seed journal entries for Fox and Wolf
        fox_user = next((u for u, _, ud in created_users if ud["display_name"] == "Fox_482"), None)
        wolf_user = next((u for u, _, ud in created_users if ud["display_name"] == "Wolf_764"), None)

        if fox_user:
            journal_entries_fox = [
                JournalEntry(
                    user_id=fox_user.id,
                    title="Day 1 — Fresh start",
                    content="I've decided to be honest with myself today. I've been drinking every evening for years and I don't even enjoy it anymore. Joining this circle is the first real thing I've done about it. Feeling scared but also a little hopeful.",
                    mood=3,
                    created_at=datetime.now(timezone.utc) - timedelta(days=6)
                ),
                JournalEntry(
                    user_id=fox_user.id,
                    title="Rough night",
                    content="Had a really stressful day at work and the urge was overwhelming. I didn't drink but it was close. I kept reminding myself of the 5-4-3-2-1 technique from the resources. Named 5 things I could see. It helped. Barely, but it helped.",
                    mood=2,
                    created_at=datetime.now(timezone.utc) - timedelta(days=4)
                ),
                JournalEntry(
                    user_id=fox_user.id,
                    title="Slipped yesterday — writing through it",
                    content="I had a drink last night. I'm not going to beat myself up the way I usually would. I logged the slip in Reboot Mind and I'm here writing about it instead. The honest truth: I was lonely. I think loneliness is my real trigger more than anything else. Going to explore that.",
                    mood=2,
                    created_at=datetime.now(timezone.utc) - timedelta(days=2)
                ),
                JournalEntry(
                    user_id=fox_user.id,
                    content="Today was actually okay. Went for a walk. Had coffee with a friend (non-alcoholic obviously). Tomorrow I want to try the urge surfing technique. Writing this feels less pointless than I thought it would.",
                    mood=4,
                    created_at=datetime.now(timezone.utc) - timedelta(hours=10)
                ),
            ]
            for je in journal_entries_fox:
                db.add(je)

        if wolf_user:
            journal_entries_wolf = [
                JournalEntry(
                    user_id=wolf_user.id,
                    title="40 days",
                    content="40 days without a single cigarette. I didn't think I'd make it past 3. The cravings still come but they feel different now — more like passing weather than a storm I have to survive. Writing this so I remember what 40 days feels like.",
                    mood=5,
                    created_at=datetime.now(timezone.utc) - timedelta(days=1)
                ),
            ]
            for je in journal_entries_wolf:
                db.add(je)

        if fox_user:
            if_then_plans_fox = [
                IfThenPlan(
                    user_id=fox_user.id,
                    trigger_tag="stress",
                    coping_action="Take 5 physiological sighs, drink a tall glass of ice water, and text my anonymous circle."
                ),
                IfThenPlan(
                    user_id=fox_user.id,
                    trigger_tag="loneliness",
                    coping_action="Write in my Reboot Mind private journal for 5 minutes and listen to my favorite frisson music."
                ),
                IfThenPlan(
                    user_id=fox_user.id,
                    trigger_tag="late night",
                    coping_action="Make chamomile tea, put phone in drawer, and do 5 minutes of Legs-Up-The-Wall yoga."
                ),
            ]
            for plan in if_then_plans_fox:
                db.add(plan)
            print("[OK] Seeded demo If-Then plans")

        await db.commit()
        print("[OK] Seeded demo journal entries")

    print("\n---------------------------------------------------")
    print("Seed process complete! Demo accounts ready:")
    print("Password for all accounts: demo123")
    for udata in DEMO_USERS:
        print(f" - Email: {udata['email']} | Display Name: {udata['display_name']} | Addiction: {udata['addiction']}")
    print("---------------------------------------------------\n")

if __name__ == "__main__":
    asyncio.run(seed_data())
