from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.memory import Memory
from app.models.user import User

router = APIRouter(prefix="/community", tags=["community"])

@router.get("/feed")
def community_feed(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    # Chỉ truy vấn bài công khai; không trả email hay dữ liệu riêng tư.
    items = db.scalars(
        select(Memory).options(joinedload(Memory.owner))
        .where(Memory.visibility == "public")
        .order_by(Memory.created_at.desc())
        .offset(offset).limit(limit)
    ).all()
    return [{
        "id": item.id,
        "title": item.title,
        "content": item.content,
        "image_url": item.image_url,
        "occurred_at": item.occurred_at.isoformat() if item.occurred_at else None,
        "created_at": item.created_at.isoformat(),
        "author": item.owner.display_name if item.owner else "Thành viên",
    } for item in items]
