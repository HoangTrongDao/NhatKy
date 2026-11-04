import { Link } from 'react-router-dom'
import { Sunrise, LockKeyhole } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-symbol"><Sunrise /></div>

        <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>

        <h1>Bạn quên mật khẩu?</h1>

        <p className="muted">
          Để bảo vệ tài khoản và những ghi chép riêng tư,
          chức năng đổi mật khẩu yêu cầu bạn đăng nhập trước.
        </p>

        <div className="privacy-hint">
          <LockKeyhole size={16} />
          Nếu bạn vẫn đăng nhập được, hãy vào Trang cá nhân
          và chọn Đổi mật khẩu.
        </div>

        <Link className="button primary full" to="/login">
          Quay lại đăng nhập →
        </Link>

        <p className="auth-switch">
          Không thể truy cập tài khoản? Vui lòng liên hệ quản trị viên.
        </p>
      </div>
    </div>
  )
}