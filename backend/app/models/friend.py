
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    receiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "sender_id != receiver_id",
            name="ck_friend_request_not_self"
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name="ck_friend_request_status"
        ),
    )


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    friend_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "friend_id",
            name="uq_friendship_pair"
        ),
        CheckConstraint(
            "user_id != friend_id",
            name="ck_friendship_not_self"
        ),
    )
