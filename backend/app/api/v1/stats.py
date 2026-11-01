from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.memory import Memory
from app.models.reflection import Reflection
from app.models.goal import Goal
from app.models.user import User
from app.schemas import DashboardStatsOut
from app.security import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/dashboard", response_model=DashboardStatsOut)
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_memories = db.scalar(select(func.count()).select_from(Memory).where(Memory.user_id == current_user.id)) or 0
    total_reflections = db.scalar(select(func.count()).select_from(Reflection).where(Reflection.user_id == current_user.id)) or 0
    total_goals = db.scalar(select(func.count()).select_from(Goal).where(Goal.user_id == current_user.id)) or 0
    goals_completed = db.scalar(select(func.count()).select_from(Goal).where(Goal.user_id == current_user.id, Goal.status == "completed")) or 0
    goals_in_progress = db.scalar(select(func.count()).select_from(Goal).where(Goal.user_id == current_user.id, Goal.status == "in_progress")) or 0

    recent = db.scalar(select(Memory.title).where(Memory.user_id == current_user.id).order_by(Memory.created_at.desc()).limit(1))

    days = 0
    if current_user.created_at:
        delta = datetime.now(timezone.utc) - current_user.created_at.replace(tzinfo=timezone.utc) if current_user.created_at.tzinfo is None else datetime.now(timezone.utc) - current_user.created_at
        days = max(0, delta.days)

    return DashboardStatsOut(
        total_memories=total_memories,
        total_reflections=total_reflections,
        total_goals=total_goals,
        goals_completed=goals_completed,
        goals_in_progress=goals_in_progress,
        recent_memory_title=recent,
        days_since_joined=days,
    )
