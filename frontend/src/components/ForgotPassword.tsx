
import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Sunrise, LockKeyhole } from 'lucide-react'
import { useToast } from './Toast'

export default function ForgotPassword() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { addToast } = useToast()

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const data = new FormData(e.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    const confirmPassword = String(data.get('confirm_password'))
    
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (!email) {
        setError('Vui lòng nhập email.')
        return
        }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    // Giai đoạn frontend: chưa kết nối API backend.
    setBusy(true)

    try {
      // Sẽ kết nối API đổi mật khẩu ở bước backend.
      setSuccess(true)
      addToast('Thông tin đã hợp lệ. Chờ kết nối API đổi mật khẩu.', 'success')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-symbol"><Sunrise /></div>
          <h1>Thông tin đã sẵn sàng.</h1>
          <p className="muted">
            Giao diện đã kiểm tra hợp lệ. Chức năng đổi mật khẩu
            sẽ hoạt động sau khi kết nối backend.
          </p>
          <Link className="button primary full" to="/login">
            Quay lại đăng nhập →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-symbol"><Sunrise /></div>

        <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>

        <h1>Tạo mật khẩu mới.</h1>

        <p className="muted">
          Nhập email tài khoản và mật khẩu mới của bạn.
        </p>

        <form onSubmit={submit} className="form-stack">
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="ban@example.com"
            />
          </label>

          <label>
            Mật khẩu mới
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              placeholder="Ít nhất 8 ký tự"
            />
          </label>

          <label>
            Xác nhận mật khẩu mới
            <input
              name="confirm_password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              placeholder="Nhập lại mật khẩu mới"
            />
          </label>

          {error && (
            <p className="error-message" role="alert">{error}</p>
          )}

          <button className="button primary full" disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Đổi mật khẩu →'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>

        <p className="privacy-hint">
          <LockKeyhole size={14} />
          Bảo vệ tài khoản và những điều riêng tư của bạn.
        </p>
      </div>
    </div>
  )
}
