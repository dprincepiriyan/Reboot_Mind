import hashlib
from datetime import datetime, timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mad_app.config import settings
from mad_app.db.session import get_db
from mad_app.db.models import User, Profile, QuestionnaireResponse, ChatroomMember
from mad_app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, ProfileOut
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
        chatroom_id=membership.chatroom_id if membership else None
    )
