# Thiết kế dữ liệu (bản đầu)

- `users`: tài khoản và thông tin hiển thị.
- `memories`: kỷ niệm; `visibility` là `private` hoặc `public`.
- `reflections`: ghi chép riêng để nhìn lại tình huống và bài học.
- `goals`: mục tiêu tương lai cá nhân.

Các bảng có `user_id` làm chủ sở hữu. API kiểm tra quyền sở hữu trước khi trả về hoặc thay đổi dữ liệu. Với sản phẩm cộng đồng thực tế, cần bổ sung migrations, index, chính sách lưu trữ/xóa dữ liệu và kiểm thử phân quyền chuyên sâu.
