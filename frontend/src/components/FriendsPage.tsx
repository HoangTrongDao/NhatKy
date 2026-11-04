
import { useMemo, useState } from 'react'
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
} from 'lucide-react'

interface Friend {
  id: number
  name: string
  email: string
  avatar: string
  mutualFriends: number
  status: 'friend' | 'pending' | 'suggestion'
}

const initialFriends: Friend[] = [
  {
    id: 1,
    name: 'Nguyễn Minh Anh',
    email: 'minhanh@example.com',
    avatar: 'M',
    mutualFriends: 5,
    status: 'friend',
  },
  {
    id: 2,
    name: 'Trần Hoàng Nam',
    email: 'hoangnam@example.com',
    avatar: 'N',
    mutualFriends: 3,
    status: 'friend',
  },
  {
    id: 3,
    name: 'Lê Thu Hà',
    email: 'thuha@example.com',
    avatar: 'H',
    mutualFriends: 8,
    status: 'friend',
  },
]

const initialRequests: Friend[] = [
  {
    id: 4,
    name: 'Phạm Đức Anh',
    email: 'ducanh@example.com',
    avatar: 'Đ',
    mutualFriends: 4,
    status: 'pending',
  },
  {
    id: 5,
    name: 'Hoàng Mai Linh',
    email: 'mailinh@example.com',
    avatar: 'L',
    mutualFriends: 2,
    status: 'pending',
  },
]

const initialSuggestions: Friend[] = [
  {
    id: 6,
    name: 'Nguyễn Quang Huy',
    email: 'quanghuy@example.com',
    avatar: 'Q',
    mutualFriends: 6,
    status: 'suggestion',
  },
  {
    id: 7,
    name: 'Đỗ Khánh Vy',
    email: 'khanhvy@example.com',
    avatar: 'V',
    mutualFriends: 3,
    status: 'suggestion',
  },
  {
    id: 8,
    name: 'Bùi Thành Đạt',
    email: 'thanhdat@example.com',
    avatar: 'Đ',
    mutualFriends: 1,
    status: 'suggestion',
  },
]

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

.friends-search input::placeholder {
  color: var(--muted, #888);
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.friend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.05);
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

.friend-action,
.friend-accept,
.friend-reject {
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

.friend-buttons {
  display: flex;
  gap: 7px;
}

.friend-accept {
  color: #278b60;
}

.friend-reject {
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

.friend-add:disabled {
  background: var(--background, #eee);
  color: var(--muted, #888);
  cursor: default;
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
}
`

function FriendsPageStyles() {
  return <style>{friendsStyles}</style>
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>(initialFriends)
  const [requests, setRequests] = useState<Friend[]>(initialRequests)
  const [sentRequests, setSentRequests] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<
    'friends' | 'requests' | 'suggestions'
  >('friends')

  const filteredFriends = useMemo(() => {
    return friends.filter(friend =>
      `${friend.name} ${friend.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [friends, search])

  function acceptRequest(id: number) {
    const request = requests.find(item => item.id === id)
    if (!request) return

    setFriends(prev => [
      ...prev,
      { ...request, status: 'friend' },
    ])

    setRequests(prev => prev.filter(item => item.id !== id))
  }

  function rejectRequest(id: number) {
    setRequests(prev => prev.filter(item => item.id !== id))
  }

  function sendRequest(id: number) {
    setSentRequests(prev =>
      prev.includes(id) ? prev : [...prev, id]
    )
  }

  return (
    <>
      <FriendsPageStyles />

      <div className="friends-page">
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
              <span>Lời mời</span>
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

        <section className="friends-content">
          <div className="friends-toolbar">
            <div className="friends-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Tìm kiếm bạn bè..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

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
              Gợi ý
            </button>
          </div>

          {activeTab === 'friends' && (
            <div className="friends-grid">
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div className="friend-card" key={friend.id}>
                    <div className="friend-avatar">
                      {friend.avatar}
                    </div>

                    <div className="friend-info">
                      <h3>{friend.name}</h3>
                      <p>{friend.email}</p>
                      <span>
                        {friend.mutualFriends} bạn chung
                      </span>
                    </div>

                    <button
                      className="friend-action"
                      title="Nhắn tin"
                      onClick={() =>
                        alert('Chức năng nhắn tin sẽ được phát triển sau!')
                      }
                    >
                      <MessageCircle size={17} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="friends-empty">
                  <UserRound size={35} />
                  <h3>Không tìm thấy bạn bè</h3>
                  <p>Thử tìm kiếm bằng tên khác nhé.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="friends-grid">
              {requests.length > 0 ? (
                requests.map(friend => (
                  <div className="friend-card" key={friend.id}>
                    <div className="friend-avatar">
                      {friend.avatar}
                    </div>

                    <div className="friend-info">
                      <h3>{friend.name}</h3>
                      <p>{friend.email}</p>
                      <span>
                        {friend.mutualFriends} bạn chung
                      </span>
                    </div>

                    <div className="friend-buttons">
                      <button
                        className="friend-accept"
                        title="Chấp nhận"
                        onClick={() => acceptRequest(friend.id)}
                      >
                        <Check size={17} />
                      </button>

                      <button
                        className="friend-reject"
                        title="Từ chối"
                        onClick={() => rejectRequest(friend.id)}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="friends-empty">
                  <UserCheck size={35} />
                  <h3>Chưa có lời mời kết bạn</h3>
                  <p>
                    Khi có người gửi lời mời, bạn sẽ thấy ở đây.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="friends-grid">
              {initialSuggestions.map(friend => {
                const sent = sentRequests.includes(friend.id)

                return (
                  <div className="friend-card" key={friend.id}>
                    <div className="friend-avatar">
                      {friend.avatar}
                    </div>

                    <div className="friend-info">
                      <h3>{friend.name}</h3>
                      <p>{friend.email}</p>
                      <span>
                        {friend.mutualFriends} bạn chung
                      </span>
                    </div>

                    <button
                      className="friend-add"
                      disabled={sent}
                      onClick={() => sendRequest(friend.id)}
                    >
                      {sent ? (
                        <>
                          <Check size={15} />
                          Đã gửi
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          Kết bạn
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
