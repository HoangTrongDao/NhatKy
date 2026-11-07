from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.goal import Goal
from app.models.user import User
from app.schemas import GoalCreate, GoalUpdate, GoalOut
from app.security import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("", response_model=list[GoalOut])
def list_goals(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc()).offset(offset).limit(limit)
    try:
        return db.scalars(stmt).all()
    except (OperationalError, ProgrammingError):
        try:
            db.rollback()
            db.execute(text("ALTER TABLE goals ADD COLUMN image_url TEXT DEFAULT NULL"))
            db.commit()
            return db.scalars(stmt).all()
        except Exception:
            db.rollback()
            raise

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        item = Goal(user_id=user.id, **payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except (OperationalError, ProgrammingError):
        try:
            db.rollback()
            db.execute(text("ALTER TABLE goals ADD COLUMN image_url TEXT DEFAULT NULL"))
            db.commit()
            item = Goal(user_id=user.id, **payload.model_dump())
            db.add(item)
            db.commit()
            db.refresh(item)
            return item
        except Exception:
            db.rollback()
            raise

@router.patch("/{item_id}", response_model=GoalOut)
def update_goal(item_id: int, payload: GoalUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Goal, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Goal, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục tiêu.")
    db.delete(item)
    db.commit()
