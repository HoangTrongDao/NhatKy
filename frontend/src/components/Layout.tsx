import { useState, useEffect, useRef, ReactNode } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LogIn, LogOut, Menu,
  User as UserIcon, MessageSquare, X,
  BookHeart, Leaf, Target, Users, Sparkles, Camera
} from 'lucide-react'
import { fetchConversations, fetchUnreadCount, setToken, User } from '../api'
import { triggerMessageNotification } from '../utils/notifications'

interface LayoutProps {
  user: User | null
  setUser: (u: User | null) => void
  children: ReactNode
}

// Permanently lock theme to 'light'
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'light')
}

export default function Layout({ user, setUser, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  const lastKnownMessageIds = useRef<Record<number, number>>({})
  const isInitialPoll = useRef(true)
  const isMessagesPage = location.pathname.startsWith('/messages')

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('nb_theme', 'light')
  }, [])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      lastKnownMessageIds.current = {}
      isInitialPoll.current = true
      return
    }

    const checkMessages = async () => {
      try {
        const convs = await fetchConversations()
        let totalUnread = 0

        for (const conv of convs) {
          totalUnread += conv.unread_count || 0
          const lastMsg = conv.last_message
          if (!lastMsg) continue

          const friendId = conv.friend.id
          const prevId = lastKnownMessageIds.current[friendId]

          // Nhận diện tin nhắn mới trong hội thoại này
          if (prevId === undefined || lastMsg.id > prevId) {
            lastKnownMessageIds.current[friendId] = lastMsg.id

            // Nếu không phải lần tải đầu và tin nhắn do người khác gửi tới (incoming message)
            if (!isInitialPoll.current && lastMsg.sender_id === friendId) {
              const currentLoc = locationRef.current
              const isCurrentlyChatting =
                currentLoc.pathname === '/messages' &&
                new URLSearchParams(currentLoc.search).get('user') === String(friendId) &&
                document.visibilityState === 'visible'

              // Nếu không phải đang mở xem trực tiếp cuộc trò chuyện trên màn hình, phát chuông & thông báo đẩy
              if (!isCurrentlyChatting) {
                triggerMessageNotification({
                  title: `Tin nhắn mới từ ${conv.friend.display_name}`,
                  body: lastMsg.content || 'Bạn có một tin nhắn mới',
                  icon: conv.friend.avatar_url || '/pwa-192x192.png',
                  url: `/messages?user=${friendId}`,
                  tag: `chat-${friendId}`,
                })
              }
            }
          }
        }

        setUnreadCount(totalUnread)
        isInitialPoll.current = false
      } catch {
        // Dự phòng: cập nhật unread count nếu fetchConversations gặp trục trặc
        try {
          const res = await fetchUnreadCount()
          setUnreadCount(res.unread_count || 0)
        } catch {
          // ignore
        }
      }
    }

    checkMessages()
    // Background polling mỗi 5 giây cho tin nhắn và thông báo thời gian thực
    const interval = setInterval(checkMessages, 5000)

    // Lắng nghe sự kiện cập nhật tin nhắn khi người dùng đọc hoặc gửi tin ở MessagesPage
    const handleMessagesUpdated = () => {
      checkMessages()
    }
    window.addEventListener('nb_messages_updated', handleMessagesUpdated)

    return () => {
      clearInterval(interval)
      window.removeEventListener('nb_messages_updated', handleMessagesUpdated)
    }
  }, [user])

  function signOut() {
    setToken(null)
    setUser(null)
    navigate('/')
  }

  return (
    <div className="app-shell" style={{ width: '100%', maxWidth: '100%', minHeight: '100vh' }}>
      <header className="topbar">
        <div className="topbar-inner" style={{ maxWidth: '100%', width: '100%', padding: '0 clamp(16px, 3vw, 40px)' }}>
          {/* ── Left Zone (Bên tay trái): Logo + Personal Nav ── */}
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
            <Link className="brand" to="/">
              <span className="brand-mark brand-mark-embossed">
                <img src="/trongdao.png.png" alt="Logo" className="brand-logo-img" />
              </span>
              <div className="brand-text">
                <span className="brand-title">NHẬT KÝ CỦA TÔI</span>
                <span className="brand-badge">GIỮ ĐIỀU ĐẸP ĐẼ • HỌC TỪ QUÁ KHỨ • CÙNG XÂY DỰNG NGÀY MAI</span>
              </div>
            </Link>

            <nav className="nav-island nav-island-left nav-group-left">
              {user && (
                <>
                  <NavLink to="/memories" className="nav-item nav-item-memories">
                    <span className="nav-icon-badge"><BookHeart size={15} /></span>
                    <span>Ký ức</span>
                  </NavLink>
                  <NavLink to="/reflections" className="nav-item nav-item-reflections">
                    <span className="nav-icon-badge"><Leaf size={15} /></span>
                    <span>Nhìn lại</span>
                  </NavLink>
                  <NavLink to="/goals" className="nav-item nav-item-goals">
                    <span className="nav-icon-badge"><Target size={15} /></span>
                    <span>Ngày mai</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/community" className="nav-item nav-item-community">
                <span className="nav-icon-badge"><Sparkles size={15} /></span>
                <span>Cộng đồng</span>
              </NavLink>
            </nav>
          </div>

          {/* ── Right Zone (Bên tay phải): Social Nav + Actions ── */}
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.5vw, 18px)' }}>
            {user && (
              <nav className="nav-island nav-island-right nav-group-right">
                <NavLink to="/locket" className="nav-item nav-item-locket">
                  <span className="nav-icon-badge"><Camera size={15} /></span>
                  <span>Locket</span>
                </NavLink>
                <NavLink to="/friends" className="nav-item nav-item-friends">
                  <span className="nav-icon-badge"><Users size={15} /></span>
                  <span>Bạn bè</span>
                </NavLink>
                <NavLink to="/messages" className="nav-item nav-item-messages nav-msg">
                  <span className="nav-icon-badge"><MessageSquare size={15} /></span>
                  <span>Tin nhắn</span>
                  {unreadCount > 0 && (
                    <span className="nav-badge-count">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </nav>
            )}

            <div className="topbar-actions">
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

              <button
                className="mobile-menu-trigger"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Mở menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <div className="mobile-drawer-section">
                <span className="mobile-drawer-label">Nhật ký & Khám phá</span>
                <div className="mobile-drawer-links">
                  <NavLink to="/memories" className="nav-item nav-item-memories" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><BookHeart size={16} /></span>
                    <span>Ký ức</span>
                  </NavLink>
                  <NavLink to="/reflections" className="nav-item nav-item-reflections" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><Leaf size={16} /></span>
                    <span>Nhìn lại</span>
                  </NavLink>
                  <NavLink to="/goals" className="nav-item nav-item-goals" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><Target size={16} /></span>
                    <span>Ngày mai</span>
                  </NavLink>
                  <NavLink to="/community" className="nav-item nav-item-community" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><Sparkles size={16} /></span>
                    <span>Cộng đồng</span>
                  </NavLink>
                </div>
              </div>

              <div className="mobile-drawer-section">
                <span className="mobile-drawer-label">Kết nối & Xã hội</span>
                <div className="mobile-drawer-links">
                  <NavLink to="/locket" className="nav-item nav-item-locket" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><Camera size={16} /></span>
                    <span>Locket</span>
                  </NavLink>
                  <NavLink to="/friends" className="nav-item nav-item-friends" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><Users size={16} /></span>
                    <span>Bạn bè</span>
                  </NavLink>
                  <NavLink to="/messages" className="nav-item nav-item-messages nav-msg" onClick={() => setMobileOpen(false)}>
                    <span className="nav-icon-badge"><MessageSquare size={16} /></span>
                    <span>Tin nhắn</span>
                    {unreadCount > 0 && (
                      <span className="nav-badge-count">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                </div>
              </div>
            </>
          ) : (
            <div className="mobile-drawer-section">
              <span className="mobile-drawer-label">Khám phá</span>
              <div className="mobile-drawer-links">
                <NavLink to="/community" className="nav-item nav-item-community" onClick={() => setMobileOpen(false)}>
                  <span className="nav-icon-badge"><Sparkles size={16} /></span>
                  <span>Cộng đồng</span>
                </NavLink>
              </div>
            </div>
          )}

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
        </div>
      </header>

      <main className="main-content" style={{ width: '100%', maxWidth: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-embossed" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/trongdao.png.png" alt="Logo" className="brand-logo-img" style={{ width: '100%', height: '100%' }} />
          </span>
          <strong>NHẬT KÝ CỦA TÔI</strong>
        </div>
        <span>Giữ điều đẹp đẽ • Học từ quá khứ • Cùng xây dựng ngày mai</span>
      </footer>

      {/* ── Khối thương hiệu cố định trên thiết bị di động (nằm ngay trên thanh điều hướng dưới) ── */}
      {!isMessagesPage && (
        <div className="mobile-fixed-branding" aria-hidden="true">
          <div className="mobile-fixed-branding-inner">
            <span className="mobile-fixed-brand-mark">
              <img src="/trongdao.png.png" alt="" className="mobile-fixed-brand-img" />
            </span>
            <div className="mobile-fixed-brand-text">
              <span className="mobile-fixed-brand-title">NHẬT KÝ CỦA TÔI</span>
              <span className="mobile-fixed-brand-slogan">GIỮ ĐIỀU ĐẸP ĐẼ • HỌC TỪ QUÁ KHỨ • CÙNG XÂY DỰNG NGÀY MAI</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (Thanh điều hướng phía dưới trên điện thoại) ── */}
      <nav className="mobile-bottom-nav" aria-label="Điều hướng phía dưới trên điện thoại">
        {user ? (
          <>
            <NavLink to="/memories" className="mobile-bottom-item mobile-bottom-item-memories">
              <span className="mobile-bottom-icon-badge">
                <BookHeart size={19} />
              </span>
              <span className="mobile-bottom-label">Ký ức</span>
            </NavLink>

            <NavLink to="/reflections" className="mobile-bottom-item mobile-bottom-item-reflections">
              <span className="mobile-bottom-icon-badge">
                <Leaf size={19} />
              </span>
              <span className="mobile-bottom-label">Nhìn lại</span>
            </NavLink>

            <NavLink to="/locket" className="mobile-bottom-item mobile-bottom-item-locket mobile-bottom-fab" title="Locket - Khoảnh khắc trực tiếp">
              <span className="mobile-bottom-fab-badge">
                <Camera size={22} />
              </span>
              <span className="mobile-bottom-label">Locket</span>
            </NavLink>

            <NavLink to="/friends" className="mobile-bottom-item mobile-bottom-item-friends">
              <span className="mobile-bottom-icon-badge">
                <Users size={19} />
              </span>
              <span className="mobile-bottom-label">Bạn bè</span>
            </NavLink>

            <NavLink to="/messages" className="mobile-bottom-item mobile-bottom-item-messages">
              <span className="mobile-bottom-icon-badge">
                <MessageSquare size={19} />
                {unreadCount > 0 && (
                  <span className="mobile-bottom-badge-count">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="mobile-bottom-label">Tin nhắn</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" className="mobile-bottom-item mobile-bottom-item-home">
              <span className="mobile-bottom-icon-badge">
                <img src="/trongdao.png.png" alt="Trang chủ" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain' }} />
              </span>
              <span className="mobile-bottom-label">Trang chủ</span>
            </NavLink>

            <NavLink to="/community" className="mobile-bottom-item mobile-bottom-item-community">
              <span className="mobile-bottom-icon-badge">
                <Sparkles size={19} />
              </span>
              <span className="mobile-bottom-label">Cộng đồng</span>
            </NavLink>

            <NavLink to="/login" className="mobile-bottom-item mobile-bottom-item-login">
              <span className="mobile-bottom-icon-badge">
                <LogIn size={19} />
              </span>
              <span className="mobile-bottom-label">Đăng nhập</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  )
}
