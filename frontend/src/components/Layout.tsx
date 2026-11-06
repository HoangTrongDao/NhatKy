import { useState, useEffect, ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Menu, Moon, Sun, Sunrise, User as UserIcon, MessageSquare, X } from 'lucide-react'
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
        <Link className="brand" to="/">
          <span className="brand-mark"><Sunrise size={21} /></span>
          <span>Nhật-Ký<small>Lưu trữ những ký ức</small></span>
        </Link>
        <div className="topbar-right">
          <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Đổi giao diện">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        <nav className={mobileOpen ? 'nav open' : 'nav'}>
          <NavLink to="/memories" onClick={() => setMobileOpen(false)}>Ký ức</NavLink>
          <NavLink to="/reflections" onClick={() => setMobileOpen(false)}>Nhìn lại</NavLink>
          <NavLink to="/goals" onClick={() => setMobileOpen(false)}>Ngày mai</NavLink>
          <NavLink to="/friends" onClick={() => setMobileOpen(false)}>Bạn bè</NavLink>
          {user && (
            <NavLink to="/messages" onClick={() => setMobileOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MessageSquare size={15} />
              <span>Tin nhắn</span>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--green, #e6677e)',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '1px 6px',
                  lineHeight: '1.2',
                  boxShadow: '0 2px 6px rgba(230, 103, 126, 0.35)'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          )}
          <NavLink to="/community" onClick={() => setMobileOpen(false)}>Cộng đồng</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className="nav-profile-link" onClick={() => setMobileOpen(false)}>
                <UserIcon size={15} /> Hồ sơ
              </NavLink>
              <button className="nav-user" onClick={signOut}><LogOut size={16} /> Đăng xuất</button>
            </>
          ) : (
            <Link className="nav-login" to="/login"><LogIn size={16} /> Đăng nhập</Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>Nhật Ký Của Tôi</span>
        <span>Giữ điều đẹp đẽ. Học từ quá khứ. Cùng xây dựng ngày mai.</span>
      </footer>
    </div>
  )
}
