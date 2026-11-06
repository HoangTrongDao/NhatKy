import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookHeart, HeartHandshake, Leaf, Sparkles, Sunrise, Users, Target, BarChart3
} from 'lucide-react'
import { User, DashboardStats, fetchDashboardStats } from '../api'

/* ── Dashboard (Logged in) ── */
function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="page dashboard-page">
      {/* ── ZONE 1: HERO GREETING BANNER ── */}
      <section className="dash-hero-card">
        <div className="dash-hero-left">
          <div className="dash-user-badge">
            <div className="dash-avatar-large">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.display_name} className="dash-avatar-img" />
              ) : (
                user.display_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="eyebrow-chip"><Sparkles size={13} /> KHÔNG GIAN BÌNH YÊN</span>
              <h1>Xin chào, <em>{user.display_name}</em></h1>
            </div>
          </div>
          <p className="dash-hero-desc">
            Chào mừng bạn trở lại. Mỗi ngày là một trang sách mới để ghi lại những điều quý giá và vững bước tiến về phía trước.
          </p>
        </div>
        <div className="dash-hero-right">
          <div className="journey-badge">
            <span className="journey-num">{stats?.days_since_joined ? `${stats.days_since_joined}` : '1'}</span>
            <span className="journey-text">Ngày đồng hành cùng New Beginning</span>
          </div>
        </div>
      </section>

      {/* ── ZONE 2: STATS OVERVIEW ── */}
      <section className="dash-section">
        <div className="section-title-bar">
          <div>
            <span className="eyebrow"><BarChart3 size={14} /> THỐNG KÊ HÀNH TRÌNH</span>
            <h2>Những chặng đường bạn đã đi qua</h2>
          </div>
        </div>

        <div className="stats-grid-v2">
          <div className="stat-card-v2 peach">
            <div className="stat-card-header">
              <div className="stat-card-icon"><BookHeart size={22} /></div>
              <span className="stat-card-pill">KÝ ỨC</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-number">{stats?.total_memories ?? 0}</div>
              <div className="stat-title">Khoảnh khắc trân quý</div>
              <p className="stat-desc">Những kỷ niệm đẹp được lưu lại an toàn.</p>
            </div>
            <Link to="/memories" className="stat-card-link">Xem tất cả ký ức <span>→</span></Link>
          </div>

          <div className="stat-card-v2 sage">
            <div className="stat-card-header">
              <div className="stat-card-icon"><Leaf size={22} /></div>
              <span className="stat-card-pill">NHÌN LẠI</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-number">{stats?.total_reflections ?? 0}</div>
              <div className="stat-title">Bài học & Suy ngẫm</div>
              <p className="stat-desc">Học từ quá khứ để tâm hồn nhẹ nhàng hơn.</p>
            </div>
            <Link to="/reflections" className="stat-card-link">Xem suy ngẫm <span>→</span></Link>
          </div>

          <div className="stat-card-v2 gold">
            <div className="stat-card-header">
              <div className="stat-card-icon"><Target size={22} /></div>
              <span className="stat-card-pill">MỤC TIÊU</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-number">{stats?.total_goals ?? 0}</div>
              <div className="stat-title">Kế hoạch tương lai</div>
              <p className="stat-desc">Mục tiêu đang từng bước được hiện thực hóa.</p>
            </div>
            <Link to="/goals" className="stat-card-link">Quản lý mục tiêu <span>→</span></Link>
          </div>

          <div className="stat-card-v2 rose">
            <div className="stat-card-header">
              <div className="stat-card-icon"><Sparkles size={22} /></div>
              <span className="stat-card-pill">HOÀN THÀNH</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-number">{stats?.goals_completed ?? 0}</div>
              <div className="stat-title">Thành tựu đạt được</div>
              <p className="stat-desc">Minh chứng cho nỗ lực không ngừng của bạn.</p>
            </div>
            <Link to="/goals" className="stat-card-link">Xem thành tựu <span>→</span></Link>
          </div>
        </div>
      </section>

      {/* ── ZONE 3: RECENT MEMORY HIGHLIGHT ── */}
      {stats?.recent_memory_title && (
        <section className="dash-section">
          <div className="recent-highlight-card">
            <div className="highlight-tag">
              <Sparkles size={14} /> GẦN ĐÂY NHẤT
            </div>
            <div className="highlight-content">
              <h3>"{stats.recent_memory_title}"</h3>
              <p>Mỗi ký ức là một món quà thời gian gửi lại cho tâm hồn bạn.</p>
            </div>
            <Link className="button primary highlight-btn" to="/memories">
              Mở sổ ký ức <span>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── ZONE 4: QUICK ACTION TILES ── */}
      <section className="dash-section">
        <div className="section-title-bar">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> LỐI TẮT NHANH</span>
            <h2>Bạn muốn làm gì hôm nay?</h2>
          </div>
        </div>

        <div className="quick-actions-grid-v2">
          <Link className="quick-action-tile" to="/memories">
            <div className="tile-icon-box peach"><BookHeart size={24} /></div>
            <div className="tile-text">
              <strong>Lưu giữ ký ức</strong>
              <span>Viết lại câu chuyện làm bạn mỉm cười</span>
            </div>
            <span className="tile-arrow">↗</span>
          </Link>

          <Link className="quick-action-tile" to="/reflections">
            <div className="tile-icon-box sage"><Leaf size={24} /></div>
            <div className="tile-text">
              <strong>Viết nhìn lại</strong>
              <span>Ghi lại cảm xúc & đúc kết bài học</span>
            </div>
            <span className="tile-arrow">↗</span>
          </Link>

          <Link className="quick-action-tile" to="/goals">
            <div className="tile-icon-box gold"><Target size={24} /></div>
            <div className="tile-text">
              <strong>Đặt mục tiêu</strong>
              <span>Lên kế hoạch cho những bước đi tới</span>
            </div>
            <span className="tile-arrow">↗</span>
          </Link>

          <Link className="quick-action-tile" to="/community">
            <div className="tile-icon-box rose"><Users size={24} /></div>
            <div className="tile-text">
              <strong>Ghé cộng đồng</strong>
              <span>Chia sẻ và đọc những câu chuyện ấm áp</span>
            </div>
            <span className="tile-arrow">↗</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ── Landing Page (Guest) ── */
function Landing() {
  return (
    <div className="page landing-page">
      {/* ── HERO SHOWCASE ── */}
      <section className="hero-showcase">
        <div className="hero-copy">
          <div className="eyebrow-pill">
            <Sparkles size={14} /> KHÔNG GIAN BÌNH YÊN CHO TÂM HỒN
          </div>
          <h1>
            Điều đẹp đẽ<br />
            <em>vẫn xứng đáng được giữ lại.</em>
          </h1>
          <p className="hero-lede">
            Không cần vội vã xóa đi quá khứ. Ta có thể trân trọng điều tốt đẹp,
            học từ những điều chưa trọn vẹn và nhẹ nhàng mở lối cho một ngày mai tươi sáng hơn.
          </p>
          <div className="hero-actions">
            <Link className="button primary btn-hero-cta" to="/register">
              Bắt đầu hành trình <span>→</span>
            </Link>
            <Link className="button secondary btn-hero-secondary" to="/community">
              <Users size={16} /> Ghé thăm cộng đồng
            </Link>
          </div>
          <div className="gentle-note-box">
            <span className="note-dot" />
            <span>Bạn không cần phải hoàn hảo ngay hôm nay. Cứ bắt đầu từ một điều giản dị nhất.</span>
          </div>
        </div>

        <div className="hero-art-container" aria-label="Minh họa mặt trời mọc">
          <div className="hero-art-glass">
            <div className="sun-glow" />
            <div className="sun" />
            <div className="hill hill-back" />
            <div className="hill hill-front" />
            <div className="art-card-floating">
              <span className="art-card-tag">01 / KHỞI ĐẦU MỚI</span>
              <strong>Mọi điều tốt đẹp đều có thể bắt đầu lại từ hôm nay.</strong>
            </div>
            <div className="floating-sparkle">✦</div>
          </div>
        </div>
      </section>

      {/* ── 3 TRỤ CỘT CỐT LÕI ── */}
      <section className="landing-section">
        <div className="section-title-center">
          <span className="eyebrow-pill"><Leaf size={14} /> 3 BƯỚC ĐỒNG HÀNH</span>
          <h2>Ba cách dịu dàng để bước tiếp<br /><em>theo nhịp điệu của riêng bạn</em></h2>
          <p className="section-sub">Mỗi tính năng được thiết kế để nâng đỡ cảm xúc và định hướng tương lai.</p>
        </div>

        <div className="feature-grid-v2">
          <Link className="feature-card-v2 peach" to="/memories">
            <div className="feature-card-top">
              <div className="feature-icon-v2"><BookHeart size={24} /></div>
              <span className="feature-badge">BƯỚC 01</span>
            </div>
            <h3>Giữ Lại Điều Đẹp</h3>
            <p>Lưu giữ những khoảnh khắc, con người và câu chuyện từng làm trái tim bạn rung động và ấm áp.</p>
            <div className="feature-card-bottom">
              <span>Mở trang ký ức</span>
              <span className="arrow-box">↗</span>
            </div>
          </Link>

          <Link className="feature-card-v2 sage" to="/reflections">
            <div className="feature-card-top">
              <div className="feature-icon-v2"><Leaf size={24} /></div>
              <span className="feature-badge">BƯỚC 02</span>
            </div>
            <h3>Nhìn Lại Dịu Dàng</h3>
            <p>Viết xuống điều đã xảy ra, giải tỏa cảm xúc sâu kín và chắt lọc những bài học ý nghĩa nhất.</p>
            <div className="feature-card-bottom">
              <span>Bắt đầu suy ngẫm</span>
              <span className="arrow-box">↗</span>
            </div>
          </Link>

          <Link className="feature-card-v2 gold" to="/goals">
            <div className="feature-card-top">
              <div className="feature-icon-v2"><Sunrise size={24} /></div>
              <span className="feature-badge">BƯỚC 03</span>
            </div>
            <h3>Viết Tiếp Ngày Mai</h3>
            <p>Đặt từng mục tiêu nhỏ cụ thể và biến ước mơ hy vọng thành hành động tích cực mỗi ngày.</p>
            <div className="feature-card-bottom">
              <span>Lên kế hoạch ngay</span>
              <span className="arrow-box">↗</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── QUOTE PANEL ── */}
      <section className="quote-showcase-box">
        <div className="quote-mark-large">“</div>
        <blockquote>
          Ta không thể viết lại trang đầu tiên của cuộc đời, nhưng luôn có thể bắt đầu từ hôm nay để viết nên một chương mới thật rạng rỡ.
        </blockquote>
        <div className="quote-divider" />
        <span className="quote-author-label">MỘT LỜI NHẮC NHẸ NHÀNG DÀNH CHO BẠN</span>
      </section>

      {/* ── COMMUNITY CALLOUT ── */}
      <section className="community-showcase-card">
        <div className="community-showcase-left">
          <div className="community-showcase-icon">
            <HeartHandshake size={32} />
          </div>
          <div>
            <span className="eyebrow-chip"><Users size={13} /> CỘNG ĐỒNG YÊU THƯƠNG</span>
            <h2>Một không gian biết lắng nghe & sẻ chia</h2>
            <p>Nơi mọi người tôn trọng ranh giới, giữ gìn điều tử tế và lan tỏa những nguồn năng lượng lành mạnh.</p>
          </div>
        </div>
        <Link className="button primary btn-community-join" to="/community">
          Khám phá cộng đồng <span>→</span>
        </Link>
      </section>
    </div>
  )
}

/* ── Main export ── */
export default function HomePage({ user }: { user: User | null }) {
  if (user) return <Dashboard user={user} />
  return <Landing />
}
