
import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Sunrise, LockKeyhole, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { forgotPassword } from '../api'
import { useToast } from './Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  const { addToast } = useToast()

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Vui lòng nhập email tài khoản.')
      return
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setBusy(true)

    try {
      await forgotPassword({
        email: email.trim(),
        new_password: newPassword,
      })

      setSuccess(true)
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')

      addToast('Mật khẩu đã được đặt lại thành công!', 'success')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-symbol">
            <CheckCircle2 />
          </div>

          <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>

          <h1>Mật khẩu đã được đổi!</h1>

          <p className="muted">
            Mật khẩu mới của bạn đã được cập nhật.
            Bây giờ bạn có thể đăng nhập lại bằng mật khẩu mới.
          </p>

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

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-symbol">
          <Sunrise />
        </div>

        <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>

        <h1>Đặt lại mật khẩu.</h1>

        <p className="muted">
          Hãy tạo một mật khẩu mới để tiếp tục hành trình
          lưu giữ những điều ý nghĩa của bạn.
        </p>

        <form onSubmit={submit} className="form-stack">
          <label>
            Email tài khoản
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ban@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Mật khẩu mới
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
            />
          </label>

          <label>
            Xác nhận mật khẩu mới
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="button primary full"
            disabled={busy}
          >
            <LockKeyhole size={16} />
            {busy ? 'Đang cập nhật…' : 'Đổi mật khẩu →'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">
            <ArrowLeft size={14} />
            Quay lại đăng nhập
          </Link>
        </p>

        <p className="privacy-hint">
          <LockKeyhole size={14} />
          Bảo vệ tài khoản và những điều riêng tư của bạn.
        </p>
      </div>
    </div>
  )
}
