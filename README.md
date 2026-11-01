# New Beginning — Full Stack Starter

Một bộ khung độc lập cho nền tảng cộng đồng lưu giữ ký ức đẹp, suy ngẫm và xây dựng tương lai.
Bộ khung này **không sửa hoặc phụ thuộc vào dự án Python hiện có**.

## Công nghệ
- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI + SQLAlchemy
- Database: PostgreSQL (Docker Compose) hoặc SQLite mặc định để chạy nhanh
- Kiểm thử backend: pytest

## Chạy nhanh (không cần Docker)
Yêu cầu: Python 3.11+ và Node.js 20+.

### 1. Backend
Windows PowerShell:
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```
Nếu PowerShell chặn activate, dùng `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` và `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload`.

macOS/Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000  
Swagger API: http://127.0.0.1:8000/docs  
Mặc định SQLite được tạo tại `backend/new_beginning.db`.

### 2. Frontend (terminal mới)
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Chạy PostgreSQL bằng Docker (tùy chọn)
Từ thư mục gốc:
```bash
docker compose up --build
```
Sau đó đặt `DATABASE_URL=postgresql+psycopg://newbeginning:newbeginning_dev_password@localhost:5432/newbeginning` trong `backend/.env` nếu chạy backend ngoài Docker. Nếu chạy toàn bộ bằng Docker Compose, cấu hình đã được truyền sẵn cho backend.
Lưu ý: mật khẩu trong compose chỉ dành cho phát triển local, hãy thay trước khi triển khai thật.

## Những gì đã có
- API health check.
- Tạo tài khoản, đăng nhập và JWT bearer token.
- API đọc/cập nhật hồ sơ cơ bản.
- CRUD ký ức; ký ức mặc định là riêng tư.
- CRUD bài suy ngẫm cá nhân.
- CRUD mục tiêu tương lai.
- Bảng tin cộng đồng chỉ hiển thị bài ký ức được chủ sở hữu đặt `visibility=public`.
- Phân trang cơ bản cho bảng tin.
- Frontend tiếng Việt có các trang tổng quan, ký ức, suy ngẫm, mục tiêu và cộng đồng.
- Kiểm tra quyền sở hữu trước khi sửa/xóa dữ liệu riêng tư.

## API chính
- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login` (OAuth2 form: `username` là email, `password` là mật khẩu)
- `GET /api/v1/auth/me`
- `GET/POST /api/v1/memories`
- `GET/PATCH/DELETE /api/v1/memories/{memory_id}`
- `GET/POST /api/v1/reflections`
- `PATCH/DELETE /api/v1/reflections/{reflection_id}`
- `GET/POST /api/v1/goals`
- `PATCH/DELETE /api/v1/goals/{goal_id}`
- `GET /api/v1/community/feed`

## Giới hạn có chủ đích của starter
- Đây là bộ khung chạy thử, chưa phải hệ thống đã được kiểm toán bảo mật.
- Chưa có xác minh email, quên mật khẩu, upload ảnh, kiểm duyệt nội dung, báo cáo vi phạm, thông báo, nhắn tin, rate limiting hoặc quy trình xóa tài khoản hoàn chỉnh.
- JWT secret phải được đổi bằng giá trị ngẫu nhiên mạnh trước khi dùng thật.
- Bảng tin cộng đồng chỉ công khai nội dung người dùng chủ động đặt là public. Không có tính năng chia sẻ nhật ký suy ngẫm hoặc dữ liệu riêng tư.
- Không tự động gửi lời nhắn hay lời xin lỗi thay người dùng.

## Cấu trúc
```text
new-beginning/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
└── README.md
```
