# Kiến trúc New Beginning

## Nguyên tắc
1. Tách frontend, backend, database thành các phần độc lập.
2. Quyền riêng tư mặc định: ký ức mới tạo là `private`.
3. Chỉ nội dung có `visibility=public` mới xuất hiện trong bảng tin cộng đồng.
4. Chủ sở hữu mới được xem/sửa/xóa ký ức, suy ngẫm và mục tiêu riêng.
5. Không có tự động gửi lời nhắn tới người khác.

## Luồng request
Browser (React) → REST API (FastAPI) → SQLAlchemy → SQLite/PostgreSQL.

## Mở rộng kế tiếp
- Xác minh email và quy trình khôi phục tài khoản.
- Upload ảnh vào object storage, không lưu file nhị phân trong DB.
- Báo cáo nội dung, kiểm duyệt, rate limiting và audit log.
- Cơ chế chặn người dùng, quyền riêng tư bài viết và trang hồ sơ công khai.
- Alembic migrations thay cho `create_all` trong giai đoạn phát triển.
