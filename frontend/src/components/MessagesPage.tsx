import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MessageCircle, Send, ArrowLeft, CheckCheck, Check, Users,
  Bell, BellOff, Sparkles, Smartphone, HelpCircle
} from 'lucide-react'
import {
  fetchConversations, fetchMessages, sendMessage, fetchFriends,
  type Conversation, type Message, type FriendUser
} from '../api'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationEnabled,
  setNotificationEnabled,
  playMessageChime,
  triggerMessageNotification,
  type NotificationPermissionStatus,
} from '../utils/notifications'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<FriendUser | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  // Notification states & mobile guidance
  const [notifSupported, setNotifSupported] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>('default')
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [showMobileBanner, setShowMobileBanner] = useState(false)
  const [showHelpTooltip, setShowHelpTooltip] = useState(false)

  const lastKnownMessagesRef = useRef<Record<number, number>>({})
  const lastConversationsRef = useRef<Record<number, number>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('nb_token')
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub ? Number(payload.sub) : null
    } catch { return null }
  })()

  // Khởi tạo và lắng nghe cài đặt thông báo
  useEffect(() => {
    const supported = isNotificationSupported()
    setNotifSupported(supported)
    if (supported) {
      setNotifPermission(getNotificationPermission())
    }
    setNotifEnabled(isNotificationEnabled())

    // Hiển thị gợi ý thông báo trên điện thoại nếu chưa từng cấp quyền hoặc đóng
    const dismissed = localStorage.getItem('nb_notif_banner_dismissed')
    if (!dismissed && supported && getNotificationPermission() !== 'granted') {
      setShowMobileBanner(true)
    }

    const handleSettingChange = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>
      if (typeof custom.detail?.enabled === 'boolean') {
        setNotifEnabled(custom.detail.enabled)
      }
    }
    window.addEventListener('nb_notification_setting_changed', handleSettingChange)
    return () => {
      window.removeEventListener('nb_notification_setting_changed', handleSettingChange)
    }
  }, [])

  const handleToggleNotification = async () => {
    if (!notifSupported) {
      alert('Trình duyệt hiện tại chưa hỗ trợ Web Notification API.')
      return
    }

    const perm = getNotificationPermission()
    if (perm === 'denied') {
      alert('Thông báo hiện đang bị chặn trong quyền trang web của trình duyệt. Bạn có thể bấm vào biểu tượng cài đặt/ổ khóa cạnh thanh địa chỉ để bật lại quyền thông báo.')
      return
    }

    if (perm !== 'granted') {
      const res = await requestNotificationPermission()
      setNotifPermission(res)
      if (res === 'granted') {
        setNotifEnabled(true)
        playMessageChime()
        triggerMessageNotification({
          title: '🔔 Thông báo tin nhắn đã bật',
          body: 'Bạn sẽ nhận được chuông và thông báo khi có tin nhắn mới từ bạn bè!',
          url: '/messages',
        })
        setShowMobileBanner(false)
        localStorage.setItem('nb_notif_banner_dismissed', 'true')
      }
      return
    }

    // Khi đã được cấp quyền: bật/tắt tùy chọn
    const next = !notifEnabled
    setNotificationEnabled(next)
    setNotifEnabled(next)
    if (next) {
      playMessageChime()
    }
  }

  // Tải danh sách hội thoại
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations()

      // Kiểm tra xem có tin nhắn mới từ bạn bè ở các cuộc hội thoại khác không
      if (Object.keys(lastConversationsRef.current).length > 0) {
        for (const conv of data) {
          if (conv.last_message && conv.last_message.sender_id !== currentUserId) {
            const prevId = lastConversationsRef.current[conv.friend.id]
            if (prevId && conv.last_message.id > prevId) {
              // Nếu bạn bè này không phải hội thoại đang mở trực tiếp
              if (conv.friend.id !== selectedUserId) {
                triggerMessageNotification({
                  title: `💬 ${conv.friend.display_name}`,
                  body: conv.last_message.content.length > 50
                    ? conv.last_message.content.slice(0, 50) + '...'
                    : conv.last_message.content,
                  url: `/messages?user=${conv.friend.id}`,
                  tag: `chat-${conv.friend.id}`,
                })
              }
            }
          }
        }
      }

      const newMap: Record<number, number> = {}
      for (const conv of data) {
        if (conv.last_message) {
          newMap[conv.friend.id] = conv.last_message.id
        }
      }
      lastConversationsRef.current = newMap

      setConversations(data)
    } catch { /* ignore */ }
  }, [currentUserId, selectedUserId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadConversations()
      setLoading(false)

      // Nếu có query param ?user=X, mở chat với người đó
      const userId = searchParams.get('user')
      if (userId) {
        selectUser(Number(userId))
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tự động refresh nhạy bén: 3 giây khi đang mở hội thoại, 6 giây khi ở danh sách
  useEffect(() => {
    const pollInterval = selectedUserId ? 3000 : 6000
    const interval = setInterval(() => {
      loadConversations()
      if (selectedUserId) {
        loadMessages(selectedUserId, false)
      }
    }, pollInterval)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, loadConversations])

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (userId: number, showLoading = true) => {
    if (showLoading) setLoadingMessages(true)
    try {
      const data = await fetchMessages(userId)

      // Phát hiện tin nhắn mới đến từ bạn bè trong phiên chat trực tiếp
      if (!showLoading && data.length > 0) {
        const lastKnownId = lastKnownMessagesRef.current[userId] || 0
        const newIncoming = data.filter(
          m => m.id > lastKnownId && m.sender_id === userId
        )
        if (newIncoming.length > 0 && lastKnownId > 0) {
          const latest = newIncoming[newIncoming.length - 1]
          const friendName = selectedUser?.display_name || 'Bạn bè'
          triggerMessageNotification({
            title: `💬 ${friendName}`,
            body: latest.content.length > 50 ? latest.content.slice(0, 50) + '...' : latest.content,
            url: `/messages?user=${userId}`,
            tag: `chat-active-${userId}`,
          })
        }
      }

      if (data.length > 0) {
        lastKnownMessagesRef.current[userId] = Math.max(...data.map(m => m.id))
      }

      setMessages(data)
    } catch { /* ignore */ }
    if (showLoading) setLoadingMessages(false)
  }

  const selectUser = async (userId: number) => {
    setSelectedUserId(userId)
    setMobileShowChat(true)

    // Tìm thông tin user từ conversations hoặc friends
    const conv = conversations.find(c => c.friend.id === userId)
    if (conv) {
      setSelectedUser(conv.friend)
    } else {
      // Có thể là bạn bè chưa nhắn tin
      try {
        const allFriends = await fetchFriends()
        const found = allFriends.find(f => f.id === userId)
        if (found) setSelectedUser(found)
      } catch { /* ignore */ }
    }

    await loadMessages(userId)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(selectedUserId, newMessage.trim())
      setMessages(prev => [...prev, msg])
      if (msg && msg.id) {
        lastKnownMessagesRef.current[selectedUserId] = Math.max(
          lastKnownMessagesRef.current[selectedUserId] || 0,
          msg.id
        )
      }
      setNewMessage('')
      loadConversations()
    } catch { /* ignore */ }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const loadFriendsForNewChat = async () => {
    try {
      const data = await fetchFriends()
      setFriends(data)
    } catch { /* ignore */ }
    setShowNewChat(true)
  }

  const startNewChat = (friend: FriendUser) => {
    setShowNewChat(false)
    setSelectedUser(friend)
    setSelectedUserId(friend.id)
    setMobileShowChat(true)
    loadMessages(friend.id)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} ngày`
    return d.toLocaleDateString('vi-VN')
  }

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const filteredConversations = conversations.filter(c =>
    c.friend.display_name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredFriends = friends.filter(f =>
    f.display_name.toLowerCase().includes(search.toLowerCase()) &&
    !conversations.some(c => c.friend.id === f.id)
  )

  return (
    <div className={`messages-page ${mobileShowChat ? 'mobile-chat' : ''}`}>
      

      {/* ── Sidebar ── */}
      <div className="msg-sidebar">
        <div className="msg-sidebar-header">
          <h2><MessageCircle size={22} /> Tin nhắn</h2>
          <div className="msg-sidebar-actions">
            <input
              className="msg-search-input"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="msg-new-btn" onClick={loadFriendsForNewChat}>
              + Mới
            </button>
          </div>
        </div>

        {/* ── Notification Toggle bar & Mobile Guidance ── */}
        <div className="msg-notif-control-bar">
          <div className="msg-notif-row">
            <button
              className={`msg-notif-toggle-pill ${
                notifPermission === 'denied'
                  ? 'status-denied'
                  : notifEnabled && notifPermission === 'granted'
                  ? 'status-enabled'
                  : 'status-disabled'
              }`}
              onClick={handleToggleNotification}
              title={
                notifPermission === 'denied'
                  ? 'Thông báo đang bị chặn trong trình duyệt. Nhấn để xem hướng dẫn mở lại.'
                  : notifEnabled && notifPermission === 'granted'
                  ? 'Đang bật chuông và thông báo. Nhấn để tạm tắt.'
                  : 'Nhấn để bật chuông và thông báo tin nhắn trên điện thoại/máy tính'
              }
            >
              <span className="msg-notif-icon-orb">
                {notifPermission === 'denied' ? (
                  <BellOff size={14} />
                ) : (
                  <Bell size={14} className={notifEnabled && notifPermission === 'granted' ? 'bell-ringing' : ''} />
                )}
              </span>
              <span className="msg-notif-label">
                {notifPermission === 'denied'
                  ? '⚠️ Bị chặn thông báo'
                  : notifEnabled && notifPermission === 'granted'
                  ? '🔔 Đã bật thông báo'
                  : '🔔 Bật thông báo trên điện thoại'}
              </span>
              <span className="msg-notif-state-chip">
                {notifPermission === 'denied'
                  ? 'Bị chặn'
                  : notifEnabled && notifPermission === 'granted'
                  ? 'Đang bật'
                  : 'Chưa bật'}
              </span>
            </button>

            <button
              className={`msg-notif-help-btn ${showHelpTooltip ? 'active' : ''}`}
              onClick={() => {
                setShowHelpTooltip(!showHelpTooltip)
                setShowMobileBanner(true)
              }}
              title="Hướng dẫn thông báo trên điện thoại"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          {/* Banner hướng dẫn nhận thông báo trên app điện thoại */}
          {showMobileBanner && (
            <div className="msg-mobile-guidance-card">
              <div className="msg-guidance-body">
                <div className="msg-guidance-icon-badge">
                  <Smartphone size={16} />
                </div>
                <div className="msg-guidance-text">
                  <div className="msg-guidance-heading">
                    <span>Nhận thông báo trên điện thoại</span>
                    <span className="msg-guidance-subtag">PWA / Web</span>
                  </div>
                  <p className="msg-guidance-desc">
                    Để nhận chuông báo và pop-up tin nhắn tức thì từ bạn bè như ứng dụng chat:
                  </p>
                  <ul className="msg-guidance-steps">
                    <li>Bấm nút <strong>"Bật thông báo"</strong> và chọn <em>Cho phép (Allow)</em>.</li>
                    <li>Thêm ứng dụng vào <strong>Màn hình chính (Add to Home Screen)</strong> để nhận thông báo nền cả khi khóa màn hình.</li>
                  </ul>
                </div>
                <button
                  className="msg-guidance-dismiss-btn"
                  onClick={() => {
                    setShowMobileBanner(false)
                    setShowHelpTooltip(false)
                    localStorage.setItem('nb_notif_banner_dismissed', 'true')
                  }}
                  title="Đóng gợi ý"
                >
                  ✕
                </button>
              </div>

              {notifPermission !== 'granted' && (
                <div className="msg-guidance-footer">
                  <button
                    className="msg-guidance-cta-btn"
                    onClick={handleToggleNotification}
                  >
                    <Sparkles size={13} /> Bật thông báo ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="msg-conv-list">
          {loading ? (
            <div className="msg-loading">Đang tải...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="msg-empty">
              <MessageCircle size={48} />
              <p>Chưa có hội thoại nào</p>
              <button className="msg-new-btn" onClick={loadFriendsForNewChat}>
                Nhắn tin mới
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.friend.id}
                className={`msg-conv-item ${selectedUserId === conv.friend.id ? 'active' : ''}`}
                onClick={() => selectUser(conv.friend.id)}
              >
                <div className="msg-conv-avatar">
                  {conv.friend.avatar_url ? (
                    <img src={conv.friend.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                  ) : (
                    conv.friend.display_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="msg-conv-info">
                  <div className="msg-conv-name">
                    <span>{conv.friend.display_name}</span>
                    {conv.last_message && (
                      <span className="msg-conv-time">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <div className={`msg-conv-preview ${conv.unread_count > 0 ? 'unread' : ''}`}>
                      {conv.last_message.sender_id === currentUserId ? 'Bạn: ' : ''}
                      {conv.last_message.content.length > 40
                        ? conv.last_message.content.slice(0, 40) + '...'
                        : conv.last_message.content}
                    </div>
                  )}
                </div>
                {conv.unread_count > 0 && (
                  <div className="msg-unread-badge">{conv.unread_count}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="msg-chat">
        {selectedUser ? (
          <>
            <div className="msg-chat-header">
              <button
                className="msg-back-btn"
                onClick={() => { setMobileShowChat(false); setSelectedUserId(null) }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="msg-conv-avatar" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                ) : (
                  selectedUser.display_name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="msg-chat-header-name">{selectedUser.display_name}</div>
                <div className="msg-chat-header-status">Bạn bè</div>
              </div>
            </div>

            <div className="msg-messages">
              {loadingMessages ? (
                <div className="msg-loading">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="msg-empty">
                  <MessageCircle size={40} />
                  <p>Chưa có tin nhắn nào</p>
                  <p style={{ fontSize: '0.8rem' }}>Hãy gửi lời chào đến {selectedUser.display_name}!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isSent = msg.sender_id === currentUserId
                    const showDate = i === 0 ||
                      new Date(msg.created_at).toDateString() !==
                      new Date(messages[i - 1].created_at).toDateString()

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="msg-date-sep">
                            <span>{new Date(msg.created_at).toLocaleDateString('vi-VN', {
                              weekday: 'long', day: 'numeric', month: 'long'
                            })}</span>
                          </div>
                        )}
                        <div className={`msg-bubble-row ${isSent ? 'sent' : 'received'}`}>
                          <div className={`msg-bubble ${isSent ? 'sent' : 'received'}`}>
                            <div>{msg.content}</div>
                            <div className="msg-bubble-meta">
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {isSent && (
                                msg.read_at
                                  ? <CheckCheck size={12} />
                                  : <Check size={12} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="msg-input-area">
              <textarea
                ref={inputRef}
                className="msg-textarea"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="msg-send-btn"
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                title="Gửi"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="msg-empty">
            <MessageCircle size={56} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tin nhắn</p>
            <p>Chọn một hội thoại hoặc bắt đầu cuộc trò chuyện mới</p>
          </div>
        )}
      </div>

      {/* ── New chat modal ── */}
      {showNewChat && (
        <div className="msg-new-chat-overlay" onClick={() => setShowNewChat(false)}>
          <div className="msg-new-chat-modal" onClick={e => e.stopPropagation()}>
            <h3><Users size={18} /> Chọn bạn để nhắn tin</h3>
            <input
              className="msg-search-input"
              placeholder="Tìm bạn bè..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div className="msg-friend-list">
              {filteredFriends.length === 0 && conversations.length === 0 ? (
                <div className="msg-empty" style={{ padding: 20 }}>
                  <p>Chưa có bạn bè</p>
                  <button
                    className="msg-new-btn"
                    onClick={() => { setShowNewChat(false); navigate('/friends') }}
                  >
                    Kết bạn ngay
                  </button>
                </div>
              ) : (
                <>
                  {filteredFriends.map(f => (
                    <div key={f.id} className="msg-friend-item" onClick={() => startNewChat(f)}>
                      <div className="msg-conv-avatar" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                        {f.avatar_url ? (
                          <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                        ) : (
                          f.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.display_name}</div>
                        {f.bio && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #999)' }}>{f.bio}</div>}
                      </div>
                    </div>
                  ))}
                  {conversations.filter(c => c.friend.display_name.toLowerCase().includes(search.toLowerCase())).map(c => (
                    <div key={c.friend.id} className="msg-friend-item" onClick={() => { setShowNewChat(false); selectUser(c.friend.id) }}>
                      <div className="msg-conv-avatar" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                        {c.friend.avatar_url ? (
                          <img src={c.friend.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                        ) : (
                          c.friend.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.friend.display_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #999)' }}>Đã nhắn tin</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <button className="msg-modal-close" onClick={() => setShowNewChat(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}
