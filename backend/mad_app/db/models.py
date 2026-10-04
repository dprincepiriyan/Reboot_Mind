import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Boolean, DateTime, ForeignKey, Text, JSON, Integer, Enum, func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Isolated relationship to Profile
    profile: Mapped[Optional["Profile"]] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    questionnaire: Mapped[Optional["QuestionnaireResponse"]] = relationship("QuestionnaireResponse", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sobriety_logs: Mapped[List["SobrietyLog"]] = relationship("SobrietyLog", back_populates="user", cascade="all, delete-orphan")
    journal_entries: Mapped[List["JournalEntry"]] = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    if_then_plans: Mapped[List["IfThenPlan"]] = relationship("IfThenPlan", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    avatar_seed: Mapped[str] = mapped_column(String(64), nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    total_checkins: Mapped[int] = mapped_column(Integer, default=0)
    equipped_aura: Mapped[str] = mapped_column(String(64), default="default")
    equipped_title: Mapped[str] = mapped_column(String(64), default="The Seeker")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="profile")
    memberships: Mapped[List["ChatroomMember"]] = relationship("ChatroomMember", back_populates="profile", cascade="all, delete-orphan")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="profile", cascade="all, delete-orphan")


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    addiction_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    onset_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    frequency: Mapped[str] = mapped_column(String(32), nullable=False) # e.g. daily, weekly, monthly, rarely
    awareness_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    disclosed_to_others: Mapped[bool] = mapped_column(Boolean, default=False)
    knows_similar_others: Mapped[bool] = mapped_column(Boolean, default=False)
    feature_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    matched: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="questionnaire")


class Chatroom(Base):
    __tablename__ = "chatrooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    addiction_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    is_general: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    milestone_tier: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members: Mapped[List["ChatroomMember"]] = relationship("ChatroomMember", back_populates="chatroom", cascade="all, delete-orphan")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="chatroom", cascade="all, delete-orphan")
    sos_events: Mapped[List["SOSEvent"]] = relationship("SOSEvent", back_populates="chatroom", cascade="all, delete-orphan")


class ChatroomMember(Base):
    __tablename__ = "chatroom_members"

    chatroom_id: Mapped[str] = mapped_column(String(36), ForeignKey("chatrooms.id", ondelete="CASCADE"), primary_key=True)
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chatroom: Mapped["Chatroom"] = relationship("Chatroom", back_populates="members")
    profile: Mapped["Profile"] = relationship("Profile", back_populates="memberships")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chatroom_id: Mapped[str] = mapped_column(String(36), ForeignKey("chatrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    chatroom: Mapped["Chatroom"] = relationship("Chatroom", back_populates="messages")
    profile: Mapped["Profile"] = relationship("Profile", back_populates="messages")


class SobrietyLog(Base):
    __tablename__ = "sobriety_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False) # 'start', 'reset', 'checkin', 'relapse', 'craving'
    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_tag: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sobriety_logs")


class DailyTask(Base):
    __tablename__ = "daily_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_text: Mapped[str] = mapped_column(Text, nullable=False)
    addiction_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    difficulty_tier: Mapped[str] = mapped_column(String(32), default="foundational")  # 'foundational', 'growth', 'mastery'
    min_streak_days: Mapped[int] = mapped_column(Integer, default=0)


class UserTaskCompletion(Base):
    __tablename__ = "user_task_completions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("daily_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SOSEvent(Base):
    __tablename__ = "sos_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chatroom_id: Mapped[str] = mapped_column(String(36), ForeignKey("chatrooms.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[str] = mapped_column(String(32), nullable=False) # 'struggling', 'urgent'
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    chatroom: Mapped["Chatroom"] = relationship("Chatroom", back_populates="sos_events")


class GraduationOffer(Base):
    __tablename__ = "graduation_offers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chatroom_id: Mapped[str] = mapped_column(String(36), ForeignKey("chatrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    target_chatroom_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("chatrooms.id", ondelete="CASCADE"), nullable=True)
    milestone_tier: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending") # 'pending', 'accepted', 'declined'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5 scale
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="journal_entries")


class IfThenPlan(Base):
    __tablename__ = "if_then_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_tag: Mapped[str] = mapped_column(String(64), nullable=False)
    coping_action: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="if_then_plans")

