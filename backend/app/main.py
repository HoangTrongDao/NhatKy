from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app import models  # noqa: F401 — registers SQLAlchemy models
from sqlalchemy import text
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
)

# 1. Khởi tạo Base Metadata cho Database trước
Base.metadata.create_all(bind=engine)

# Đảm bảo trường avatar_url tồn tại nếu database đã có sẵn từ trước
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"))
        conn.commit()
    except Exception:
        pass

# 2. Khởi tạo FastAPI duy nhất 1 lần với thông tin đầy đủ
app = FastAPI(
    title="New Beginning API",
    description="API cho cộng đồng lưu giữ điều tốt đẹp và xây dựng tương lai.",
    version="0.2.0",
)



# Cấu hình CORS chuẩn xác nhận diện đúng mọi cấu trúc domain Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://vercel.app"  # Điền trực tiếp domain chính này của bạn vào để an toàn 100%
    ],
    allow_origin_regex=r"https://.*vercel\.app",  # Bỏ dấu chấm trước chữ vercel để nhận diện mọi định dạng link vercel
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

@app.get("/")
def root():
    return {"name": "New Beginning API", "docs": "/docs", "status": "running"}

@app.get(f"{api}/health", tags=["health"])
def health():
    return {"status": "ok"}
