import hashlib
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mad_app.config import settings
from mad_app.db.session import get_db
from mad_app.db.models import User, Profile, QuestionnaireResponse, ChatroomMember, SobrietyLog
from mad_app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, ProfileOut, EquipRewardRequest, RewardItemOut
from mad_app.services.anonymizer import generate_display_name, generate_avatar_seed

router = APIRouter(prefix="/api/auth", tags=["auth"])
import bcrypt
security = HTTPBearer()

def hash_email(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(user_id: str) -> str:
    expires_delta = timedelta(hours=settings.JWT_EXPIRY_HOURS)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    email_h = hash_email(req.email)
    
    # Check if email hash exists
    res = await db.execute(select(User).where(User.email_hash == email_h))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Generate unique display name
    for _ in range(10):
        d_name = generate_display_name()
        existing_prof = await db.execute(select(Profile).where(Profile.display_name == d_name))
        if not existing_prof.scalar_one_or_none():
            break
    else:
        d_name = f"Anon_{hash_email(req.email)[:6]}"

    avatar_s = generate_avatar_seed()

    # Create User and Profile
    new_user = User(
        email_hash=email_h,
        password_hash=get_password_hash(req.password)
    )
    db.add(new_user)
    await db.flush()

    new_profile = Profile(
        user_id=new_user.id,
        display_name=d_name,
        avatar_seed=avatar_s
    )
    db.add(new_profile)
    await db.commit()

    token = create_access_token(new_user.id)
    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    email_h = hash_email(req.email)
    res = await db.execute(select(User).where(User.email_hash == email_h))
    user = res.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)

@router.get("/me", response_model=ProfileOut)
async def get_me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Profile)
        .where(Profile.user_id == user_id)
    )
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Profile not found or session expired")

    q_res = await db.execute(
        select(QuestionnaireResponse)
        .where(QuestionnaireResponse.user_id == user_id)
    )
    questionnaire = q_res.scalar_one_or_none()

    m_res = await db.execute(
        select(ChatroomMember)
        .where(ChatroomMember.profile_id == profile.id)
        .limit(1)
    )
    membership = m_res.scalars().first()

    return ProfileOut(
        id=profile.id,
        display_name=profile.display_name,
        avatar_seed=profile.avatar_seed,
        created_at=profile.created_at,
        has_completed_questionnaire=questionnaire is not None,
        chatroom_id=membership.chatroom_id if membership else None,
        equipped_aura=getattr(profile, "equipped_aura", "default") or "default",
        equipped_title=getattr(profile, "equipped_title", "The Seeker") or "The Seeker",
        longest_streak_days=getattr(profile, "longest_streak_days", 0) or 0
    )

AURA_REWARDS = [
    {"id": "default", "name": "Natural Mist", "days": 0, "description": "Clean, unembellished baseline aura."},
    {"id": "emerald", "name": "Emerald Glow", "days": 7, "description": "7 Days clean: Radiant emerald ring signifying newfound life."},
    {"id": "cyan", "name": "Cyan Frost", "days": 14, "description": "14 Days clean: Electric cyan aura of clarity and calm."},
    {"id": "amethyst", "name": "Amethyst Flame", "days": 30, "description": "30 Days clean: Deep violet fire of spiritual transformation."},
    {"id": "gold", "name": "Golden Halo", "days": 60, "description": "60 Days clean: Warm golden crown of tested mastery."},
    {"id": "phoenix", "name": "Phoenix Fire", "days": 90, "description": "90 Days clean: Blazing gradient of total rebirth from the ashes."},
]

TITLE_REWARDS = [
    {"id": "The Seeker", "name": "The Seeker", "days": 0, "description": "Taking the courage to seek a better way."},
    {"id": "The Resilient", "name": "The Resilient", "days": 7, "description": "Standing firm through the first critical week."},
    {"id": "The Pathfinder", "name": "The Pathfinder", "days": 14, "description": "Carving out new neurological pathways."},
    {"id": "The Guardian", "name": "The Guardian", "days": 30, "description": "A month of fierce self-protection and courage."},
    {"id": "The Sovereign", "name": "The Sovereign", "days": 60, "description": "Two months of reclaiming sovereign dominion over one's mind."},
    {"id": "The Luminary", "name": "The Luminary", "days": 90, "description": "Three months clean: A shining guide for fellow peers in darkness."},
]

async def _calculate_max_streak(user_id: str, profile: Profile, db: AsyncSession) -> int:
    logs_res = await db.execute(
        select(SobrietyLog)
        .where(SobrietyLog.user_id == user_id)
        .order_by(SobrietyLog.event_at.asc())
    )
    logs = logs_res.scalars().all()
    current_streak = 0
    if logs:
        start_date = None
        last_reset = None
        for log in logs:
            if log.event_type == "start" and start_date is None:
                start_date = log.event_at
            elif log.event_type in ["reset", "relapse"]:
                last_reset = log.event_at
        anchor = last_reset or start_date or logs[0].event_at
        if anchor.tzinfo is None:
            anchor = anchor.replace(tzinfo=timezone.utc)
        current_streak = max(0, (datetime.now(timezone.utc) - anchor).days)

    longest = getattr(profile, "longest_streak_days", 0) or 0
    return max(current_streak, longest)

@router.get("/rewards")
async def get_rewards(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    max_streak = await _calculate_max_streak(user_id, profile, db)
    equipped_aura = getattr(profile, "equipped_aura", "default") or "default"
    equipped_title = getattr(profile, "equipped_title", "The Seeker") or "The Seeker"

    auras = [
        RewardItemOut(
            id=a["id"],
            name=a["name"],
            type="aura",
            description=a["description"],
            days_required=a["days"],
            unlocked=(max_streak >= a["days"]),
            equipped=(equipped_aura == a["id"])
        )
        for a in AURA_REWARDS
    ]

    titles = [
        RewardItemOut(
            id=t["id"],
            name=t["name"],
            type="title",
            description=t["description"],
            days_required=t["days"],
            unlocked=(max_streak >= t["days"]),
            equipped=(equipped_title == t["id"])
        )
        for t in TITLE_REWARDS
    ]

    return {
        "max_streak_days": max_streak,
        "equipped_aura": equipped_aura,
        "equipped_title": equipped_title,
        "auras": auras,
        "titles": titles
    }

@router.post("/rewards/equip")
async def equip_reward(
    req: EquipRewardRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = prof_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    max_streak = await _calculate_max_streak(user_id, profile, db)

    # Validate aura unlock
    valid_aura = next((a for a in AURA_REWARDS if a["id"] == req.aura), None)
    if not valid_aura or max_streak < valid_aura["days"]:
        raise HTTPException(status_code=400, detail="Aura reward is still locked or invalid")

    # Validate title unlock
    valid_title = next((t for t in TITLE_REWARDS if t["id"] == req.title), None)
    if not valid_title or max_streak < valid_title["days"]:
        raise HTTPException(status_code=400, detail="Title reward is still locked or invalid")

    profile.equipped_aura = req.aura
    profile.equipped_title = req.title
    await db.commit()

    return {
        "status": "success",
        "equipped_aura": profile.equipped_aura,
        "equipped_title": profile.equipped_title
    }
