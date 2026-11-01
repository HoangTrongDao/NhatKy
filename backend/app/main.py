from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app import models  # noqa: F401 — registers SQLAlchemy models
from app.api.v1 import auth, memories, reflections, goals, community, profile, stats
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Thêm đoạn này để cấp "giấy thông hành" cho Vercel gọi vào Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn mạng, bao gồm Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="New Beginning API",
    description="API cho cộng đồng lưu giữ điều tốt đẹp và xây dựng tương lai.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = "/api/v1"
app.include_router(auth.router, prefix=api)
app.include_router(memories.router, prefix=api)
app.include_router(reflections.router, prefix=api)
app.include_router(goals.router, prefix=api)
app.include_router(community.router, prefix=api)
app.include_router(profile.router, prefix=api)
app.include_router(stats.router, prefix=api)

@app.get("/")
def root():
    return {"name": "New Beginning API", "docs": "/docs", "status": "running"}

@app.get(f"{api}/health", tags=["health"])
def health():
    return {"status": "ok"}
