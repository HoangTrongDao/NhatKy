"""API endpoints cho tin nhắn giữa bạn bè."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.friend import Friendship
from app.models.message import Message
from app.models.user import User
from app.schemas import ConversationOut, MessageCreate, MessageOut, UserOut
from app.security import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _are_friends(db: Session, user_id: int, other_id: int) -> bool:
    """Kiểm tra hai người có phải bạn bè không."""
    return (
        db.query(Friendship)
        .filter(Friendship.user_id == user_id, Friendship.friend_id == other_id)
        .first()
        is not None
    )


# ── Tổng tin chưa đọc (ĐẶT TRƯỚC /{user_id}) ───────────

@router.get("/unread-count")
def unread_count(db: DB, current_user: CurrentUser):
    """Lấy tổng số tin nhắn chưa đọc."""
    count = (
        db.query(func.count(Message.id))
        .filter(
            Message.receiver_id == current_user.id,
            Message.read_at.is_(None),
        )
        .scalar()
    )
    return {"unread_count": count or 0}


# ── Danh sách hội thoại (ĐẶT TRƯỚC /{user_id}) ──────────

@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: DB, current_user: CurrentUser):
    """Lấy danh sách hội thoại (bạn bè đã nhắn tin), sắp xếp theo tin mới nhất."""
    uid = current_user.id

    # Lấy tất cả bạn bè
    friendships = (
        db.query(Friendship.friend_id)
        .filter(Friendship.user_id == uid)
        .all()
    )
    friend_ids = [f.friend_id for f in friendships]

    if not friend_ids:
        return []

    conversations: list[ConversationOut] = []

    for fid in friend_ids:
        # Tin nhắn mới nhất giữa 2 người
        last_msg = (
            db.query(Message)
            .filter(
                or_(
                    and_(Message.sender_id == uid, Message.receiver_id == fid),
                    and_(Message.sender_id == fid, Message.receiver_id == uid),
                )
            )
            .order_by(Message.created_at.desc())
            .first()
        )

        if last_msg is None:
            continue  # Chưa nhắn tin → không hiện trong danh sách

        # Đếm tin chưa đọc từ bạn
        unread = (
            db.query(func.count(Message.id))
            .filter(
                Message.sender_id == fid,
                Message.receiver_id == uid,
                Message.read_at.is_(None),
            )
            .scalar()
        )

        friend = db.query(User).filter(User.id == fid).first()
        if friend is None:
            continue

        conversations.append(
            ConversationOut(
                friend=UserOut.model_validate(friend),
                last_message=MessageOut.model_validate(last_msg),
                unread_count=unread or 0,
            )
        )

    # Sắp xếp theo tin nhắn mới nhất
    conversations.sort(
        key=lambda c: c.last_message.created_at if c.last_message else datetime.min,
        reverse=True,
    )
    return conversations


# ── Lịch sử tin nhắn với một bạn ─────────────────────────

@router.get("/{user_id}", response_model=list[MessageOut])
def get_messages(
    user_id: int,
    db: DB,
    current_user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Lấy lịch sử tin nhắn với một người bạn (phân trang)."""
    uid = current_user.id

    if user_id == uid:
        raise HTTPException(status_code=400, detail="Không thể nhắn tin cho chính mình.")

    if not _are_friends(db, uid, user_id):
        raise HTTPException(status_code=403, detail="Chỉ có thể nhắn tin với bạn bè.")

    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == uid, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == uid),
            )
        )
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Tự động đánh dấu đã đọc các tin nhận được
    unread_ids = [
        m.id for m in messages
        if m.receiver_id == uid and m.read_at is None
    ]
    if unread_ids:
        db.query(Message).filter(Message.id.in_(unread_ids)).update(
            {"read_at": datetime.now(timezone.utc)}, synchronize_session="fetch"
        )
        db.commit()

    # Trả về theo thứ tự cũ → mới
    messages.reverse()
    return messages


# ── Gửi tin nhắn ─────────────────────────────────────────

@router.post("/{user_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    user_id: int,
    payload: MessageCreate,
    db: DB,
    current_user: CurrentUser,
):
    """Gửi tin nhắn cho một người bạn."""
    uid = current_user.id

    if user_id == uid:
        raise HTTPException(status_code=400, detail="Không thể nhắn tin cho chính mình.")

    if not _are_friends(db, uid, user_id):
        raise HTTPException(status_code=403, detail="Chỉ có thể nhắn tin với bạn bè.")

    # Kiểm tra người nhận tồn tại
    receiver = db.query(User).filter(User.id == user_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    msg = Message(
        sender_id=uid,
        receiver_id=user_id,
        content=payload.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ── Đánh dấu đã đọc ─────────────────────────────────────

@router.patch("/{message_id}/read", response_model=MessageOut)
def mark_as_read(message_id: int, db: DB, current_user: CurrentUser):
    """Đánh dấu tin nhắn đã đọc (chỉ người nhận mới được)."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Tin nhắn không tồn tại.")

    if msg.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Chỉ người nhận mới có thể đánh dấu đã đọc.")

    if msg.read_at is None:
        msg.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(msg)

    return msg
