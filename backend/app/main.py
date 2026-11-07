from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, inspect
from app.core.config import settings
from app.db.session import Base, engine
from app import models  # noqa: F401 — registers SQLAlchemy models
from app.api.v1 import (
    auth,
    memories,
    reflections,
    goals,
    community,
    profile,
    stats,
    friends,
    messages,
    lockets,
)

# 1. Khởi tạo Base Metadata cho Database trước
Base.metadata.create_all(bind=engine)

# Đảm bảo các cột mở rộng tồn tại an toàn trên mọi loại database (SQLite, PostgreSQL, etc.)
try:
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if "users" in existing_tables:
        user_cols = [col["name"] for col in inspector.get_columns("users")]
        if "avatar_url" not in user_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"))

    if "memories" in existing_tables:
        memory_cols = [col["name"] for col in inspector.get_columns("memories")]
        if "image_url" not in memory_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE memories ADD COLUMN image_url TEXT DEFAULT NULL"))

    if "reflections" in existing_tables:
        ref_cols = [col["name"] for col in inspector.get_columns("reflections")]
        if "image_url" not in ref_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE reflections ADD COLUMN image_url TEXT DEFAULT NULL"))

    if "goals" in existing_tables:
        goal_cols = [col["name"] for col in inspector.get_columns("goals")]
        if "image_url" not in goal_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE goals ADD COLUMN image_url TEXT DEFAULT NULL"))
except Exception as migration_err:
    print(f"[Migration Notice] {migration_err}")

# 2. Khởi tạo FastAPI duy nhất 1 lần với thông tin đầy đủ
app = FastAPI(
    title="New Beginning API",
    description="API cho cộng đồng lưu giữ điều tốt đẹp và xây dựng tương lai.",
    version="0.2.0",
)

# Cấu hình CORS toàn diện, hỗ trợ mọi port localhost (5173, 5174, 3000, 4173) và mọi domain Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Đăng ký các Router định tuyến API
api = "/api/v1"
app.include_router(auth.router, prefix=api)
app.include_router(memories.router, prefix=api)
app.include_router(reflections.router, prefix=api)
app.include_router(goals.router, prefix=api)
app.include_router(community.router, prefix=api)
app.include_router(profile.router, prefix=api)
app.include_router(stats.router, prefix=api)
app.include_router(friends.router, prefix=api)
app.include_router(messages.router, prefix=api)
app.include_router(lockets.router, prefix=api)

@app.get("/")
def root():
    return {"name": "New Beginning API", "docs": "/docs", "status": "running"}

@app.get(f"{api}/health", tags=["health"])
def health():
    return {"status": "ok"}
