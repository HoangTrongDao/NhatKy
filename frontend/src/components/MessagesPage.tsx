import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MessageCircle, Send, ArrowLeft, CheckCheck, Check, Users
} from 'lucide-react'
import {
  fetchConversations, fetchMessages, sendMessage, fetchFriends,
  type Conversation, type Message, type User
} from '../api'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

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

  // Tải danh sách hội thoại
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConversations(data)
    } catch { /* ignore */ }
  }, [])

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

  // Tự động refresh mỗi 8 giây
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations()
      if (selectedUserId) {
        loadMessages(selectedUserId, false)
      }
    }, 8000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId])

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (userId: number, showLoading = true) => {
    if (showLoading) setLoadingMessages(true)
    try {
      const data = await fetchMessages(userId)
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
        if (found) setSelectedUser(found as User)
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
      setFriends(data as User[])
    } catch { /* ignore */ }
    setShowNewChat(true)
  }

  const startNewChat = (friend: User) => {
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
                  {conv.friend.display_name.charAt(0).toUpperCase()}
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
                {selectedUser.display_name.charAt(0).toUpperCase()}
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
                        {f.display_name.charAt(0).toUpperCase()}
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
                        {c.friend.display_name.charAt(0).toUpperCase()}
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
