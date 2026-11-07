"""API endpoints cho khoảnh khắc ảnh Locket."""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.locket import Locket
from app.models.friend import Friendship
from app.models.user import User
from app.schemas import LocketCreate, LocketOut, LocketReact
from app.security import get_current_user

router = APIRouter(prefix="/lockets", tags=["lockets"])

DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _get_friend_ids(db: Session, user_id: int) -> list[int]:
    """Lấy danh sách ID bạn bè của người dùng."""
    return list(
        db.scalars(
            select(Friendship.friend_id).where(Friendship.user_id == user_id)
        ).all()
    )


# ── Đăng khoảnh khắc Locket mới ─────────────────────────────

@router.post("", response_model=LocketOut, status_code=status.HTTP_201_CREATED)
def create_locket(payload: LocketCreate, db: DB, current_user: CurrentUser):
    """Tạo khoảnh khắc Locket mới."""
    locket = Locket(
        user_id=current_user.id,
        image_url=payload.image_url,
        caption=payload.caption or "",
        visibility=payload.visibility,
        reactions_json="{}",
    )
    db.add(locket)
    db.commit()
    db.refresh(locket)
    return locket


# ── Bảng tin Locket chung (Feed) ─────────────────────────────

@router.get("", response_model=list[LocketOut])
def get_locket_feed(
    db: DB,
    current_user: CurrentUser,
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Lấy bảng tin Locket (của mình, của bạn bè, và công khai)."""
    friend_ids = _get_friend_ids(db, current_user.id)

    # Điều kiện hiển thị:
    # 1. Của chính mình
    # 2. Hoặc của bạn bè với visibility != 'private'
    # 3. Hoặc công khai (public)
    conditions = [
        Locket.user_id == current_user.id,
        Locket.visibility == "public",
    ]
    if friend_ids:
        conditions.append(
            and_(
                Locket.user_id.in_(friend_ids),
                Locket.visibility.in_(["friends", "public"]),
            )
        )

    stmt = (
        select(Locket)
        .options(joinedload(Locket.owner))
        .where(or_(*conditions))
        .order_by(Locket.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).unique().all()


# ── Khoảnh khắc của riêng tôi ───────────────────────────────

@router.get("/my", response_model=list[LocketOut])
def get_my_lockets(
    db: DB,
    current_user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Lấy danh sách Locket do chính tôi đăng."""
    stmt = (
        select(Locket)
        .options(joinedload(Locket.owner))
        .where(Locket.user_id == current_user.id)
        .order_by(Locket.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).unique().all()


# ── Khoảnh khắc của bạn bè ───────────────────────────────────

@router.get("/friends", response_model=list[LocketOut])
def get_friends_lockets(
    db: DB,
    current_user: CurrentUser,
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Lấy danh sách Locket từ bạn bè."""
    friend_ids = _get_friend_ids(db, current_user.id)
    if not friend_ids:
        return []

    stmt = (
        select(Locket)
        .options(joinedload(Locket.owner))
        .where(
            and_(
                Locket.user_id.in_(friend_ids),
                Locket.visibility.in_(["friends", "public"]),
            )
        )
        .order_by(Locket.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).unique().all()


# ── Chi tiết một Locket ──────────────────────────────────────

@router.get("/{locket_id}", response_model=LocketOut)
def get_locket(locket_id: int, db: DB, current_user: CurrentUser):
    """Xem một khoảnh khắc Locket."""
    locket = db.scalar(
        select(Locket)
        .options(joinedload(Locket.owner))
        .where(Locket.id == locket_id)
    )
    if not locket:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoảnh khắc Locket này.")

    # Kiểm tra quyền xem
    if locket.user_id != current_user.id and locket.visibility == "private":
        raise HTTPException(status_code=404, detail="Không tìm thấy khoảnh khắc Locket này.")

    if locket.user_id != current_user.id and locket.visibility == "friends":
        friend_ids = _get_friend_ids(db, current_user.id)
        if locket.user_id not in friend_ids:
            raise HTTPException(status_code=403, detail="Khoảnh khắc này chỉ dành cho bạn bè.")

    return locket


# ── Thả cảm xúc / Emoji reaction ────────────────────────────

@router.post("/{locket_id}/react", response_model=LocketOut)
def react_to_locket(
    locket_id: int,
    payload: LocketReact,
    db: DB,
    current_user: CurrentUser,
):
    """Thả hoặc hủy emoji reaction trên khoảnh khắc Locket."""
    locket = db.scalar(
        select(Locket)
        .options(joinedload(Locket.owner))
        .where(Locket.id == locket_id)
    )
    if not locket:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoảnh khắc Locket.")

    emoji = payload.emoji.strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji không hợp lệ.")

    # Lấy bản đồ reactions hiện tại
    reactions = dict(locket.reactions)
    user_list = reactions.get(emoji, [])

    if current_user.id in user_list:
        # Nếu đã react emoji này -> hủy thả
        user_list.remove(current_user.id)
        if not user_list:
            reactions.pop(emoji, None)
        else:
            reactions[emoji] = user_list
    else:
        # Thêm user vào danh sách react emoji này
        user_list.append(current_user.id)
        reactions[emoji] = user_list

    locket.reactions = reactions
    db.commit()
    db.refresh(locket)
    return locket


# ── Xóa khoảnh khắc Locket ───────────────────────────────────

@router.delete("/{locket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_locket(locket_id: int, db: DB, current_user: CurrentUser):
    """Xóa khoảnh khắc Locket (chỉ chính chủ mới có quyền xóa)."""
    locket = db.get(Locket, locket_id)
    if not locket or locket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoảnh khắc hoặc không có quyền xóa.")

    db.delete(locket)
    db.commit()
