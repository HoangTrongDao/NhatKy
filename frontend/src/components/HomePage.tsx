import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookHeart, HeartHandshake, Leaf, Sparkles, Sunrise, Users, Target, BarChart3,
  Download, Smartphone, QrCode, ShieldCheck, CheckCircle2, Camera, Bot,
  Share2, PlusSquare, Zap, Heart, Layers,
  Smile, Star, Lock, Sparkle, Compass
} from 'lucide-react'
import { User, DashboardStats, fetchDashboardStats } from '../api'

/* ── PWA BeforeInstallPrompt Event Definition ── */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

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
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="dash-avatar-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
                />
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

/* ── SVG QR Code Graphic (Crisp & Authentic) ── */
function BrandQRCode() {
  return (
    <div className="qr-visual-card">
      <div className="qr-badge-top">
        <Smartphone size={13} /> QUÉT BẰNG CAMERA ĐIỆN THOẠI
      </div>
      <div className="qr-code-frame">
        <svg
          viewBox="0 0 160 160"
          className="qr-code-svg"
          aria-label="Mã QR tải ứng dụng New Beginning"
        >
          {/* Background */}
          <rect width="160" height="160" rx="14" fill="#ffffff" />
          
          {/* Top-Left Finder */}
          <rect x="14" y="14" width="36" height="36" rx="6" fill="#1a2233" />
          <rect x="20" y="20" width="24" height="24" rx="3" fill="#ffffff" />
          <rect x="25" y="25" width="14" height="14" rx="2" fill="#1a2233" />
          
          {/* Top-Right Finder */}
          <rect x="110" y="14" width="36" height="36" rx="6" fill="#1a2233" />
          <rect x="116" y="20" width="24" height="24" rx="3" fill="#ffffff" />
          <rect x="121" y="25" width="14" height="14" rx="2" fill="#1a2233" />

          {/* Bottom-Left Finder */}
          <rect x="14" y="110" width="36" height="36" rx="6" fill="#1a2233" />
          <rect x="20" y="116" width="24" height="24" rx="3" fill="#ffffff" />
          <rect x="25" y="121" width="14" height="14" rx="2" fill="#1a2233" />

          {/* Data Matrix Modules (Simulated Authentic Pattern) */}
          <g fill="#2b364c">
            {/* Top row dots */}
            <rect x="58" y="16" width="6" height="6" rx="1" />
            <rect x="70" y="16" width="6" height="6" rx="1" />
            <rect x="82" y="16" width="6" height="6" rx="1" />
            <rect x="94" y="16" width="6" height="6" rx="1" />

            <rect x="58" y="28" width="6" height="12" rx="1" />
            <rect x="76" y="28" width="12" height="6" rx="1" />
            <rect x="94" y="28" width="6" height="6" rx="1" />

            <rect x="64" y="44" width="6" height="6" rx="1" />
            <rect x="82" y="44" width="6" height="6" rx="1" />

            {/* Left side column dots */}
            <rect x="16" y="58" width="6" height="6" rx="1" />
            <rect x="28" y="58" width="6" height="12" rx="1" />
            <rect x="16" y="76" width="12" height="6" rx="1" />
            <rect x="34" y="76" width="6" height="6" rx="1" />
            <rect x="16" y="92" width="6" height="6" rx="1" />
            <rect x="28" y="92" width="12" height="6" rx="1" />

            {/* Right side column dots */}
            <rect x="116" y="58" width="6" height="12" rx="1" />
            <rect x="128" y="58" width="12" height="6" rx="1" />
            <rect x="134" y="74" width="6" height="12" rx="1" />
            <rect x="116" y="80" width="12" height="6" rx="1" />
            <rect x="122" y="94" width="6" height="6" rx="1" />
            <rect x="134" y="94" width="12" height="6" rx="1" />

            {/* Bottom row dots */}
            <rect x="58" y="116" width="6" height="12" rx="1" />
            <rect x="70" y="122" width="12" height="6" rx="1" />
            <rect x="90" y="116" width="6" height="6" rx="1" />
            <rect x="102" y="122" width="6" height="12" rx="1" />
            <rect x="76" y="136" width="18" height="6" rx="1" />
            <rect x="60" y="136" width="8" height="6" rx="1" />
            <rect x="102" y="138" width="8" height="6" rx="1" />
            <rect x="120" y="120" width="6" height="6" rx="1" />
            <rect x="132" y="120" width="12" height="6" rx="1" />
            <rect x="126" y="134" width="14" height="6" rx="1" />
          </g>

          {/* Center Brand Badge */}
          <rect x="62" y="62" width="36" height="36" rx="10" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
          <circle cx="80" cy="80" r="12" fill="#1a2233" />
          <path
            d="M76 80 L79 83 L85 76"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <div className="qr-caption">
        <strong>Tương thích 100% iOS & Android</strong>
        <span>Mở camera quét để lưu ứng dụng ngay</span>
      </div>
    </div>
  )
}

/* ── Landing Page (Guest) ── */
function Landing() {
  const [activeConcept, setActiveConcept] = useState<1 | 2 | 3>(1)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installFeedback, setInstallFeedback] = useState<string | null>(null)
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android' | 'pc'>('ios')

  // Concept 1 Interactive Memory Notes State
  const [activeNoteIdx, setActiveNoteIdx] = useState(0)
  const memoryNotes = [
    {
      title: 'Hôm nay mình thi xong rồi... tự hào về bản thân! 🌻',
      time: '21:30 • Phòng riêng',
      mood: 'Nhẹ nhõm & Bình yên',
      quote: 'Dù kết quả thế nào, mình biết mình đã dốc hết 100% nỗ lực.',
      tag: 'Nhật ký tuổi 18'
    },
    {
      title: 'Ước mơ tuổi 19: Tự lập & sống bình yên ✨',
      time: 'Chiều hoàng hôn',
      mood: 'Tràn đầy hy vọng',
      quote: 'Không cần phải chạy đua với ai, bước đi theo nhịp của riêng mình.',
      tag: 'Mục tiêu tương lai'
    },
    {
      title: 'Cảm ơn vì đã luôn ở đây lắng nghe 🤍',
      time: 'Đêm muộn',
      mood: 'Biết ơn sâu sắc',
      quote: 'Cất đi những bộn bề sau cánh cửa, một ngày dài khép lại dịu dàng.',
      tag: 'Riêng tư 100%'
    }
  ]

  // Concept 2 Interactive Locket Moments State
  const [shutterCount, setShutterCount] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const locketMoments = [
    {
      author: 'Quỳnh Anh 🌸',
      time: '2 phút trước',
      caption: 'Vừa qua môn Xác Suất Thống Kê rồi! Chiều nay trà sữa không? 🧋',
      gradient: 'linear-gradient(135deg, #fef08a 0%, #fed7aa 100%)',
      avatar: 'Q'
    },
    {
      author: 'Minh Khang 📸',
      time: '14 phút trước',
      caption: 'Hoàng hôn từ sân thượng ký túc xá đẹp xuất sắc 🌅',
      gradient: 'linear-gradient(135deg, #bae6fd 0%, #fed7aa 100%)',
      avatar: 'K'
    },
    {
      author: 'Bảo Trâm ☕',
      time: '45 phút trước',
      caption: 'Góc học tập ấm áp ngày ôn thi cuối kỳ 📚✨',
      gradient: 'linear-gradient(135deg, #bbf7d0 0%, #fef08a 100%)',
      avatar: 'T'
    }
  ]

  // Concept 3 Interactive AI Prompts State
  const [selectedEmotion, setSelectedEmotion] = useState<number>(0)
  const emotionalPrompts = [
    {
      emotion: 'Âu lo việc học & thi cử 📚',
      prompt: 'Hôm nay điều gì trong việc học khiến bạn thấy nặng lòng nhất?',
      aiResponse:
        'Mình hiểu bạn đang cảm thấy quá tải với bài vở và kỳ thi. Hãy nhớ: điểm số chỉ là một trạm dừng, không phải toàn bộ giá trị của bạn. Hít một hơi thật sâu, uống một ngụm nước ấm, bạn đã làm rất tốt hôm nay rồi! 🌸'
    },
    {
      emotion: 'Chênh vênh định hướng tuổi 20 🍃',
      prompt: 'Có phải bạn đang so sánh bước đi của mình với bạn bè đồng trang lứa?',
      aiResponse:
        'Mỗi đóa hoa đều nở vào mùa của riêng nó. Đừng ép mình phải có câu trả lời hoàn hảo cho 5 năm tới ngay trong đêm nay. Chỉ cần ngày hôm nay bạn thành thật với cảm xúc của mình là đủ. ✨'
    },
    {
      emotion: 'Hạnh phúc giản đơn ☀️',
      prompt: 'Khoảnh khắc nhỏ bé nào hôm nay đã làm bạn bất giác mỉm cười?',
      aiResponse:
        'Những niềm vui nhỏ chính là chiếc neo giữ bình yên cho tâm hồn. Hãy ghi lại thật chi tiết vào nhật ký nhé, để mai này đọc lại bạn sẽ mỉm cười lần nữa! 🌻'
    },
    {
      emotion: 'Cần một khoảng lặng chữa lành 🫂',
      prompt: 'Nếu được nhắn nhủ một câu với chính mình lúc này, bạn muốn nói gì?',
      aiResponse:
        'Không sao cả nếu hôm nay bạn không làm được gì nhiều. Nghỉ ngơi cũng là một dạng tiến bộ. Mình luôn ở đây lắng nghe và không bao giờ phán xét bạn. 🤍'
    }
  ]

  // PWA Install Event Listener & Auto Cleanup
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      setInstallFeedback('Chúc mừng! Ứng dụng đã được cài đặt thành công vào màn hình chính 🎉')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Auto-rotate Concept 1 notes gently every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNoteIdx((prev) => (prev + 1) % memoryNotes.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [memoryNotes.length])

  // Handle PWA Prompt Trigger
  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsInstalled(true)
          setInstallFeedback('Đang thêm ứng dụng vào màn hình chính của bạn...')
        }
        setDeferredPrompt(null)
      } catch (err) {
        scrollToDownloadSection()
      }
    } else {
      // Scroll to instructions and give helpful feedback
      scrollToDownloadSection()
      setInstallFeedback('Vui lòng xem hướng dẫn 3 bước cài đặt PWA siêu tốc bên dưới!')
      setTimeout(() => setInstallFeedback(null), 5000)
    }
  }

  // Scroll to download section helper
  const scrollToDownloadSection = () => {
    const target = document.getElementById('app-download')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Trigger AI Agent popover
  const handleOpenAIAgent = () => {
    window.dispatchEvent(new CustomEvent('open-ai-agent'))
  }

  // Interactive shutter click simulation for Concept 2
  const handleShutterClick = () => {
    setIsFlashing(true)
    setShutterCount((prev) => prev + 1)
    setTimeout(() => {
      setIsFlashing(false)
    }, 300)
  }

  // Marquee Key Features/Skills List
  const marqueeItems = [
    { icon: '🔒', text: 'Bảo mật riêng tư 100%' },
    { icon: '📸', text: 'Khoảnh khắc Locket trực tiếp' },
    { icon: '🤖', text: 'AI Agent lắng nghe & gợi ý viết nhật ký' },
    { icon: '👥', text: 'Kết nối bạn thân không áp lực like' },
    { icon: '🌱', text: 'Viết nhật ký chữa lành' },
    { icon: '🎯', text: 'Lập mục tiêu tuổi 16-22' },
    { icon: '⚡', text: 'Hoạt động mượt mà offline' }
  ]

  return (
    <div className="page landing-page">
      {/* ── TOP CONCEPT SWITCHER PILL ── */}
      <div className="concept-switcher-wrapper">
        <div className="hero-concept-switcher" role="tablist" aria-label="3 Concept Layouts">
          <button
            type="button"
            className={`concept-pill-btn ${activeConcept === 1 ? 'active' : ''}`}
            onClick={() => setActiveConcept(1)}
            aria-selected={activeConcept === 1}
          >
            <Layers size={14} />
            <span>01 • Stripe Tối Giản</span>
          </button>
          <button
            type="button"
            className={`concept-pill-btn ${activeConcept === 2 ? 'active' : ''}`}
            onClick={() => setActiveConcept(2)}
            aria-selected={activeConcept === 2}
          >
            <Camera size={14} />
            <span>02 • Locket & Bạn Bè</span>
          </button>
          <button
            type="button"
            className={`concept-pill-btn ${activeConcept === 3 ? 'active' : ''}`}
            onClick={() => setActiveConcept(3)}
            aria-selected={activeConcept === 3}
          >
            <Bot size={14} />
            <span>03 • AI Đồng Hành</span>
          </button>
        </div>
      </div>

      {/* ── DYNAMIC HERO SECTION (3 CONCEPTS) ── */}
      <section className="landing-hero-container">
        {/* ============================================================== */}
        {/* CONCEPT 1: STRIPE-MINIMALIST (Chuyên nghiệp, thanh lịch, tin cậy) */}
        {/* ============================================================== */}
        {activeConcept === 1 && (
          <div className="hero-grid-concept concept-stripe">
            <div className="hero-content">
              <div className="eyebrow-pill">
                <Sparkles size={13} /> DÀNH RIÊNG CHO LỨA TUỔI 16 ĐẾN 22
              </div>
              <h1 className="hero-title-large">
                Nơi Gen Z cất giữ những điều{' '}
                <span className="hero-highlight-word">không thể nói</span> trên mạng xã hội.
              </h1>
              <p className="hero-subheadline">
                Viết nhật ký riêng tư, lưu giữ kỷ niệm tuổi 16-22 mà không lo phán xét hay áp lực từ
                con số like/view. Được bảo mật tuyệt đối trên thiết bị của bạn.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="button primary btn-hero-primary pwa-trigger-btn"
                  onClick={handlePwaInstall}
                >
                  <Download size={18} />
                  <span>Tải App Ngay (PWA)</span>
                </button>
                <button
                  type="button"
                  className="button secondary btn-hero-secondary"
                  onClick={scrollToDownloadSection}
                >
                  <QrCode size={18} />
                  <span>Quét mã trải nghiệm</span>
                </button>
              </div>

              {/* Conversion Trust Indicators */}
              <div className="hero-trust-row">
                <div className="trust-item">
                  <ShieldCheck size={16} className="trust-icon" />
                  <span>100% Mã hóa riêng tư</span>
                </div>
                <div className="trust-item">
                  <Star size={16} className="trust-icon" />
                  <span>4.9/5 ★ Đánh giá học sinh & sinh viên</span>
                </div>
                <div className="trust-item">
                  <Zap size={16} className="trust-icon" />
                  <span>Cài đặt 2 giây • Không tốn dung lượng</span>
                </div>
              </div>
            </div>

            {/* Visual: Interactive Phone Mockup with floating memory notes */}
            <div className="hero-visual-col">
              <div className="phone-mockup-wrapper">
                {/* Floating Memory Note 1 */}
                <div
                  className={`floating-memory-note note-top-left ${activeNoteIdx === 0 ? 'active' : ''}`}
                  onClick={() => setActiveNoteIdx(0)}
                >
                  <div className="note-pin">🌻</div>
                  <span className="note-tag">Nhật ký tuổi 18</span>
                  <p>"Hôm nay mình thi xong rồi... tự hào về bản thân!"</p>
                </div>

                {/* Floating Memory Note 2 */}
                <div
                  className={`floating-memory-note note-bottom-right ${activeNoteIdx === 1 ? 'active' : ''}`}
                  onClick={() => setActiveNoteIdx(1)}
                >
                  <div className="note-pin">✨</div>
                  <span className="note-tag">Mục tiêu tương lai</span>
                  <p>"Ước mơ tuổi 19: Tự lập & sống bình yên."</p>
                </div>

                {/* Center Phone Frame */}
                <div className="interactive-phone-frame">
                  <div className="phone-notch">
                    <span className="notch-camera" />
                    <span className="notch-speaker" />
                  </div>
                  <div className="phone-screen-content">
                    <div className="phone-status-bar">
                      <span className="phone-time">21:45</span>
                      <div className="phone-icons">
                        <span className="status-dot online" />
                        <span>5G • 100%</span>
                      </div>
                    </div>

                    <div className="phone-app-header">
                      <div className="phone-avatar-chip">NB</div>
                      <div>
                        <strong>Nhật Ký Của Tôi</strong>
                        <span className="phone-date-sub">Thứ Tư, 12 Tháng 11</span>
                      </div>
                    </div>

                    <div className="phone-diary-card">
                      <div className="diary-card-mood">
                        <Smile size={14} />
                        <span>Tâm trạng: Bình yên 🌿</span>
                      </div>
                      <h4 className="diary-card-title">{memoryNotes[activeNoteIdx].title}</h4>
                      <p className="diary-card-body">{memoryNotes[activeNoteIdx].quote}</p>
                      <div className="diary-card-meta">
                        <span>{memoryNotes[activeNoteIdx].time}</span>
                        <span className="diary-lock-badge">
                          <Lock size={11} /> Riêng tư
                        </span>
                      </div>
                    </div>

                    <div className="phone-quick-actions">
                      <span className="phone-action-pill active">
                        <Heart size={12} fill="currentColor" /> Yêu thích
                      </span>
                      <span className="phone-action-pill">
                        <Sparkle size={12} /> Bài học
                      </span>
                      <span className="phone-action-pill">
                        <Camera size={12} /> Ảnh kèm
                      </span>
                    </div>

                    <div className="phone-bottom-bar">
                      <div className="phone-home-indicator" />
                    </div>
                  </div>
                </div>

                {/* Floating Badge Bottom Left */}
                <div className="floating-trust-pill">
                  <span className="pulse-dot" />
                  <strong>12,400+ Gen Z</strong> đang lưu giữ kỷ niệm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONCEPT 2: LOCKET & BẠN BÈ (Ảnh chân thật, squircle viewfinder) */}
        {/* ============================================================== */}
        {activeConcept === 2 && (
          <div className="hero-grid-concept concept-locket">
            <div className="hero-content">
              <div className="eyebrow-pill pill-locket">
                <Camera size={13} /> KHOẢNH KHẮC CHÂN THẬT KHÔNG BỘ LỌC
              </div>
              <h1 className="hero-title-large">
                Thanh xuân trọn vẹn qua từng{' '}
                <span className="hero-highlight-word locket-glow">bức ảnh Locket</span> chân thật.
              </h1>
              <p className="hero-subheadline">
                Chia sẻ khoảnh khắc ảnh tức thì tới những người bạn thân thiết nhất. Không bộ lọc giả
                tạo, không áp lực con số — chỉ có những nụ cười thật tâm và tình bạn thanh xuân rực rỡ.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="button primary btn-hero-primary btn-locket-cta"
                  onClick={handlePwaInstall}
                >
                  <Download size={18} />
                  <span>Tải App Locket Nhật Ký</span>
                </button>
                <button
                  type="button"
                  className="button secondary btn-hero-secondary"
                  onClick={scrollToDownloadSection}
                >
                  <Smartphone size={18} />
                  <span>Xem hướng dẫn cài đặt</span>
                </button>
              </div>

              <div className="hero-trust-row">
                <div className="trust-item">
                  <Users size={16} className="trust-icon" />
                  <span>Nhóm bạn thân 1 - 10 người riêng tư</span>
                </div>
                <div className="trust-item">
                  <Camera size={16} className="trust-icon" />
                  <span>Cập nhật ảnh thẳng lên màn hình chính</span>
                </div>
              </div>
            </div>

            {/* Visual: 3D Squircle Viewfinder & friend moment cards */}
            <div className="hero-visual-col">
              <div className="locket-visual-wrapper">
                {/* 3D Squircle Viewfinder */}
                <div className={`locket-viewfinder-card ${isFlashing ? 'flash-active' : ''}`}>
                  <div className="viewfinder-header">
                    <span className="viewfinder-tag">LOCKET LIVE • THỜI GIAN THỰC</span>
                    <span className="viewfinder-lens-status">
                      <span className="live-pulse" /> LIVE
                    </span>
                  </div>

                  {/* Squircle Viewfinder Lens */}
                  <div className="locket-squircle-lens">
                    <div
                      className="lens-image-layer"
                      style={{
                        background: locketMoments[shutterCount % locketMoments.length].gradient
                      }}
                    >
                      <div className="lens-overlay-decor">
                        <div className="lens-crosshair" />
                        <div className="lens-corner top-left" />
                        <div className="lens-corner top-right" />
                        <div className="lens-corner bottom-left" />
                        <div className="lens-corner bottom-right" />
                      </div>

                      <div className="lens-caption-box">
                        <div className="lens-avatar">
                          {locketMoments[shutterCount % locketMoments.length].avatar}
                        </div>
                        <div className="lens-meta">
                          <strong>{locketMoments[shutterCount % locketMoments.length].author}</strong>
                          <p>{locketMoments[shutterCount % locketMoments.length].caption}</p>
                          <span>{locketMoments[shutterCount % locketMoments.length].time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shutter Button & Controls */}
                  <div className="viewfinder-controls">
                    <span className="control-btn-small">✦ Widget</span>
                    <button
                      type="button"
                      className="shutter-button-outer"
                      onClick={handleShutterClick}
                      aria-label="Chụp khoảnh khắc mới"
                      title="Nhấn để đổi khoảnh khắc bạn bè"
                    >
                      <div className="shutter-button-inner" />
                    </button>
                    <span className="control-btn-small">Bạn bè (3)</span>
                  </div>
                  <div className="shutter-tip-text">
                    👆 Nhấn nút tròn để xem ảnh bạn thân gửi tiếp theo!
                  </div>
                </div>

                {/* Friend Moment Floating Card */}
                <div className="floating-friend-card">
                  <div className="friend-avatar-badge">📸</div>
                  <div>
                    <strong>Minh Khang vừa gửi 1 ảnh</strong>
                    <span className="friend-subtext">Đã ghim lên Widget màn hình chính</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONCEPT 3: AI COMPANION (Thấu cảm, lắng nghe, không phán xét) */}
        {/* ============================================================== */}
        {activeConcept === 3 && (
          <div className="hero-grid-concept concept-ai">
            <div className="hero-content">
              <div className="eyebrow-pill pill-ai">
                <Bot size={13} /> NGƯỜI BẠN TÂM TÌNH TUỔI TRẺ
              </div>
              <h1 className="hero-title-large">
                Có một người bạn luôn{' '}
                <span className="hero-highlight-word ai-glow">lắng nghe, thấu cảm</span> và không
                phán xét.
              </h1>
              <p className="hero-subheadline">
                AI Companion thấu hiểu những bối rối tuổi 16-22, gợi ý viết nhật ký mỗi tối, cùng
                bạn gỡ rối âu lo và chữa lành tâm hồn sau một ngày dài áp lực học tập, thi cử.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="button primary btn-hero-primary btn-ai-cta"
                  onClick={handleOpenAIAgent}
                >
                  <Bot size={18} />
                  <span>Trò chuyện cùng AI Agent</span>
                </button>
                <button
                  type="button"
                  className="button secondary btn-hero-secondary"
                  onClick={handlePwaInstall}
                >
                  <Download size={18} />
                  <span>Cài đặt App</span>
                </button>
              </div>

              <div className="hero-trust-row">
                <div className="trust-item">
                  <Sparkles size={16} className="trust-icon" />
                  <span>Gợi ý viết nhật ký & tự phản tư chữa lành</span>
                </div>
                <div className="trust-item">
                  <ShieldCheck size={16} className="trust-icon" />
                  <span>Dữ liệu AI riêng tư, không lưu trữ thương mại</span>
                </div>
              </div>
            </div>

            {/* Visual: AI reflection card & emotional prompt */}
            <div className="hero-visual-col">
              <div className="ai-companion-wrapper">
                <div className="ai-reflection-card">
                  <div className="ai-card-header">
                    <div className="ai-avatar-glow">
                      <Bot size={20} />
                    </div>
                    <div>
                      <div className="ai-name-row">
                        <strong>New Beginning AI Companion</strong>
                        <span className="ai-status-pill">Sẵn sàng 24/7</span>
                      </div>
                      <span className="ai-helper-desc">Đồng hành cùng cảm xúc tuổi 16-22</span>
                    </div>
                  </div>

                  {/* Emotion Selector Chips */}
                  <div className="ai-emotion-selector">
                    <span className="emotion-label">Bạn đang cảm thấy thế nào?</span>
                    <div className="emotion-chips-row">
                      {emotionalPrompts.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`emotion-chip-btn ${selectedEmotion === idx ? 'selected' : ''}`}
                          onClick={() => setSelectedEmotion(idx)}
                        >
                          {item.emotion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emotion Prompt Question */}
                  <div className="emotional-prompt-box">
                    <div className="prompt-label">
                      <Sparkles size={13} /> GỢI Ý VIẾT NHẬT KÝ HÔM NAY:
                    </div>
                    <p className="prompt-question">
                      "{emotionalPrompts[selectedEmotion].prompt}"
                    </p>
                  </div>

                  {/* AI Response Preview */}
                  <div className="ai-response-preview-box">
                    <div className="ai-speech-bubble">
                      <p>{emotionalPrompts[selectedEmotion].aiResponse}</p>
                    </div>
                    <div className="ai-action-buttons">
                      <Link to="/reflections" className="ai-btn-action">
                        Viết suy ngẫm này vào nhật ký <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="floating-ai-pill">
                  <Sparkles size={14} className="sparkle-spin" />
                  <span>Thấu cảm trong 0.5s • Không phán xét</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── LARGE TYPOGRAPHY & INFINITE MARQUEE ── */}
      <section className="marquee-section-wrapper" aria-label="Tính năng nổi bật">
        <div className="marquee-container">
          <div className="marquee-track">
            {/* First Set */}
            {marqueeItems.map((item, idx) => (
              <div key={`m1-${idx}`} className="marquee-item">
                <span className="marquee-item-icon">{item.icon}</span>
                <span className="marquee-item-text">{item.text}</span>
                <span className="marquee-dot">•</span>
              </div>
            ))}
            {/* Second Duplicate Set for 60fps Seamless Infinite Loop */}
            {marqueeItems.map((item, idx) => (
              <div key={`m2-${idx}`} className="marquee-item">
                <span className="marquee-item-icon">{item.icon}</span>
                <span className="marquee-item-text">{item.text}</span>
                <span className="marquee-dot">•</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEDICATED APP DOWNLOAD SECTION (TỐI ƯU CHUYỂN ĐỔI TẢI APP) ── */}
      <section id="app-download" className="landing-section app-download-section">
        <div className="section-title-center">
          <span className="eyebrow-pill pill-download">
            <Smartphone size={14} /> TRẢI NGHIỆM ĐỈNH CAO TRÊN DI ĐỘNG
          </span>
          <h2>
            Tải Ứng Dụng Trong 3 Giây<br />
            <em>Trải nghiệm mượt mà không tốn dung lượng</em>
          </h2>
          <p className="section-sub">
            Công nghệ PWA (Progressive Web App) tiêu chuẩn quốc tế: mở ngay từ màn hình chính,
            thông báo khoảnh khắc tức thì, hoạt động 100% mượt mà ngay cả khi không có mạng.
          </p>
        </div>

        {installFeedback && (
          <div className="install-feedback-banner">
            <CheckCircle2 size={18} />
            <span>{installFeedback}</span>
          </div>
        )}

        <div className="app-download-grid">
          {/* Left Column: 1-Click PWA Installer & Guidance */}
          <div className="download-cta-card">
            <div className="download-badge-highlight">
              <Zap size={14} /> TỐC ĐỘ CÀI ĐẶT SIÊU NHANH
            </div>
            <h3>Cài đặt trực tiếp vào màn hình chính điện thoại</h3>
            <p className="download-card-desc">
              Không cần thông qua App Store hay Google Play rườm rà. Bạn có thể lưu ứng dụng thành
              app độc lập với icon đẹp mắt chỉ sau 1 chạm.
            </p>

            <div className="one-click-install-box">
              <button
                type="button"
                className="button primary btn-large-download"
                onClick={handlePwaInstall}
              >
                <Download size={22} />
                <div className="btn-download-text">
                  <strong>{isInstalled ? 'ỨNG DỤNG ĐÃ CÀI ĐẶT' : 'CÀI ĐẶT APP NGAY (1 CHẠM)'}</strong>
                  <span>{isInstallable ? 'Sẵn sàng cài đặt trên thiết bị của bạn' : 'PWA Siêu Nhẹ • Miễn Phí 100%'}</span>
                </div>
              </button>
            </div>

            {/* Platform Guidance Switcher */}
            <div className="platform-guide-box">
              <div className="platform-tabs" role="tablist">
                <button
                  type="button"
                  className={`platform-tab-btn ${activePlatformTab === 'ios' ? 'active' : ''}`}
                  onClick={() => setActivePlatformTab('ios')}
                >
                  <Smartphone size={15} /> iPhone / iOS
                </button>
                <button
                  type="button"
                  className={`platform-tab-btn ${activePlatformTab === 'android' ? 'active' : ''}`}
                  onClick={() => setActivePlatformTab('android')}
                >
                  <Smartphone size={15} /> Android
                </button>
                <button
                  type="button"
                  className={`platform-tab-btn ${activePlatformTab === 'pc' ? 'active' : ''}`}
                  onClick={() => setActivePlatformTab('pc')}
                >
                  <Compass size={15} /> Máy Tính / PC
                </button>
              </div>

              {/* Step By Step Guide Content */}
              <div className="platform-step-list">
                {activePlatformTab === 'ios' && (
                  <div className="steps-container">
                    <div className="step-item">
                      <div className="step-num">1</div>
                      <div className="step-info">
                        <strong>Mở bằng trình duyệt Safari</strong>
                        <p>Truy cập trang web New Beginning trên Safari của iPhone hoặc iPad.</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">2</div>
                      <div className="step-info">
                        <strong>Nhấn nút Chia sẻ (Share)</strong>
                        <p>
                          Nhấn vào biểu tượng <Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> ở thanh menu dưới cùng màn hình.
                        </p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">3</div>
                      <div className="step-info">
                        <strong>Chọn "Thêm vào MH chính" (Add to Home Screen)</strong>
                        <p>
                          Cuộn xuống tìm biểu tượng <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> và nhấn <strong>Thêm</strong> ở góc trên bên phải. Xong!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatformTab === 'android' && (
                  <div className="steps-container">
                    <div className="step-item">
                      <div className="step-num">1</div>
                      <div className="step-info">
                        <strong>Nhấn nút Cài Đặt Ngay</strong>
                        <p>Nhấn nút màu xanh "Cài Đặt App Ngay" ở phía trên màn hình.</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">2</div>
                      <div className="step-info">
                        <strong>Xác nhận cài đặt trên Chrome / Cốc Cốc</strong>
                        <p>Hộp thoại hệ thống xuất hiện, chọn <strong>Cài đặt (Install)</strong>.</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">3</div>
                      <div className="step-info">
                        <strong>Bắt đầu sử dụng</strong>
                        <p>Biểu tượng app xuất hiện trên màn hình chính như ứng dụng gốc từ Play Store.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activePlatformTab === 'pc' && (
                  <div className="steps-container">
                    <div className="step-item">
                      <div className="step-num">1</div>
                      <div className="step-info">
                        <strong>Mở Chrome hoặc Microsoft Edge</strong>
                        <p>Nhìn lên thanh địa chỉ góc trên bên phải của trình duyệt.</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">2</div>
                      <div className="step-info">
                        <strong>Nhấn biểu tượng Cài đặt (Màn hình máy tính)</strong>
                        <p>Nhấn vào biểu tượng máy tính có mũi tên hoặc dấu cộng nhỏ trên thanh URL.</p>
                      </div>
                    </div>
                    <div className="step-item">
                      <div className="step-num">3</div>
                      <div className="step-info">
                        <strong>Mở app ở cửa sổ riêng</strong>
                        <p>Ứng dụng sẽ hoạt động độc lập như phần mềm native tốc độ cao.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Value Propositions */}
          <div className="download-qr-card">
            <BrandQRCode />

            <div className="download-specs-grid">
              <div className="spec-card">
                <div className="spec-icon">⚡</div>
                <div className="spec-info">
                  <strong>Dưới 2 MB</strong>
                  <span>Siêu nhẹ, không tốn bộ nhớ máy</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">🛡️</div>
                <div className="spec-info">
                  <strong>Không quảng cáo</strong>
                  <span>Tôn trọng không gian riêng tư của bạn</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">📶</div>
                <div className="spec-info">
                  <strong>Hỗ trợ Offline</strong>
                  <span>Viết nhật ký mượt mà ngay cả khi mất mạng</span>
                </div>
              </div>
              <div className="spec-card">
                <div className="spec-icon">🔔</div>
                <div className="spec-info">
                  <strong>Thông báo êm dịu</strong>
                  <span>Nhắc nhở nhẹ nhàng mỗi buổi tối</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 TRỤ CỘT CỐT LÕI (KÝ ỨC • NHÌN LẠI • MỤC TIÊU) ── */}
      <section className="landing-section">
        <div className="section-title-center">
          <span className="eyebrow-pill">
            <Leaf size={14} /> 3 BƯỚC ĐỒNG HÀNH
          </span>
          <h2>
            Ba cách dịu dàng để bước tiếp<br />
            <em>theo nhịp điệu của riêng bạn</em>
          </h2>
          <p className="section-sub">
            Mỗi tính năng được thiết kế nâng đỡ cảm xúc và định hướng tương lai cho lứa tuổi 16-22.
          </p>
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
          Ta không thể viết lại trang đầu tiên của cuộc đời, nhưng luôn có thể bắt đầu từ hôm nay
          để viết nên một chương mới thật rạng rỡ.
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
            <span className="eyebrow-chip">
              <Users size={13} /> CỘNG ĐỒNG YÊU THƯƠNG
            </span>
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
