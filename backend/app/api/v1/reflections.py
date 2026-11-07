from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.reflection import Reflection
from app.models.user import User
from app.schemas import ReflectionCreate, ReflectionUpdate, ReflectionOut
from app.security import get_current_user

router = APIRouter(prefix="/reflections", tags=["reflections"])

@router.get("", response_model=list[ReflectionOut])
def list_reflections(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Reflection).where(Reflection.user_id == user.id).order_by(Reflection.created_at.desc()).offset(offset).limit(limit)
    try:
        return db.scalars(stmt).all()
    except (OperationalError, ProgrammingError):
        try:
            db.rollback()
            db.execute(text("ALTER TABLE reflections ADD COLUMN image_url TEXT DEFAULT NULL"))
            db.commit()
            return db.scalars(stmt).all()
        except Exception:
            db.rollback()
            raise

@router.post("", response_model=ReflectionOut, status_code=status.HTTP_201_CREATED)
def create_reflection(payload: ReflectionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        item = Reflection(user_id=user.id, **payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except (OperationalError, ProgrammingError):
        try:
            db.rollback()
            db.execute(text("ALTER TABLE reflections ADD COLUMN image_url TEXT DEFAULT NULL"))
            db.commit()
            item = Reflection(user_id=user.id, **payload.model_dump())
            db.add(item)
            db.commit()
            db.refresh(item)
            return item
        except Exception:
            db.rollback()
            raise

@router.patch("/{item_id}", response_model=ReflectionOut)
def update_reflection(item_id: int, payload: ReflectionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Reflection, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy ghi chép.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reflection(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Reflection, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy ghi chép.")
    db.delete(item)
    db.commit()
