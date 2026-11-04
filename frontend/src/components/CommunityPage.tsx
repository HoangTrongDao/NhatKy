import { useEffect, useState } from 'react'
import { Users, HeartHandshake } from 'lucide-react'
import { api, FeedItem } from '../api'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import SkeletonCards from './SkeletonCards'

export default function CommunityPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api<FeedItem[]>('/community/feed')
      .then(data => { setItems(data); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : 'Không tải được bảng tin.'); setLoading(false) })
  }, [])

  return (
    <div className="page subpage">
      <PageHeader
        eyebrow="KHÔNG GIAN CHUNG"
        title="Những điều tốt đẹp được sẻ chia."
        description="Bảng tin chỉ hiển thị kỷ niệm mà chủ sở hữu đã chủ động đặt ở chế độ công khai. Hãy lắng nghe mà không phán xét."
        icon={<Users />}
      />
      <div className="community-feed">
        <div className="community-callout">
          <HeartHandshake />
          <div>
            <strong>Chia sẻ bằng sự tử tế.</strong>
            <p>Mỗi câu chuyện là một phần của ai đó. Đọc với lòng tôn trọng và nhớ rằng bạn không cần biết toàn bộ câu chuyện để đối xử tử tế.</p>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <SkeletonCards count={4} />
        ) : items.length === 0 && !error ? (
          <EmptyCard
            title="Bảng tin đang yên bình"
            text="Chưa có kỷ niệm công khai. Khi ai đó sẵn lòng chia sẻ, câu chuyện của họ sẽ xuất hiện tại đây."
          />
        ) : (
          items.map(item => (
            <article className="feed-card" key={item.id}>
              <div className="feed-author">
                <div className="avatar">{item.author.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{item.author}</strong>
                  <small>{item.occurred_at || new Date(item.created_at).toLocaleDateString('vi-VN')}</small>
                </div>
                <span className="public-pill">Công khai</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
              <div className="feed-footer">
                <span><HeartHandshake size={15} /> Cảm ơn vì đã chia sẻ</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}