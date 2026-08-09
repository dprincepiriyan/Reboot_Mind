import logging
from datetime import datetime, timedelta
import numpy as np
from sklearn.preprocessing import normalize
from sklearn.cluster import KMeans
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mad_app.db.models import QuestionnaireResponse, Profile, Chatroom, ChatroomMember

logger = logging.getLogger("matching_service")

ADDICTION_TYPES = ["alcohol", "smoking", "gaming"]
FREQ_MAP = {"daily": 1.0, "weekly": 0.7, "monthly": 0.4, "rarely": 0.1}

def compute_feature_vector(
    addiction_type: str,
    frequency: str,
    disclosed_to_others: bool,
    knows_similar_others: bool
) -> dict:
    # One-hot addiction type
    at_vec = [1.0 if addiction_type == cat else 0.0 for cat in ADDICTION_TYPES]
    freq_val = FREQ_MAP.get(frequency.lower(), 0.5)
    disclosed_val = 1.0 if disclosed_to_others else 0.0
    knows_val = 1.0 if knows_similar_others else 0.0

    raw_vector = at_vec + [freq_val, freq_val, disclosed_val, knows_val]
    return {
        "vector": raw_vector,
        "addiction_type": addiction_type,
        "frequency": frequency
    }

async def run_matching_batch(db: AsyncSession, sio=None):
    """
    Background job: pull all unmatched users, cluster by addiction type, create chatrooms.
    """
    res = await db.execute(
        select(QuestionnaireResponse)
        .where(QuestionnaireResponse.matched == False)
        .order_by(QuestionnaireResponse.created_at.asc())
    )
    unmatched_responses = res.scalars().all()

    if not unmatched_responses:
        return

    logger.info(f"Running matching batch for {len(unmatched_responses)} unmatched users...")

    # Group by addiction type
    by_addiction: dict[str, list[QuestionnaireResponse]] = {}
    for resp in unmatched_responses:
        by_addiction.setdefault(resp.addiction_type, []).append(resp)

    for addiction_type, group in by_addiction.items():
        if len(group) < 2:
            # Check timeout for single waiting users (fallback to general room after 2 mins)
            for resp in group:
                created_at = resp.created_at
                # Handle naive datetime
                if created_at.tzinfo is not None:
                    now = datetime.now(created_at.tzinfo)
                else:
                    now = datetime.utcnow()
                    
                if (now - created_at) > timedelta(seconds=5):
                    await assign_to_general_room(db, resp, sio)
            continue

        # Build feature matrix
        vectors = []
        valid_resps = []
        for r in group:
            if r.feature_vector and "vector" in r.feature_vector:
                vectors.append(r.feature_vector["vector"])
                valid_resps.append(r)

        if not vectors:
            continue

        X = np.array(vectors, dtype=float)
        X_norm = normalize(X, norm='l2')

        n_samples = len(valid_resps)
        # Target cluster size: 2 to 3 users per cluster
        if n_samples in (2, 3):
            # Single cluster
            clusters = [valid_resps]
        else:
            n_clusters = max(1, n_samples // 3)
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_norm)
            
            cluster_dict = {}
            for idx, label in enumerate(labels):
                cluster_dict.setdefault(label, []).append(valid_resps[idx])
            clusters = list(cluster_dict.values())

        # Process each cluster
        for cluster in clusters:
            if len(cluster) == 1:
                # If leftover single user, check fallback or skip for next run
                r = cluster[0]
                created_at = r.created_at
                now = datetime.now(created_at.tzinfo) if created_at.tzinfo else datetime.utcnow()
                if (now - created_at) > timedelta(seconds=5):
                    await assign_to_general_room(db, r, sio)
                continue

            # Create chatroom for group
            new_room = Chatroom(addiction_type=addiction_type, is_general=False, active=True)
            db.add(new_room)
            await db.flush()

            for r in cluster:
                # Find profile
                prof_res = await db.execute(select(Profile).where(Profile.user_id == r.user_id))
                profile = prof_res.scalar_one_or_none()
                if not profile:
                    logger.warning(f"No profile found for user {r.user_id}, skipping")
                    continue

                member = ChatroomMember(chatroom_id=new_room.id, profile_id=profile.id)
                db.add(member)
                r.matched = True

                if sio:
                    try:
                        await sio.emit("matched", {"chatroom_id": new_room.id}, room=f"user_{r.user_id}")
                    except Exception as e:
                        logger.error(f"Error emitting matched socket event to user_{r.user_id}: {e}")

    await db.commit()

async def assign_to_general_room(db: AsyncSession, response: QuestionnaireResponse, sio=None):
    """
    Fallback: assign user to general open chatroom for their addiction type.
    """
    # Find or create general chatroom
    res = await db.execute(
        select(Chatroom)
        .where(Chatroom.addiction_type == response.addiction_type, Chatroom.is_general == True, Chatroom.active == True)
    )
    general_room = res.scalar_one_or_none()

    if not general_room:
        general_room = Chatroom(addiction_type=response.addiction_type, is_general=True, active=True)
        db.add(general_room)
        await db.flush()

    prof_res = await db.execute(select(Profile).where(Profile.user_id == response.user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        logger.warning(f"No profile found for user {response.user_id}, skipping")
        return

    # Check existing membership
    mem_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.profile_id == profile.id)
        .limit(1)
    )
    if not mem_res.scalars().first():
        member = ChatroomMember(chatroom_id=general_room.id, profile_id=profile.id)
        db.add(member)

    response.matched = True

    if sio:
        try:
            await sio.emit("matched", {"chatroom_id": general_room.id}, room=f"user_{response.user_id}")
        except Exception as e:
            logger.error(f"Error emitting matched event to user_{response.user_id}: {e}")
