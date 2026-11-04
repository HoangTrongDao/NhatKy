
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.friend import FriendRequest, Friendship
from app.security import get_current_user


router = APIRouter(prefix="/friends", tags=["friends"])


# =========================
# SCHEMAS
# =========================

class FriendUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str
    bio: str
    created_at: datetime


class FriendRequestOut(BaseModel):
    id: int
    status: str
    created_at: datetime
    sender: FriendUserOut
    receiver: FriendUserOut


class FriendActionOut(BaseModel):
    detail: str


# =========================
# DANH SÁCH BẠN BÈ
# =========================

@router.get("", response_model=list[FriendUserOut])
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    friends = db.scalars(
        select(User)
        .join(Friendship, Friendship.friend_id == User.id)
        .where(Friendship.user_id == current_user.id)
        .order_by(User.display_name)
    ).all()

    return friends


# =========================
# LỜI MỜI NHẬN ĐƯỢC
# =========================

@router.get("/requests", response_model=list[FriendRequestOut])
def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.scalars(
        select(FriendRequest)
        .where(
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == "pending"
        )
        .order_by(FriendRequest.created_at.desc())
    ).all()

    result = []

    for request in requests:
        sender = db.get(User, request.sender_id)
        receiver = current_user

        result.append({
            "id": request.id,
            "status": request.status,
            "created_at": request.created_at,
            "sender": sender,
            "receiver": receiver
        })

    return result


# =========================
# LỜI MỜI ĐÃ GỬI
# =========================

@router.get("/sent", response_model=list[FriendRequestOut])
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    requests = db.scalars(
        select(FriendRequest)
        .where(
            FriendRequest.sender_id == current_user.id,
            FriendRequest.status == "pending"
        )
        .order_by(FriendRequest.created_at.desc())
    ).all()

    result = []

    for request in requests:
        sender = current_user
        receiver = db.get(User, request.receiver_id)

        result.append({
            "id": request.id,
            "status": request.status,
            "created_at": request.created_at,
            "sender": sender,
            "receiver": receiver
        })

    return result


# =========================
# GỢI Ý NGƯỜI DÙNG
# =========================

@router.get("/suggestions", response_model=list[FriendUserOut])
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lấy các ID đã có quan hệ bạn bè
    friend_ids = select(Friendship.friend_id).where(
        Friendship.user_id == current_user.id
    )

    # Lấy các ID đang có lời mời ở cả hai chiều
    pending_ids = select(FriendRequest.receiver_id).where(
        and_(
            FriendRequest.sender_id == current_user.id,
            FriendRequest.status == "pending"
        )
    ).union(
        select(FriendRequest.sender_id).where(
            and_(
                FriendRequest.receiver_id == current_user.id,
                FriendRequest.status == "pending"
            )
        )
    )

    suggestions = db.scalars(
        select(User)
        .where(
            User.id != current_user.id,
            User.id.not_in(friend_ids),
            User.id.not_in(pending_ids)
        )
        .order_by(User.created_at.desc())
        .limit(20)
    ).all()

    return suggestions


# =========================
# GỬI LỜI MỜI KẾT BẠN
# =========================

@router.post(
    "/requests/{user_id}",
    response_model=FriendActionOut,
    status_code=status.HTTP_201_CREATED
)
def send_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Bạn không thể tự kết bạn với chính mình."
        )

    receiver = db.get(User, user_id)

    if not receiver:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng."
        )

    # Kiểm tra đã là bạn bè chưa
    friendship = db.scalar(
        select(Friendship).where(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == user_id
        )
    )

    if friendship:
        raise HTTPException(
            status_code=409,
            detail="Hai người đã là bạn bè."
        )

    # Kiểm tra lời mời đang tồn tại ở cả hai chiều
    existing_request = db.scalar(
        select(FriendRequest).where(
            FriendRequest.status == "pending",
            or_(
                and_(
                    FriendRequest.sender_id == current_user.id,
                    FriendRequest.receiver_id == user_id
                ),
                and_(
                    FriendRequest.sender_id == user_id,
                    FriendRequest.receiver_id == current_user.id
                )
            )
        )
    )

    if existing_request:
        if existing_request.sender_id == user_id:
            raise HTTPException(
                status_code=409,
                detail="Người này đã gửi lời mời kết bạn cho bạn. Hãy kiểm tra lời mời nhận được."
            )

        raise HTTPException(
            status_code=409,
            detail="Bạn đã gửi lời mời cho người này rồi."
        )

    request = FriendRequest(
        sender_id=current_user.id,
        receiver_id=user_id,
        status="pending"
    )

    db.add(request)
    db.commit()

    return {"detail": "Đã gửi lời mời kết bạn."}


# =========================
# CHẤP NHẬN LỜI MỜI
# =========================

@router.post(
    "/requests/{request_id}/accept",
    response_model=FriendActionOut
)
def accept_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request = db.get(FriendRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lời mời kết bạn."
        )

    # Chỉ người nhận mới có quyền chấp nhận
    if request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền chấp nhận lời mời này."
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Lời mời này không còn ở trạng thái chờ."
        )

    # Tạo quan hệ hai chiều
    db.add_all([
        Friendship(
            user_id=request.sender_id,
            friend_id=request.receiver_id
        ),
        Friendship(
            user_id=request.receiver_id,
            friend_id=request.sender_id
        )
    ])

    request.status = "accepted"

    db.commit()

    return {"detail": "Hai người đã trở thành bạn bè."}


# =========================
# TỪ CHỐI HOẶC HỦY LỜI MỜI
# =========================

@router.delete(
    "/requests/{request_id}",
    response_model=FriendActionOut
)
def reject_or_cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request = db.get(FriendRequest, request_id)

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lời mời kết bạn."
        )

    if current_user.id not in (
        request.sender_id,
        request.receiver_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền xử lý lời mời này."
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="Lời mời này không còn ở trạng thái chờ."
        )

    # Người nhận từ chối; người gửi hủy lời mời
    if current_user.id == request.receiver_id:
        request.status = "rejected"
        message = "Đã từ chối lời mời kết bạn."
    else:
        db.delete(request)
        message = "Đã hủy lời mời kết bạn."

    db.commit()

    return {"detail": message}


# =========================
# HỦY KẾT BẠN
# =========================

@router.delete(
    "/{user_id}",
    response_model=FriendActionOut
)
def remove_friend(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Thao tác không hợp lệ."
        )

    friendship = db.scalars(
        select(Friendship).where(
            or_(
                and_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == user_id
                ),
                and_(
                    Friendship.user_id == user_id,
                    Friendship.friend_id == current_user.id
                )
            )
        )
    ).all()

    if not friendship:
        raise HTTPException(
            status_code=404,
            detail="Hai người chưa phải bạn bè."
        )

    for relation in friendship:
        db.delete(relation)

    db.commit()

    return {"detail": "Đã hủy kết bạn."}
