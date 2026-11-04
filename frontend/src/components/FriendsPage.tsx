
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

const suggestions: Friend[] = [
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

export default function FriendsPage() {
  const [friends, setFriends] = useState(initialFriends)
  const [requests, setRequests] = useState(initialRequests)
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
    setSentRequests(prev => [...prev, id])
  }

  return (
    <div className="friends-page">
      <section className="friends-hero">
        <div>
          <span className="friends-eyebrow">
            <Sparkles size={14} /> KẾT NỐI VÀ CHIA SẺ
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
                <p>Khi có người gửi lời mời, bạn sẽ thấy ở đây.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="friends-grid">
            {suggestions.map(friend => {
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
                        <Check size={15} /> Đã gửi
                      </>
                    ) : (
                      <>
                        <UserPlus size={15} /> Kết bạn
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
  )
}
