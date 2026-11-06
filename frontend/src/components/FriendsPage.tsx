
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  fetchFriends,
  fetchFriendRequests,
  fetchSentFriendRequests,
  fetchFriendSuggestions,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendRequest,
} from '../api'

import type {
  FriendUser,
  FriendRequest,
} from '../api'

import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  UserRound,
  Check,
  X,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react'

// ==========================================
// TYPES
// ==========================================

type TabType = 'friends' | 'requests' | 'suggestions' | 'sent'

// ==========================================
// CSS
// ==========================================

const friendsStyles = `
.friends-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px 60px;
  color: var(--text, #333);
}

.friends-page * {
  box-sizing: border-box;
}

.friends-page button,
.friends-page input {
  font: inherit;
}

.friends-page button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.friends-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 36px;
  border-radius: 20px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #eee);
  margin-bottom: 24px;
}

.friends-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent, #a87952);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}

.friends-hero h1 {
  font-size: 34px;
  margin: 14px 0 8px;
}

.friends-hero p {
  color: var(--muted, #888);
  max-width: 500px;
  line-height: 1.7;
  margin: 0;
}

.friends-hero-icon {
  width: 85px;
  height: 85px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--accent, #a87952);
  background: var(--background, #f5eee7);
}

.friends-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.friends-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border: 1px solid var(--border, #eee);
  background: var(--surface, #fff);
  border-radius: 16px;
  color: var(--accent, #a87952);
}

.friends-stat-card div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.friends-stat-card strong {
  font-size: 22px;
  color: var(--text, #333);
}

.friends-stat-card span {
  color: var(--muted, #888);
  font-size: 13px;
}

.friends-content {
  padding: 24px;
  border: 1px solid var(--border, #eee);
  border-radius: 18px;
  background: var(--surface, #fff);
}

.friends-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.friends-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 420px;
  padding: 12px 15px;
  border: 1px solid var(--border, #ddd);
  border-radius: 12px;
  color: var(--muted, #888);
}

.friends-search input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text, #333);
}

.friends-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--border, #eee);
  margin-top: 25px;
  overflow-x: auto;
}

.friends-tabs button {
  padding: 12px 2px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--muted, #888);
  cursor: pointer;
  white-space: nowrap;
}

.friends-tabs button.active {
  color: var(--accent, #a87952);
  border-bottom-color: var(--accent, #a87952);
  font-weight: 600;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 17px;
  border: 1px solid var(--border, #eee);
  border-radius: 14px;
  transition: transform .2s, box-shadow .2s;
}

.friend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 18px rgba(0,0,0,.05);
}

.friend-avatar {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--background, #f2e8dc);
  color: var(--accent, #a87952);
  font-size: 19px;
  font-weight: 700;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info h3 {
  font-size: 14px;
  margin: 0 0 5px;
  color: var(--text, #333);
}

.friend-info p,
.friend-info span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted, #888);
  font-size: 12px;
  margin: 0 0 5px;
}

.friend-buttons {
  display: flex;
  gap: 7px;
  flex-shrink: 0;
}

.friend-action,
.friend-accept,
.friend-reject,
.friend-cancel {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--border, #eee);
  border-radius: 10px;
  background: transparent;
  color: var(--accent, #a87952);
  cursor: pointer;
}

.friend-accept {
  color: #278b60;
}

.friend-reject,
.friend-cancel {
  color: #c65b5b;
}

.friend-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: none;
  border-radius: 9px;
  background: var(--accent, #a87952);
  color: white;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.friends-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 45px 20px;
  color: var(--muted, #888);
}

.friends-empty h3 {
  color: var(--text, #333);
  margin-bottom: 7px;
}

.friends-message {
  padding: 12px 15px;
  margin-top: 16px;
  border-radius: 10px;
  background: var(--background, #f5eee7);
  color: var(--text, #333);
  font-size: 13px;
}

.friends-error {
  padding: 15px;
  margin-top: 16px;
  border: 1px solid #e5a4a4;
  border-radius: 10px;
  color: #c65b5b;
  font-size: 13px;
}

.friends-reload {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 13px;
  border: 1px solid var(--border, #ddd);
  border-radius: 10px;
  background: transparent;
  color: var(--accent, #a87952);
  cursor: pointer;
  white-space: nowrap;
}

.friends-loading {
  text-align: center;
  padding: 50px 15px;
  color: var(--muted, #888);
}

@media (max-width: 650px) {
  .friends-page {
    padding: 22px 15px 40px;
  }

  .friends-hero {
    padding: 24px 20px;
  }

  .friends-hero h1 {
    font-size: 27px;
  }

  .friends-hero-icon {
    width: 60px;
    height: 60px;
  }

  .friends-stats {
    gap: 8px;
  }

  .friends-stat-card {
    padding: 13px 9px;
    gap: 7px;
  }

  .friends-stat-card strong {
    font-size: 18px;
  }

  .friends-stat-card span {
    font-size: 11px;
  }

  .friends-content {
    padding: 16px;
  }

  .friends-grid {
    grid-template-columns: 1fr;
  }

  .friends-tabs {
    gap: 18px;
  }

  .friends-toolbar {
    align-items: stretch;
  }
}
`

function FriendsPageStyles() {
  return <style>{friendsStyles}</style>
}

// ==========================================
// COMPONENT
// ==========================================

export default function FriendsPage() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<FriendUser[]>([])

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('friends')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        friendsData,
        requestsData,
        sentData,
        suggestionsData,
      ] = await Promise.all([
        fetchFriends(),
        fetchFriendRequests(),
        fetchSentFriendRequests(),
        fetchFriendSuggestions(),
      ])

      setFriends(friendsData)
      setRequests(requestsData)
      setSentRequests(sentData)
      setSuggestions(suggestionsData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu bạn bè.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredFriends = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return friends

    return friends.filter(friend =>
      `${friend.display_name} ${friend.email}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [friends, search])

  const filteredSuggestions = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return suggestions

    return suggestions.filter(user =>
      `${user.display_name} ${user.email}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [suggestions, search])

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return requests

    return requests.filter(request =>
      `${request.sender.display_name} ${request.sender.email}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [requests, search])

  const filteredSentRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return sentRequests

    return sentRequests.filter(request =>
      `${request.receiver.display_name} ${request.receiver.email}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [sentRequests, search])

  // ==========================================
  // ACTIONS
  // ==========================================

  async function sendRequest(userId: number) {
    setBusyAction(`send-${userId}`)
    setMessage('')
    setError('')

    try {
      const result = await sendFriendRequest(userId)
      setMessage(result.detail)
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi lời mời kết bạn.'
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function acceptRequest(requestId: number) {
    setBusyAction(`accept-${requestId}`)
    setMessage('')
    setError('')

    try {
      const result = await acceptFriendRequest(requestId)
      setMessage(result.detail)
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể chấp nhận lời mời.'
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function rejectRequest(requestId: number) {
    setBusyAction(`reject-${requestId}`)
    setMessage('')
    setError('')

    try {
      const result = await deleteFriendRequest(requestId)
      setMessage(result.detail)
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể từ chối lời mời.'
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function cancelRequest(requestId: number) {
    setBusyAction(`cancel-${requestId}`)
    setMessage('')
    setError('')

    try {
      const result = await deleteFriendRequest(requestId)
      setMessage(result.detail)
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể hủy lời mời.'
      )
    } finally {
      setBusyAction(null)
    }
  }

  // ==========================================
  // USER CARD
  // ==========================================

  function renderUserCard(user: FriendUser, action?: ReactNode) {
    const avatar = user.display_name?.trim().charAt(0) || '?'

    return (
      <div className="friend-card" key={user.id}>
        <div className="friend-avatar">
          {avatar}
        </div>

        <div className="friend-info">
          <h3>{user.display_name}</h3>
          <p>{user.email}</p>
          <span>
            {user.bio?.trim() || 'Thành viên New Beginning'}
          </span>
        </div>

        {action}
      </div>
    )
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================

  function renderEmpty(icon: ReactNode, title: string, description: string) {
    return (
      <div className="friends-empty">
        {icon}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    )
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <FriendsPageStyles />

      <div className="friends-page">

        {/* HERO */}
        <section className="friends-hero">
          <div>
            <span className="friends-eyebrow">
              <Sparkles size={14} />
              KẾT NỐI VÀ CHIA SẺ
            </span>

            <h1>Bạn bè</h1>

            <p>
              Những người bạn đồng hành cùng bạn trên hành trình
              lưu giữ những điều đẹp đẽ.
            </p>
          </div>

          <div className="friends-hero-icon">
            <Users size={42} />
          </div>
        </section>

        {/* STATISTICS */}
        <section className="friends-stats">
          <div className="friends-stat-card">
            <Users size={21} />
            <div>
              <strong>{friends.length}</strong>
              <span>Bạn bè</span>
            </div>
          </div>

          <div className="friends-stat-card">
            <UserPlus size={21} />
            <div>
              <strong>{requests.length}</strong>
              <span>Lời mời nhận được</span>
            </div>
          </div>

          <div className="friends-stat-card">
            <UserCheck size={21} />
            <div>
              <strong>{sentRequests.length}</strong>
              <span>Đã gửi</span>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="friends-content">

          {/* TOOLBAR */}
          <div className="friends-toolbar">
            <div className="friends-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              className="friends-reload"
              onClick={loadData}
              disabled={loading}
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>

          {/* TABS */}
          <div className="friends-tabs">
            <button
              className={activeTab === 'friends' ? 'active' : ''}
              onClick={() => setActiveTab('friends')}
            >
              Bạn bè ({friends.length})
            </button>

            <button
              className={activeTab === 'requests' ? 'active' : ''}
              onClick={() => setActiveTab('requests')}
            >
              Lời mời ({requests.length})
            </button>

            <button
              className={activeTab === 'suggestions' ? 'active' : ''}
              onClick={() => setActiveTab('suggestions')}
            >
              Gợi ý ({suggestions.length})
            </button>

            <button
              className={activeTab === 'sent' ? 'active' : ''}
              onClick={() => setActiveTab('sent')}
            >
              Đã gửi ({sentRequests.length})
            </button>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="friends-message">
              {message}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="friends-error">
              {error}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="friends-loading">
              <RefreshCw size={25} />
              <p>Đang tải dữ liệu bạn bè...</p>
            </div>
          ) : (
            <>

              {/* TAB: FRIENDS */}
              {activeTab === 'friends' && (
                <div className="friends-grid">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend =>
                      renderUserCard(
                        friend,
                        <button
                          className="friend-action"
                          title="Nhắn tin"
                          onClick={() =>
                            navigate(`/messages?user=${friend.id}`)
                          }
                        >
                          <MessageCircle size={17} />
                        </button>
                      )
                    )
                  ) : (
                    renderEmpty(
                      <UserRound size={35} />,
                      friends.length === 0
                        ? 'Bạn chưa có người bạn nào'
                        : 'Không tìm thấy bạn bè',
                      'Hãy khám phá gợi ý để kết nối với mọi người nhé.'
                    )
                  )}
                </div>
              )}

              {/* TAB: RECEIVED REQUESTS */}
              {activeTab === 'requests' && (
                <div className="friends-grid">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => (
                      <div className="friend-card" key={request.id}>
                        <div className="friend-avatar">
                          {request.sender.display_name?.trim().charAt(0) || '?'}
                        </div>

                        <div className="friend-info">
                          <h3>{request.sender.display_name}</h3>
                          <p>{request.sender.email}</p>
                          <span>
                            <Clock size={11} />
                            {' '}Đã gửi lời mời kết bạn
                          </span>
                        </div>

                        <div className="friend-buttons">
                          <button
                            className="friend-accept"
                            title="Chấp nhận"
                            disabled={busyAction !== null}
                            onClick={() => acceptRequest(request.id)}
                          >
                            <Check size={17} />
                          </button>

                          <button
                            className="friend-reject"
                            title="Từ chối"
                            disabled={busyAction !== null}
                            onClick={() => rejectRequest(request.id)}
                          >
                            <X size={17} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    renderEmpty(
                      <UserCheck size={35} />,
                      'Chưa có lời mời kết bạn',
                      'Khi có người gửi lời mời, bạn sẽ thấy ở đây.'
                    )
                  )}
                </div>
              )}

              {/* TAB: SUGGESTIONS */}
              {activeTab === 'suggestions' && (
                <div className="friends-grid">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map(user =>
                      renderUserCard(
                        user,
                        <button
                          className="friend-add"
                          disabled={busyAction !== null}
                          onClick={() => sendRequest(user.id)}
                        >
                          {busyAction === `send-${user.id}` ? (
                            'Đang gửi...'
                          ) : (
                            <>
                              <UserPlus size={15} />
                              Kết bạn
                            </>
                          )}
                        </button>
                      )
                    )
                  ) : (
                    renderEmpty(
                      <Sparkles size={35} />,
                      'Không có gợi ý phù hợp',
                      'Có thể bạn đã kết nối với các thành viên phù hợp hoặc chưa có tài khoản khác.'
                    )
                  )}
                </div>
              )}

              {/* TAB: SENT REQUESTS */}
              {activeTab === 'sent' && (
                <div className="friends-grid">
                  {filteredSentRequests.length > 0 ? (
                    filteredSentRequests.map(request => (
                      <div className="friend-card" key={request.id}>
                        <div className="friend-avatar">
                          {request.receiver.display_name?.trim().charAt(0) || '?'}
                        </div>

                        <div className="friend-info">
                          <h3>{request.receiver.display_name}</h3>
                          <p>{request.receiver.email}</p>
                          <span>Đang chờ phản hồi</span>
                        </div>

                        <button
                          className="friend-cancel"
                          title="Hủy lời mời"
                          disabled={busyAction !== null}
                          onClick={() => cancelRequest(request.id)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    ))
                  ) : (
                    renderEmpty(
                      <Clock size={35} />,
                      'Bạn chưa gửi lời mời nào',
                      'Những lời mời đang chờ phản hồi sẽ xuất hiện ở đây.'
                    )
                  )}
                </div>
              )}

            </>
          )}
        </section>
      </div>
    </>
  )
}
