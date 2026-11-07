from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=80)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    display_name: str
    bio: str | None = ""
    avatar_url: str | None = ""
    created_at: datetime

class UserPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    display_name: str
    bio: str | None = ""
    avatar_url: str | None = ""
    created_at: datetime

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = None

class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    
class ForgotPasswordIn(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=128)

class MemoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=1, max_length=10000)
    image_url: str | None = None
    occurred_at: date | None = None
    visibility: Literal["private", "public"] = "private"

class MemoryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    content: str | None = Field(default=None, min_length=1, max_length=10000)
    image_url: str | None = None
    occurred_at: date | None = None
    visibility: Literal["private", "public"] | None = None

class MemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    content: str
    image_url: str | None = None
    occurred_at: date | None = None
    visibility: str
    created_at: datetime
    updated_at: datetime | None = None
    owner: UserPublicOut | None = None

class ReflectionCreate(BaseModel):
    situation: str = Field(min_length=1, max_length=160)
    feelings: str = Field(default="", max_length=10000)
    lesson: str = Field(default="", max_length=10000)
    closure_note: str = Field(default="", max_length=10000)
    image_url: str | None = None

class ReflectionUpdate(BaseModel):
    situation: str | None = Field(default=None, min_length=1, max_length=160)
    feelings: str | None = Field(default=None, max_length=10000)
    lesson: str | None = Field(default=None, max_length=10000)
    closure_note: str | None = Field(default=None, max_length=10000)
    image_url: str | None = None

class ReflectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    situation: str
    feelings: str
    lesson: str
    closure_note: str
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=10000)
    image_url: str | None = None
    target_date: date | None = None
    status: Literal["planned", "in_progress", "completed"] = "planned"

class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=10000)
    image_url: str | None = None
    target_date: date | None = None
    status: Literal["planned", "in_progress", "completed"] | None = None

class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    description: str
    image_url: str | None = None
    target_date: date | None
    status: str
    created_at: datetime
    updated_at: datetime | None = None

class DashboardStatsOut(BaseModel):
    total_memories: int
    total_reflections: int
    total_goals: int
    goals_completed: int
    goals_in_progress: int
    recent_memory_title: str | None
    days_since_joined: int


# ── Messages ──────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    read_at: datetime | None = None


class ConversationOut(BaseModel):
    friend: UserPublicOut
    last_message: MessageOut | None = None
    unread_count: int = 0


# ── Lockets ───────────────────────────────────────────────

class LocketCreate(BaseModel):
    image_url: str = Field(min_length=1)
    caption: str = Field(default="", max_length=255)
    visibility: Literal["friends", "public", "private"] = "friends"


class LocketReact(BaseModel):
    emoji: str = Field(min_length=1, max_length=10)


class LocketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    image_url: str
    caption: str = ""
    visibility: str = "friends"
    reactions: dict[str, list[int]] = Field(default_factory=dict)
    created_at: datetime
    owner: UserPublicOut | None = None
