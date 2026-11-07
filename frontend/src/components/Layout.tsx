import { useState, useEffect, ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LogIn, LogOut, Menu, Moon, Sun, Sunrise,
  User as UserIcon, MessageSquare, X,
  BookHeart, Leaf, Target, Users, Sparkles, Camera
} from 'lucide-react'
import { fetchUnreadCount, setToken, User } from '../api'

interface LayoutProps {
  user: User | null
  setUser: (u: User | null) => void
  children: ReactNode
}

function getTheme(): 'light' | 'dark' {
  return (localStorage.getItem('nb_theme') as 'light' | 'dark') || 'light'
}

export default function Layout({ user, setUser, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nb_theme', theme)
  }, [theme])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const checkUnread = async () => {
      try {
        const res = await fetchUnreadCount()
        setUnreadCount(res.unread_count || 0)
      } catch {
        // ignore
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 15000)
    return () => clearInterval(interval)
  }, [user])

  function signOut() {
    setToken(null)
    setUser(null)
    navigate('/')
  }

  function toggleTheme() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          {/* ── Brand Logo ── */}
          <Link className="brand" to="/">
            <span className="brand-mark">
              <Sunrise size={22} />
            </span>
            <div className="brand-text">
              <span className="brand-title">NHẬT KÝ</span>
              <span className="brand-badge">NEW BEGINNING</span>
            </div>
          </Link>

          {/* ── Floating Island Navigation ── */}
          <nav className={mobileOpen ? 'nav-island open' : 'nav-island'}>
            <NavLink to="/memories" className="nav-item" onClick={() => setMobileOpen(false)}>
              <BookHeart size={15} />
              <span>Ký ức</span>
            </NavLink>
            <NavLink to="/locket" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Camera size={15} />
              <span>Locket</span>
            </NavLink>
            <NavLink to="/reflections" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Leaf size={15} />
              <span>Nhìn lại</span>
            </NavLink>
            <NavLink to="/goals" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Target size={15} />
              <span>Ngày mai</span>
            </NavLink>
            <NavLink to="/friends" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Users size={15} />
              <span>Bạn bè</span>
            </NavLink>
            {user && (
              <NavLink to="/messages" className="nav-item nav-msg" onClick={() => setMobileOpen(false)}>
                <MessageSquare size={15} />
                <span>Tin nhắn</span>
                {unreadCount > 0 && (
                  <span className="nav-badge-count">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
            <NavLink to="/community" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Sparkles size={15} />
              <span>Cộng đồng</span>
            </NavLink>

            {/* Mobile-only profile & logout inside drawer */}
            <div className="mobile-user-drawer">
              {user ? (
                <>
                  <NavLink to="/profile" className="mobile-profile-link" onClick={() => setMobileOpen(false)}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <UserIcon size={16} />
                    )}
                    <span>Không gian riêng ({user.display_name})</span>
                  </NavLink>
                  <button className="mobile-logout-btn" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link className="mobile-login-btn" to="/login" onClick={() => setMobileOpen(false)}>
                  <LogIn size={16} /> Đăng nhập / Bắt đầu
                </Link>
              )}
            </div>
          </nav>

          {/* ── Topbar Actions (Desktop) ── */}
          <div className="topbar-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Đổi giao diện" title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <div className="user-action-group">
                <Link to="/profile" className="user-pill" title="Xem hồ sơ">
                  <span className="user-pill-avatar">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="user-pill-avatar-img"
                        style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                      />
                    ) : (
                      user.display_name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="user-pill-name">{user.display_name}</span>
                </Link>
                <button className="logout-icon-btn" onClick={signOut} title="Đăng xuất">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link className="login-pill-btn" to="/login">
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </Link>
            )}

            <button className="mobile-menu-trigger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-brand">
          <Sunrise size={18} />
          <strong>NHẬT KÝ CỦA TÔI</strong>
        </div>
        <span>Giữ điều đẹp đẽ • Học từ quá khứ • Cùng xây dựng ngày mai</span>
      </footer>
    </div>
  )
}
