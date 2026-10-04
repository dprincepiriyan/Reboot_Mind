from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mad_app.db.session import get_db
from mad_app.db.models import JournalEntry
from mad_app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/journal", tags=["journal"])


class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    content: str
    mood: Optional[int] = None  # 1-5


class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[int] = None


class JournalEntryOut(BaseModel):
    id: str
    title: Optional[str] = None
    content: str
    mood: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=JournalEntryOut)
async def create_entry(
    req: JournalEntryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    if req.mood is not None and not (1 <= req.mood <= 5):
        raise HTTPException(status_code=400, detail="Mood must be between 1 and 5")

    entry = JournalEntry(
        user_id=user_id,
        title=req.title,
        content=req.content,
        mood=req.mood
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("", response_model=List[JournalEntryOut])
async def list_entries(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
    )
    return res.scalars().all()


@router.put("/{entry_id}", response_model=JournalEntryOut)
async def update_entry(
    entry_id: str,
    req: JournalEntryUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == user_id)
    )
    entry = res.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if req.title is not None:
        entry.title = req.title
    if req.content is not None:
        entry.content = req.content
    if req.mood is not None:
        if not (1 <= req.mood <= 5):
            raise HTTPException(status_code=400, detail="Mood must be between 1 and 5")
        entry.mood = req.mood

    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == user_id)
    )
    entry = res.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    await db.delete(entry)
    await db.commit()
    return {"status": "deleted"}
