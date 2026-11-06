import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import {
  User as UserIcon, KeyRound, Save, Camera, Eye, EyeOff,
  ShieldCheck, Sparkles, Check, ChevronDown, ChevronUp,
  Image as ImageIcon, Trash2, Calendar,
  X, RotateCcw, Lock, Edit3
} from 'lucide-react'
import { User, updateProfile, changePassword, fetchDashboardStats, DashboardStats } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'

// Bộ sưu tập avatar bình yên có sẵn
const PRESET_AVATARS = [
  { label: 'Hoa đào', emoji: '🌸', color: '#fce4ec' },
  { label: 'Mầm xanh', emoji: '🌿', color: '#e8f5e9' },
  { label: 'Ánh dương', emoji: '☀️', color: '#fff9c4' },
  { label: 'Bình yên', emoji: '🕊️', color: '#e1f5fe' },
  { label: 'Tách trà', emoji: '🍵', color: '#f1f8e9' },
  { label: 'Trăng dịu', emoji: '🌙', color: '#ede7f6' },
  { label: 'Sáng tạo', emoji: '🎨', color: '#fbe9e7' },
  { label: 'Mèo con', emoji: '🐱', color: '#fff3e0' },
  { label: 'Hoa hướng dương', emoji: '🌻', color: '#fffde7' },
  { label: 'Biển êm', emoji: '🌊', color: '#e0f2f1' },
  { label: 'Cánh diều', emoji: '🪁', color: '#f3e5f5' },
  { label: 'Ngôi sao', emoji: '⭐', color: '#fff8e1' },
]

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••••••'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return `${name[0]}***@${domain}`
  return `${name.slice(0, 2)}••••${name.slice(-1)}@${domain}`
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
  } catch {
    return ''
  }
}

export default function ProfilePage({ user, onUserUpdate }: { user: User | null; onUserUpdate: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Ẩn/hiện email
  const [showEmail, setShowEmail] = useState(false)

  // Ẩn/hiện phần bảo mật (mặc định ẩn)
  const [showSecurity, setShowSecurity] = useState(false)

  // Modal chọn avatar
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Mật khẩu
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Kiểm tra xem form có đang bị sửa đổi không
  const isDirty = displayName !== (user?.display_name || '') ||
                  bio !== (user?.bio || '') ||
                  avatarUrl !== (user?.avatar_url || '')

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatar_url || '')
      fetchDashboardStats()
        .then(setStats)
        .catch(() => {})
    }
  }, [user])

  function handleReset() {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatar_url || '')
      addToast('Đã khôi phục thông tin ban đầu.', 'info')
    }
  }

  // Xử lý tải ảnh từ máy tính (nén nhẹ dưới dạng data URL JPEG)
  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      addToast('Vui lòng chọn ảnh có kích thước dưới 3MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const SIZE = 240
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        // Cắt vuông ở giữa ảnh để avatar luôn tròn xoe hoàn hảo, không bị méo hay giãn
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatarUrl(compressedDataUrl)
        setShowAvatarPicker(false)
        addToast('Đã chọn ảnh mới! Nhớ nhấn "Lưu Thay Đổi" để hoàn tất.', 'info')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Chọn avatar preset
  function selectPreset(emoji: string, color: string) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" rx="64" fill="${color}"/>
        <text x="64" y="78" font-size="64" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>
      </svg>
    `.trim()
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    setAvatarUrl(dataUrl)
    setShowAvatarPicker(false)
    addToast(`Đã chọn biểu tượng ${emoji}! Nhấn "Lưu Thay Đổi" để cập nhật.`, 'info')
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl
      })
      onUserUpdate(updated)
      addToast('Không gian cá nhân đã được lưu thành công!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Không cập nhật được hồ sơ.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) {
      setPwError('Mật khẩu mới không trùng khớp.')
      return
    }
    if (newPw.length < 8) {
      setPwError('Mật khẩu mới cần tối thiểu 8 ký tự.')
      return
    }
    setSavingPw(true)
    try {
      await changePassword({ current_password: currentPw, new_password: newPw })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setShowSecurity(false)
      addToast('Đổi mật khẩu thành công! Tài khoản của bạn luôn được bảo vệ an toàn.', 'success')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Không đổi được mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <RequireUser user={user}>
      <div className="page subpage profile-page-container">
        <PageHeader
          eyebrow="KHÔNG GIAN RIÊNG TƯ"
          title="Không gian riêng tư của bạn."
          description="Nơi bình yên để thể hiện bản sắc, chăm sóc tâm hồn và quản lý danh tính của riêng bạn."
          icon={<UserIcon size={26} />}
        />

        <div className="profile-dashboard-layout">
          {/* ══════════════════════════════════════════════════════
              CỘT TRÁI: THẺ DANH TÍNH CÁ NHÂN & CỘT MỐC ĐỒNG HÀNH
              ══════════════════════════════════════════════════════ */}
          <aside className="profile-identity-card">
            {/* Banner nghệ thuật ấm áp */}
            <div className="profile-cover-banner">
              <span className="cover-badge">
                <Sparkles size={13} /> Thành viên New Beginning
              </span>
            </div>

            {/* Khung avatar trung tâm với nút đổi ảnh */}
            <div className="profile-avatar-center-wrap">
              <div
                className="profile-avatar-circle"
                onClick={() => setShowAvatarPicker(true)}
                title="Nhấn để đổi ảnh đại diện"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-img-circle" />
                ) : (
                  <div className="avatar-initials">
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="avatar-hover-overlay">
                  <Camera size={20} />
                  <span>Đổi ảnh</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-trigger-picker"
                onClick={() => setShowAvatarPicker(true)}
              >
                <Camera size={14} />
                <span>Đổi ảnh đại diện</span>
              </button>
            </div>

            {/* Thông tin tên & tiểu sử tóm tắt */}
            <div className="identity-text-meta">
              <h2 className="identity-name">{displayName || 'Chưa đặt tên'}</h2>
              {bio ? (
                <p className="identity-bio">"{bio}"</p>
              ) : (
                <p className="identity-bio-empty">Chưa có lời tự nhủ hay châm ngôn sống...</p>
              )}
            </div>

            {/* Thẻ Gmail được ẩn & bảo mật an toàn */}
            <div className="identity-private-email-box">
              <div className="email-box-header">
                <div className="email-box-title">
                  <ShieldCheck size={16} className="shield-icon" />
                  <span>GMAIL ĐĂNG KÝ (BẢO MẬT)</span>
                </div>
                <button
                  type="button"
                  className="btn-email-toggle"
                  onClick={() => setShowEmail(!showEmail)}
                  title={showEmail ? 'Ẩn địa chỉ email' : 'Hiện địa chỉ email'}
                >
                  {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showEmail ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>

              <div className="email-box-value">
                <code>{showEmail ? user?.email : maskEmail(user?.email || '')}</code>
              </div>

              <p className="email-box-notice">
                🔒 Địa chỉ này được ẩn bảo mật, không bao giờ hiển thị công khai.
              </p>
            </div>

            {/* Cột mốc & thành tựu đồng hành */}
            <div className="identity-milestones-card">
              <div className="milestone-title">
                <Calendar size={15} />
                <span>Hành trình cá nhân</span>
              </div>

              <div className="milestone-stats-row">
                <div className="mini-stat-item">
                  <span className="mini-stat-num">{stats?.days_since_joined ?? 1}</span>
                  <span className="mini-stat-label">Ngày gắn bó</span>
                </div>
                <div className="mini-stat-item">
                  <span className="mini-stat-num">{stats?.total_memories ?? 0}</span>
                  <span className="mini-stat-label">Kỷ niệm</span>
                </div>
                <div className="mini-stat-item">
                  <span className="mini-stat-num">{stats?.total_goals ?? 0}</span>
                  <span className="mini-stat-label">Mục tiêu</span>
                </div>
                <div className="mini-stat-item">
                  <span className="mini-stat-num">{stats?.total_reflections ?? 0}</span>
                  <span className="mini-stat-label">Chiêm nghiệm</span>
                </div>
              </div>

              {user?.created_at && (
                <div className="milestone-footer">
                  <span>Gia nhập từ {formatDate(user.created_at)}</span>
                </div>
              )}
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════
              CỘT PHẢI: FORM CHỈNH SỬA & KHU VỰC BẢO MẬT GỌN GÀNG
              ══════════════════════════════════════════════════════ */}
          <main className="profile-main-content">
            {/* Form chỉnh sửa tên & tiểu sử */}
            <form className="profile-edit-section-card" onSubmit={handleProfileSave}>
              <div className="card-section-header">
                <div>
                  <span className="section-eyebrow">
                    <Edit3 size={14} /> CHỈNH SỬA HỒ SƠ
                  </span>
                  <h3 className="section-title">Thông tin & Diện mạo của bạn</h3>
                </div>
                {isDirty && (
                  <span className="badge-modified-pill">Có thay đổi chưa lưu</span>
                )}
              </div>

              <div className="form-fields-stack">
                {/* Tên hiển thị */}
                <div className="enhanced-form-group">
                  <label className="enhanced-field-label">
                    <span className="label-with-icon">
                      <UserIcon size={16} /> Tên hiển thị của bạn
                    </span>
                    <span className="char-badge">{displayName.length}/80</span>
                  </label>
                  <input
                    type="text"
                    className="enhanced-input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    minLength={1}
                    maxLength={80}
                    placeholder="Nhập tên gọi thân thương của bạn..."
                  />
                  <span className="enhanced-hint">
                    Tên này xuất hiện trên thanh điều hướng, các bài viết chia sẻ và cuộc trò chuyện với bạn bè.
                  </span>
                </div>

                {/* Tiểu sử */}
                <div className="enhanced-form-group">
                  <label className="enhanced-field-label">
                    <span className="label-with-icon">
                      <Sparkles size={16} /> Vài dòng về bản thân (Tiểu sử)
                    </span>
                    <span className="char-badge">{bio.length}/500</span>
                  </label>
                  <textarea
                    className="enhanced-textarea"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Viết một lời tự nhủ, câu châm ngôn bạn yêu thích hoặc điều bạn đang hướng tới..."
                  />
                  <span className="enhanced-hint">
                    Không bắt buộc. Hãy viết những điều mang lại cho bạn sự an yên và động lực.
                  </span>
                </div>

                {/* Xem trước diện mạo trực quan */}
                <div className="live-preview-box">
                  <span className="preview-label">Xem trước giao diện khi người khác thấy bạn:</span>
                  <div className="preview-card-inner">
                    <div className="preview-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="avatar-img-circle" />
                      ) : (
                        <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    <div className="preview-info">
                      <div className="preview-name">{displayName || 'Chưa đặt tên'}</div>
                      <div className="preview-bio">{bio || 'Chưa có tiểu sử cá nhân'}</div>
                    </div>
                  </div>
                </div>

                {/* Hàng nút hành động dạng nổi */}
                <div className="enhanced-actions-bar">
                  {isDirty && (
                    <button
                      type="button"
                      className="button secondary btn-reset-changes"
                      onClick={handleReset}
                      disabled={savingProfile}
                    >
                      <RotateCcw size={16} />
                      <span>Khôi phục</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="button primary btn-floating-save"
                    disabled={savingProfile}
                  >
                    <Save size={18} />
                    <span>{savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* ── MỤC BẢO MẬT & ĐỔI MẬT KHẨU ĐƯỢC ẨN GỌN GÀNG (ACCORDION) ── */}
            <div className="security-accordion-wrapper">
              <button
                type="button"
                className="security-toggle-header-btn"
                onClick={() => setShowSecurity(!showSecurity)}
                aria-expanded={showSecurity}
              >
                <div className="sec-btn-left">
                  <div className="sec-icon-circle-v2">
                    <Lock size={18} />
                  </div>
                  <div>
                    <strong className="sec-title-text">Cài đặt bảo mật & Đổi mật khẩu</strong>
                    <span className="sec-subtitle-text">
                      {showSecurity
                        ? 'Nhấn để thu gọn lại'
                        : 'Mục bảo mật được ẩn để giữ không gian riêng tư luôn thanh thoát, nhẹ nhàng'}
                    </span>
                  </div>
                </div>
                <div className="sec-btn-arrow">
                  {showSecurity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {showSecurity && (
                <form className="security-drawer-content" onSubmit={handlePasswordChange}>
                  <p className="security-intro-text">
                    Mật khẩu của bạn được mã hóa an toàn một chiều. Chỉ đổi mật khẩu khi bạn thực sự cần thiết hoặc nghi ngờ tài khoản bị lộ.
                  </p>

                  <div className="security-fields-stack">
                    <div className="enhanced-form-group">
                      <label className="enhanced-field-label">
                        <span className="label-with-icon">
                          <KeyRound size={15} /> Mật khẩu hiện tại
                        </span>
                      </label>
                      <div className="input-with-eye-wrap">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          className="enhanced-input"
                          value={currentPw}
                          onChange={e => setCurrentPw(e.target.value)}
                          required
                          placeholder="Nhập mật khẩu bạn đang dùng"
                        />
                        <button
                          type="button"
                          className="btn-eye-inner"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                        >
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="security-two-cols">
                      <div className="enhanced-form-group">
                        <label className="enhanced-field-label">
                          <span className="label-with-icon">
                            <Lock size={15} /> Mật khẩu mới
                          </span>
                        </label>
                        <div className="input-with-eye-wrap">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            className="enhanced-input"
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            required
                            minLength={8}
                            maxLength={128}
                            placeholder="Tối thiểu 8 ký tự"
                          />
                          <button
                            type="button"
                            className="btn-eye-inner"
                            onClick={() => setShowNewPw(!showNewPw)}
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="enhanced-form-group">
                        <label className="enhanced-field-label">
                          <span className="label-with-icon">
                            <Check size={15} /> Nhập lại mật khẩu mới
                          </span>
                        </label>
                        <input
                          type="password"
                          className="enhanced-input"
                          value={confirmPw}
                          onChange={e => setConfirmPw(e.target.value)}
                          required
                          minLength={8}
                          maxLength={128}
                          placeholder="Xác nhận lại mật khẩu mới"
                        />
                      </div>
                    </div>

                    {pwError && <div className="error-alert-box">{pwError}</div>}

                    <div className="security-actions-row">
                      <button
                        type="submit"
                        className="button primary btn-confirm-pw"
                        disabled={savingPw}
                      >
                        <Check size={18} />
                        <span>{savingPw ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}</span>
                      </button>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          setShowSecurity(false)
                          setPwError('')
                          setCurrentPw('')
                          setNewPw('')
                          setConfirmPw('')
                        }}
                      >
                        Thu gọn lại
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </main>
        </div>

        {/* ══════════════════════════════════════════════════════
            MODAL CHỌN ẢNH ĐẠI DIỆN HIỆN ĐẠI (POPUP DIALOG)
            ══════════════════════════════════════════════════════ */}
        {showAvatarPicker && (
          <div className="avatar-modal-backdrop" onClick={() => setShowAvatarPicker(false)}>
            <div className="avatar-modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-top-bar">
                <div className="modal-title-group">
                  <div className="modal-icon-badge">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h4>Chọn ảnh đại diện của bạn</h4>
                    <p>Tải ảnh cá nhân từ máy hoặc chọn linh vật tâm hồn</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setShowAvatarPicker(false)}
                  title="Đóng hộp thoại"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lựa chọn 1: Tải từ máy tính */}
              <div className="modal-upload-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-box-icon">
                    <ImageIcon size={28} />
                  </div>
                  <div className="upload-box-text">
                    <strong>Tải ảnh lên từ máy tính</strong>
                    <span>Hỗ trợ JPG, PNG (tối đa 3MB, tự động tối ưu hóa)</span>
                  </div>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    className="btn-remove-avatar-modal"
                    onClick={() => {
                      setAvatarUrl('')
                      setShowAvatarPicker(false)
                      addToast('Đã xóa ảnh tùy chỉnh. Nhớ nhấn "Lưu Thay Đổi".', 'info')
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Xóa ảnh hiện tại</span>
                  </button>
                )}
              </div>

              {/* Lựa chọn 2: Biểu tượng cảm xúc có sẵn */}
              <div className="modal-preset-section">
                <div className="preset-section-header">
                  <span>Hoặc chọn biểu tượng tâm hồn yêu thích:</span>
                </div>
                <div className="modal-presets-grid">
                  {PRESET_AVATARS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="preset-circle-btn"
                      style={{ background: p.color }}
                      onClick={() => selectPreset(p.emoji, p.color)}
                      title={p.label}
                    >
                      <span className="preset-emoji-icon">{p.emoji}</span>
                      <span className="preset-tooltip">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireUser>
  )
}
