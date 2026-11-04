import { Link } from 'react-router-dom'
import { Sunrise, LockKeyhole, ArrowLeft, ShieldCheck } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-symbol">
          <Sunrise />
        </div>

        <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>

        <h1>Không sao cả.</h1>

        <p className="muted">
          Ai cũng có lúc quên mật khẩu. Hãy cùng tìm cách
          lấy lại quyền truy cập không gian của bạn nhé.
        </p>

        <div className="forgot-password-content">
          <div className="forgot-password-icon">
            <LockKeyhole size={22} />
          </div>

          <div>
            <strong>Bạn vẫn đăng nhập được?</strong>
            <p>
              Hãy vào Trang cá nhân, chọn Đổi mật khẩu,
              nhập mật khẩu hiện tại và thiết lập mật khẩu mới.
            </p>
          </div>
        </div>

        <div className="forgot-password-content">
          <div className="forgot-password-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>Bạn không thể đăng nhập?</strong>
            <p>
              Hiện tại hệ thống chưa hỗ trợ tự đặt lại mật khẩu
              qua email. Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        </div>

        <Link className="button primary full" to="/login">
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>

        <p className="privacy-hint">
          <LockKeyhole size={14} />
          Bảo vệ tài khoản và những điều riêng tư của bạn.
        </p>
      </div>
    </div>
  )
}