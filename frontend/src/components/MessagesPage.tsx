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
      <style>{`
        .messages-page {
          display: flex;
          height: calc(100vh - 120px);
          max-width: 1100px;
          margin: 0 auto;
          background: var(--card-bg, #fff);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
        }

        /* ── Sidebar ── */
        .msg-sidebar {
          width: 340px;
          min-width: 280px;
          border-right: 1px solid var(--border, #e5e7eb);
          display: flex;
          flex-direction: column;
          background: var(--card-bg, #fff);
        }
        .msg-sidebar-header {
          padding: 20px 16px 12px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }
        .msg-sidebar-header h2 {
          font-size: 1.3rem;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text, #1a1a1a);
        }
        .msg-sidebar-header h2 svg { color: #e6677e; }
        .msg-sidebar-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .msg-search-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--border, #ddd);
          background: var(--input-bg, #f8f9fa);
          color: var(--text, #1a1a1a);
          font-size: 0.85rem;
          outline: none;
        }
        .msg-search-input:focus { border-color: #e6677e; }
        .msg-new-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #e6677e, #f0788d);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 12px rgba(230, 103, 126, 0.3);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .msg-new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(230, 103, 126, 0.4);
        }

        /* ── Conversation list ── */
        .msg-conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 0;
        }
        .msg-conv-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
          border-left: 3px solid transparent;
        }
        .msg-conv-item:hover { background: var(--hover-bg, #f3f4f6); }
        .msg-conv-item.active {
          background: rgba(230, 103, 126, 0.08);
          border-left-color: #e6677e;
        }
        .msg-conv-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e6677e, #e8c39e);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 1.1rem;
          flex-shrink: 0;
        }
        .msg-conv-info { flex: 1; min-width: 0; }
        .msg-conv-name {
          font-weight: 700; font-size: 0.9rem;
          color: var(--text, #1a1a1a);
          display: flex; justify-content: space-between; align-items: center;
        }
        .msg-conv-time { font-size: 0.7rem; color: var(--text-muted, #999); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .msg-conv-preview {
          font-size: 0.8rem; color: var(--text-muted, #888);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 2px;
        }
        .msg-conv-preview.unread { color: var(--text, #1a1a1a); font-weight: 600; }
        .msg-unread-badge {
          background: #e6677e; color: #fff;
          font-size: 0.65rem; font-weight: 700;
          min-width: 18px; height: 18px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 5px;
        }

        /* ── Chat area ── */
        .msg-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg, #f8f9fa);
        }
        .msg-chat-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card-bg, #fff);
        }
        .msg-back-btn {
          display: none;
          background: none; border: none; cursor: pointer;
          color: var(--text, #1a1a1a); padding: 4px;
        }
        .msg-chat-header-name { font-weight: 700; font-size: 1rem; color: var(--text, #1a1a1a); }
        .msg-chat-header-status { font-size: 0.7rem; color: var(--text-muted, #999); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }

        /* ── Messages ── */
        .msg-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .msg-date-sep {
          text-align: center;
          font-size: 0.72rem;
          color: var(--text-muted, #999);
          margin: 12px 0 8px;
          position: relative;
        }
        .msg-date-sep span {
          background: var(--bg, #f8f9fa);
          padding: 0 12px;
          position: relative;
          z-index: 1;
        }
        .msg-bubble-row {
          display: flex;
          margin-bottom: 2px;
        }
        .msg-bubble-row.sent { justify-content: flex-end; }
        .msg-bubble-row.received { justify-content: flex-start; }
        .msg-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.88rem;
          line-height: 1.45;
          word-wrap: break-word;
          position: relative;
        }
        .msg-bubble.sent {
          background: linear-gradient(135deg, #e6677e, #f0788d);
          color: #fff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 3px 10px rgba(230, 103, 126, 0.25);
        }
        .msg-bubble.received {
          background: #fffdfa;
          color: var(--text, #36282b);
          border-bottom-left-radius: 4px;
          border: 1px solid var(--border, #ede2d5);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .msg-bubble-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 4px;
          font-size: 0.65rem;
          opacity: 0.7;
        }
        .msg-bubble.received .msg-bubble-meta { justify-content: flex-start; }

        /* ── Input ── */
        .msg-input-area {
          padding: 12px 20px;
          border-top: 1px solid var(--border, #e5e7eb);
          display: flex;
          gap: 10px;
          align-items: flex-end;
          background: var(--card-bg, #fff);
        }
        .msg-textarea {
          flex: 1;
          resize: none;
          border: 1px solid var(--border, #ddd);
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 0.88rem;
          font-family: inherit;
          background: var(--input-bg, #f8f9fa);
          color: var(--text, #1a1a1a);
          max-height: 120px;
          outline: none;
          line-height: 1.4;
        }
        .msg-textarea:focus { border-color: #e6677e; }
        .msg-send-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #e6677e, #f0788d);
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.35);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .msg-send-btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
        .msg-send-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 103, 126, 0.45);
        }

        /* ── Empty states ── */
        .msg-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted, #999);
          gap: 12px;
          padding: 40px;
          text-align: center;
        }
        .msg-empty svg { opacity: 0.3; }
        .msg-empty p { margin: 0; font-size: 0.9rem; }

        /* ── New chat modal ── */
        .msg-new-chat-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .msg-new-chat-modal {
          background: var(--card-bg, #fff);
          border-radius: 16px;
          padding: 24px;
          width: 380px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        .msg-new-chat-modal h3 {
          margin: 0 0 16px;
          font-size: 1.1rem;
          color: var(--text, #1a1a1a);
        }
        .msg-friend-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .msg-friend-item:hover { background: rgba(230, 103, 126, 0.1); }
        .msg-friend-list { flex: 1; overflow-y: auto; }
        .msg-modal-close {
          margin-top: 12px; padding: 8px 16px;
          border-radius: 8px; border: 1px solid var(--border, #ddd);
          background: transparent; cursor: pointer;
          color: var(--text, #1a1a1a); font-size: 0.75rem;
          font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;
        }

        /* ── Loading ── */
        .msg-loading {
          display: flex; align-items: center; justify-content: center;
          padding: 40px; color: var(--text-muted, #999);
        }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .msg-sidebar { width: 100%; }
          .msg-chat { display: none; }
          .messages-page.mobile-chat .msg-sidebar { display: none; }
          .messages-page.mobile-chat .msg-chat { display: flex; }
          .msg-back-btn { display: flex; }
          .msg-bubble { max-width: 85%; }
        }
      `}</style>

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
