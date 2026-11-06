import { useEffect, useState } from 'react'
import { Users, HeartHandshake, Calendar, Maximize2, X } from 'lucide-react'
import { api, FeedItem } from '../api'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import SkeletonCards from './SkeletonCards'

export default function CommunityPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxItem, setLightboxItem] = useState<FeedItem | null>(null)

  useEffect(() => {
    api<FeedItem[]>('/community/feed')
      .then(data => { setItems(data); setLoading(false) })
      .catch(e => { setError(e instanceof Error ? e.message : 'Không tải được bảng tin.'); setLoading(false) })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxItem(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
            <article className={`feed-card ${item.image_url ? 'has-locket-photo' : ''}`} key={item.id}>
              <div className="feed-author">
                <div className="avatar">{item.author.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{item.author}</strong>
                  <small>{item.occurred_at || new Date(item.created_at).toLocaleDateString('vi-VN')}</small>
                </div>
                <span className="public-pill">Công khai</span>
              </div>

              {/* ── Locket Photo Presentation in Community Feed ── */}
              {item.image_url && (
                <div
                  className="locket-card-widget"
                  onClick={() => setLightboxItem(item)}
                  title="Chạm để xem ảnh toàn màn hình"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="locket-widget-img"
                    loading="lazy"
                  />
                  <div className="locket-overlay-bottom">
                    <span className="locket-caption-pill">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    className="locket-zoom-hint"
                    aria-label="Xem ảnh lớn"
                    onClick={(e) => { e.stopPropagation(); setLightboxItem(item) }}
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              )}

              <h2>{item.title}</h2>
              <p>{item.content}</p>
              <div className="feed-footer">
                <span><HeartHandshake size={15} /> Cảm ơn vì đã chia sẻ</span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── Community Locket Lightbox ── */}
      {lightboxItem && lightboxItem.image_url && (
        <div
          className="locket-lightbox-overlay"
          onClick={() => setLightboxItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="locket-lightbox-card" onClick={e => e.stopPropagation()}>
            <button
              className="locket-lightbox-close"
              onClick={() => setLightboxItem(null)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="locket-lightbox-photo-wrap">
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.title}
                className="locket-lightbox-img"
              />
              <div className="locket-lightbox-time-pill">
                <Calendar size={13} />
                {lightboxItem.occurred_at || new Date(lightboxItem.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div className="locket-lightbox-details">
              <div className="locket-lightbox-header">
                <h3>{lightboxItem.title}</h3>
                <span className="mini-tag">Người chia sẻ: {lightboxItem.author}</span>
              </div>
              <p className="locket-lightbox-story">{lightboxItem.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
