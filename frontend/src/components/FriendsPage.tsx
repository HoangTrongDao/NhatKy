
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

function FriendsPageStyles() {
  return null
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
      `${friend.display_name} ${friend.bio || ''}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [friends, search])

  const filteredSuggestions = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return suggestions

    return suggestions.filter(user =>
      `${user.display_name} ${user.bio || ''}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [suggestions, search])

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return requests

    return requests.filter(request =>
      `${request.sender.display_name} ${request.sender.bio || ''}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [requests, search])

  const filteredSentRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return sentRequests

    return sentRequests.filter(request =>
      `${request.receiver.display_name} ${request.receiver.bio || ''}`
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
    const initial = user.display_name?.trim().charAt(0).toUpperCase() || '?'

    return (
      <div className="friend-card" key={user.id}>
        <div className="friend-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
          ) : (
            initial
          )}
        </div>

        <div className="friend-info">
          <h3>{user.display_name}</h3>
          <p>{user.bio?.trim() || 'Thành viên New Beginning'}</p>
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
                          {request.sender.avatar_url ? <img src={request.sender.avatar_url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} /> : (request.sender.display_name?.trim().charAt(0).toUpperCase() || '?')}
                        </div>

                        <div className="friend-info">
                          <h3>{request.sender.display_name}</h3>
                          <p>{request.sender.bio?.trim() || 'Thành viên New Beginning'}</p>
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
                          {request.receiver.avatar_url ? <img src={request.receiver.avatar_url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} /> : (request.receiver.display_name?.trim().charAt(0).toUpperCase() || '?')}
                        </div>

                        <div className="friend-info">
                          <h3>{request.receiver.display_name}</h3>
                          <p>{request.receiver.bio?.trim() || 'Thành viên New Beginning'}</p>
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
