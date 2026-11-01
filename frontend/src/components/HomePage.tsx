import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookHeart, HeartHandshake, Leaf, Sparkles, Sunrise, Users, Target, BarChart3,
} from 'lucide-react'
import { User, DashboardStats, fetchDashboardStats } from '../api'

/* ── Feature card ── */
function Feature({ icon, number, title, description, to, tone }: {
  icon: React.ReactNode; number: string; title: string; description: string; to: string; tone: string
}) {
  return (
    <Link className="feature-card" to={to}>
      <div className={`feature-icon ${tone}`}>{icon}</div>
      <span className="feature-number">{number}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="feature-link">Khám phá <span>↗</span></span>
    </Link>
  )
}

/* ── Dashboard (logged-in) ── */
function Dashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="page">
      <section className="dashboard-hero">
        <span className="eyebrow"><Sparkles size={15} /> TỔNG QUAN CỦA BẠN</span>
        <h1>Xin chào, <em>{user.display_name}</em></h1>
        <p className="hero-lede">Mỗi ngày là một cơ hội mới để trân trọng và tiến về phía trước.</p>
      </section>

      {stats && (
        <section className="stats-grid">
          <div className="stat-card peach">
            <div className="stat-icon"><BookHeart size={22} /></div>
            <div className="stat-value">{stats.total_memories}</div>
            <div className="stat-label">Kỷ niệm</div>
          </div>
          <div className="stat-card sage">
            <div className="stat-icon"><Leaf size={22} /></div>
            <div className="stat-value">{stats.total_reflections}</div>
            <div className="stat-label">Suy ngẫm</div>
          </div>
          <div className="stat-card gold">
            <div className="stat-icon"><Target size={22} /></div>
            <div className="stat-value">{stats.total_goals}</div>
            <div className="stat-label">Mục tiêu</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><BarChart3 size={22} /></div>
            <div className="stat-value">{stats.goals_completed}</div>
            <div className="stat-label">Đã hoàn thành</div>
          </div>
        </section>
      )}

      {stats?.recent_memory_title && (
        <section className="recent-highlight">
          <span className="eyebrow">KỶ NIỆM MỚI NHẤT</span>
          <h2>{stats.recent_memory_title}</h2>
          <Link className="button secondary" to="/memories">Xem tất cả ký ức →</Link>
        </section>
      )}

      <section className="quick-actions">
        <span className="eyebrow">HÀNH ĐỘNG NHANH</span>
        <div className="quick-actions-grid">
          <Link className="quick-action-card" to="/memories">
            <BookHeart size={20} />
            <span>Thêm ký ức mới</span>
          </Link>
          <Link className="quick-action-card" to="/reflections">
            <Leaf size={20} />
            <span>Viết suy ngẫm</span>
          </Link>
          <Link className="quick-action-card" to="/goals">
            <Target size={20} />
            <span>Đặt mục tiêu mới</span>
          </Link>
          <Link className="quick-action-card" to="/community">
            <Users size={20} />
            <span>Ghé cộng đồng</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ── Landing page (not logged-in) ── */
function Landing() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={15} /> MỘT NƠI ĐỂ BẮT ĐẦU LẠI</span>
          <h1>Điều đẹp đẽ<br /><em>vẫn xứng đáng được giữ lại.</em></h1>
          <p className="hero-lede">
            Không cần xóa đi những gì đã qua. Ta có thể trân trọng điều tốt đẹp, học từ những điều
            chưa trọn vẹn và dành chỗ cho một ngày mai khác.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/register">Bắt đầu hành trình <span>→</span></Link>
            <Link className="button secondary" to="/community"><Users size={17} /> Ghé thăm cộng đồng</Link>
          </div>
          <div className="gentle-note">
            <span className="note-dot" /> Bạn không cần phải ổn ngay hôm nay. Cứ bắt đầu từ một điều nhỏ.
          </div>
        </div>
        <div className="hero-art" aria-label="Minh họa mặt trời mọc">
          <div className="sun-glow" />
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="art-label">
            <span>01 / EVERY NEW DAY</span>
            <strong>Mọi điều tốt đẹp<br />đều có thể bắt đầu lại.</strong>
          </div>
          <div className="floating-leaf">✳</div>
        </div>
      </section>

      <section className="section-intro">
        <span className="eyebrow">KHÔNG GIAN CỦA BẠN</span>
        <h2>Ba cách để bước tiếp,<br /><em>theo nhịp của riêng mình.</em></h2>
      </section>

      <section className="feature-grid">
        <Feature icon={<BookHeart />} number="01" title="Giữ lại điều đẹp"
          description="Lưu những khoảnh khắc, con người và câu chuyện từng làm trái tim bạn ấm lại."
          to="/memories" tone="peach" />
        <Feature icon={<Leaf />} number="02" title="Nhìn lại dịu dàng"
          description="Viết xuống điều đã xảy ra, điều bạn cảm thấy và bài học muốn mang theo."
          to="/reflections" tone="sage" />
        <Feature icon={<Sunrise />} number="03" title="Viết tiếp ngày mai"
          description="Đặt một mục tiêu nhỏ và biến hy vọng thành hành động có thể thực hiện."
          to="/goals" tone="gold" />
      </section>

      <section className="quote-panel">
        <span className="quote-mark">"</span>
        <blockquote>
          Ta không thể viết lại trang đầu tiên, nhưng có thể bắt đầu từ hôm nay để viết nên một chương mới.
        </blockquote>
        <span className="quote-caption">MỘT LỜI NHẮC NHẸ NHÀNG</span>
      </section>

      <section className="community-banner">
        <div className="community-icon"><HeartHandshake /></div>
        <div>
          <span className="eyebrow">CÙNG NHAU TỐT HƠN</span>
          <h2>Một cộng đồng biết lắng nghe.</h2>
          <p>Chia sẻ điều bạn sẵn lòng chia sẻ. Tôn trọng câu chuyện và ranh giới của nhau.</p>
        </div>
        <Link className="button secondary" to="/community">Khám phá cộng đồng →</Link>
      </section>
    </div>
  )
}

/* ── Main export ── */
export default function HomePage({ user }: { user: User | null }) {
  if (user) return <Dashboard user={user} />
  return <Landing />
}
