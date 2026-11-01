from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.memory import Memory
from app.models.user import User
from app.schemas import MemoryCreate, MemoryUpdate, MemoryOut
from app.security import get_current_user

router = APIRouter(prefix="/memories", tags=["memories"])

@router.get("", response_model=list[MemoryOut])
def list_memories(
    search: str = Query(default="", max_length=200),
    visibility: str = Query(default=""),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Memory).where(Memory.user_id == user.id)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(or_(Memory.title.ilike(pattern), Memory.content.ilike(pattern)))
    if visibility in ("private", "public"):
        stmt = stmt.where(Memory.visibility == visibility)
    if from_date:
        stmt = stmt.where(Memory.occurred_at >= from_date)
    if to_date:
        stmt = stmt.where(Memory.occurred_at <= to_date)
    stmt = stmt.order_by(Memory.created_at.desc()).offset(offset).limit(limit)
    return db.scalars(stmt).all()

@router.post("", response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
def create_memory(payload: MemoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = Memory(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{memory_id}", response_model=MemoryOut)
def get_memory(memory_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Memory, memory_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy kỷ niệm.")
    return item

@router.patch("/{memory_id}", response_model=MemoryOut)
def update_memory(memory_id: int, payload: MemoryUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Memory, memory_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy kỷ niệm.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Memory, memory_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy kỷ niệm.")
    db.delete(item)
    db.commit()
