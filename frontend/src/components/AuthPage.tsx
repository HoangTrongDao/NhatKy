import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sunrise, LockKeyhole } from 'lucide-react'
import { api, setToken, User } from '../api'
import { useToast } from './Toast'

interface Props {
  mode: 'login' | 'register'
  onUser: (user: User) => void
}

export default function AuthPage({ mode, onUser }: Props) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToast()

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const data = new FormData(e.currentTarget)
    try {
      if (mode === 'register') {
        await api<User>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: data.get('email'),
            password: data.get('password'),
            display_name: data.get('display_name'),
          }),
        })
      }
      const body = new URLSearchParams({
        username: String(data.get('email')),
        password: String(data.get('password')),
      })
      const token = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setToken(token.access_token)
      const me = await api<User>('/auth/me')
      onUser(me)
      addToast(mode === 'login' ? 'Chào mừng bạn trở lại!' : 'Tài khoản đã được tạo thành công!', 'success')
      navigate('/memories')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-symbol"><Sunrise /></div>
        <span className="eyebrow">
          {mode === 'login' ? 'CHÀO MỪNG BẠN TRỞ LẠI' : 'BẮT ĐẦU MỘT HÀNH TRÌNH MỚI'}
        </span>
        <h1>{mode === 'login' ? 'Thật vui khi gặp lại bạn.' : 'Một khởi đầu cho riêng bạn.'}</h1>
        <p className="muted">Đây là không gian của bạn. Hãy mang vào những điều bạn sẵn lòng giữ lại.</p>
        <form onSubmit={submit} className="form-stack">
          {mode === 'register' && (
            <label>
              Tên hiển thị
              <input name="display_name" required minLength={1} maxLength={80} placeholder="Tên bạn muốn mọi người gọi" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required placeholder="ban@example.com" />
          </label>
          <label>
            Mật khẩu
            <input name="password" type="password" minLength={8} maxLength={128} required placeholder="Ít nhất 8 ký tự" />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button primary full" disabled={busy}>
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập →' : 'Tạo tài khoản →'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
          </Link>
        </p>
        <p className="privacy-hint"><LockKeyhole size={14} /> Ký ức và ghi chép riêng tư chỉ dành cho bạn.</p>
      </div>
    </div>
  )
}
