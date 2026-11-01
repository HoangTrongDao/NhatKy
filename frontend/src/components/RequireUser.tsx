import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'

export default function RequireUser({ user, children }: { user: { id: number } | null; children: ReactNode }) {
  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><LockKeyhole /></div>
        <h2>Không gian riêng của bạn</h2>
        <p>Đăng nhập để lưu giữ ký ức, viết suy ngẫm và theo dõi mục tiêu.</p>
        <Link className="button primary" to="/login">Đăng nhập</Link>
      </div>
    )
  }
  return <>{children}</>
}
