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
    bio: str = ""
    created_at: datetime

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    bio: str | None = Field(default=None, max_length=500)

class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    
class ForgotPasswordIn(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=128)

class MemoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=1, max_length=10000)
    occurred_at: date | None = None
    visibility: Literal["private", "public"] = "private"

class MemoryUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    content: str | None = Field(default=None, min_length=1, max_length=10000)
    occurred_at: date | None = None
    visibility: Literal["private", "public"] | None = None

class MemoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    content: str
    occurred_at: date | None
    visibility: str
    created_at: datetime
    updated_at: datetime | None = None
    owner: UserOut | None = None

class ReflectionCreate(BaseModel):
    situation: str = Field(min_length=1, max_length=160)
    feelings: str = Field(default="", max_length=10000)
    lesson: str = Field(default="", max_length=10000)
    closure_note: str = Field(default="", max_length=10000)

class ReflectionUpdate(BaseModel):
    situation: str | None = Field(default=None, min_length=1, max_length=160)
    feelings: str | None = Field(default=None, max_length=10000)
    lesson: str | None = Field(default=None, max_length=10000)
    closure_note: str | None = Field(default=None, max_length=10000)

class ReflectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    situation: str
    feelings: str
    lesson: str
    closure_note: str
    created_at: datetime
    updated_at: datetime | None = None

class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=10000)
    target_date: date | None = None
    status: Literal["planned", "in_progress", "completed"] = "planned"

class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=10000)
    target_date: date | None = None
    status: Literal["planned", "in_progress", "completed"] | None = None

class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    description: str
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
