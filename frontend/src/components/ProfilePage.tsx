import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import {
  User as UserIcon, KeyRound, Save, Camera, Eye, EyeOff,
  ShieldCheck, Sparkles, Check, ChevronDown, ChevronUp,
  Image as ImageIcon, Trash2
} from 'lucide-react'
import { User, updateProfile, changePassword } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'

// Bộ sưu tập avatar bình yên có sẵn
const PRESET_AVATARS = [
  { label: 'Hoa đào', emoji: '🌸', color: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
  { label: 'Mầm xanh', emoji: '🌿', color: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
  { label: 'Ánh dương', emoji: '☀️', color: 'linear-gradient(135deg, #fff9c4, #ffe082)' },
  { label: 'Bình yên', emoji: '🕊️', color: 'linear-gradient(135deg, #e1f5fe, #b3e5fc)' },
  { label: 'Tách trà', emoji: '🍵', color: 'linear-gradient(135deg, #f1f8e9, #dcedc8)' },
  { label: 'Trăng dịu', emoji: '🌙', color: 'linear-gradient(135deg, #ede7f6, #d1c4e9)' },
  { label: 'Sáng tạo', emoji: '🎨', color: 'linear-gradient(135deg, #fbe9e7, #ffccbc)' },
  { label: 'Mèo con', emoji: '🐱', color: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' },
  { label: 'Hoa hướng dương', emoji: '🌻', color: 'linear-gradient(135deg, #fffde7, #fff59d)' },
  { label: 'Biển êm', emoji: '🌊', color: 'linear-gradient(135deg, #e0f2f1, #b2dfdb)' },
]

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••••••'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return `${name[0]}***@${domain}`
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`
}

export default function ProfilePage({ user, onUserUpdate }: { user: User | null; onUserUpdate: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Ẩn/hiện email
  const [showEmail, setShowEmail] = useState(false)

  // Ẩn/hiện phần bảo mật (mặc định ẩn)
  const [showSecurity, setShowSecurity] = useState(false)

  // Mở bộ chọn avatar
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Mật khẩu
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Xử lý tải ảnh từ máy tính (nén nhẹ dưới dạng data URL)
  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      addToast('Vui lòng chọn ảnh có kích thước dưới 2MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Nén ảnh bằng Canvas để tối ưu kích thước
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 240
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatarUrl(compressedDataUrl)
        setShowAvatarPicker(false)
        addToast('Đã tải ảnh lên! Nhấn "Lưu thay đổi" để cập nhật.', 'info')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Chọn avatar preset
  function selectPreset(emoji: string, color: string) {
    // Tạo SVG data URL hình emoji xinh xắn
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" rx="64" fill="${color.includes('#') ? '#fcedf0' : '#fcedf0'}"/>
        <text x="64" y="78" font-size="64" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${emoji}</text>
      </svg>
    `.trim()
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    setAvatarUrl(dataUrl)
    setShowAvatarPicker(false)
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
      setPwError('Mật khẩu mới không khớp.')
      return
    }
    if (newPw.length < 8) {
      setPwError('Mật khẩu mới cần ít nhất 8 ký tự.')
      return
    }
    setSavingPw(true)
    try {
      await changePassword({ current_password: currentPw, new_password: newPw })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setShowSecurity(false)
      addToast('Mật khẩu đã được đổi thành công!', 'success')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
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
          description="Nơi bình yên để thể hiện cá tính, chăm sóc tâm hồn và quản lý danh tính của riêng bạn."
          icon={<UserIcon size={26} />}
        />

        <div className="profile-layout-wrap">
          {/* ── CARD 1: DANH TÍNH CÁ NHÂN & CHỈNH SỬA TÊN, ẢNH ── */}
          <form className="profile-main-card" onSubmit={handleProfileSave}>
            <div className="profile-header-banner">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-display">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="avatar-img-circle" />
                  ) : (
                    <div className="avatar-initials">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="avatar-change-btn"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title="Đổi ảnh đại diện"
                >
                  <Camera size={16} />
                  <span>Đổi ảnh</span>
                </button>
              </div>

              <div className="profile-summary-info">
                <div className="profile-name-row">
                  <h2>{displayName || 'Chưa đặt tên'}</h2>
                  <span className="profile-status-badge">
                    <Sparkles size={13} /> Thành viên New Beginning
                  </span>
                </div>

                {/* ── ẨN GMAIL TẠO TÀI KHOẢN AN TOÀN ── */}
                <div className="private-email-pill">
                  <div className="email-meta-left">
                    <ShieldCheck size={16} className="shield-icon" />
                    <div>
                      <span className="email-meta-title">Gmail đăng ký (Riêng tư)</span>
                      <strong className="email-meta-addr">
                        {showEmail ? user?.email : maskEmail(user?.email || '')}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="email-toggle-btn"
                    onClick={() => setShowEmail(!showEmail)}
                    title={showEmail ? 'Ẩn địa chỉ Gmail' : 'Hiển thị địa chỉ Gmail'}
                  >
                    {showEmail ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{showEmail ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>

                <p className="privacy-guarantee-note">
                  🔒 Địa chỉ email của bạn được bảo mật tuyệt đối, chỉ dùng để đăng nhập và không bao giờ hiển thị công khai.
                </p>
              </div>
            </div>

            {/* ── BỘ CHỌN ẢNH ĐẠI DIỆN ── */}
            {showAvatarPicker && (
              <div className="avatar-picker-panel">
                <div className="picker-header">
                  <div>
                    <h4>Chọn ảnh đại diện của bạn</h4>
                    <p>Tải ảnh từ máy tính hoặc chọn biểu tượng tâm hồn bình yên</p>
                  </div>
                  <button
                    type="button"
                    className="btn-close-picker"
                    onClick={() => setShowAvatarPicker(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="picker-upload-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={18} />
                    <span>Tải ảnh từ máy tính của bạn</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn-remove-avatar"
                      onClick={() => setAvatarUrl('')}
                      title="Quay về chữ cái đầu"
                    >
                      <Trash2 size={16} />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>

                <div className="preset-grid-title">Hoặc chọn biểu tượng yêu thích:</div>
                <div className="preset-avatar-grid">
                  {PRESET_AVATARS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="preset-avatar-btn"
                      onClick={() => selectPreset(p.emoji, p.color)}
                      title={p.label}
                    >
                      <span className="preset-emoji">{p.emoji}</span>
                      <span className="preset-label">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── FORM CHỈNH SỬA TÊN & TIỂU SỬ ── */}
            <div className="profile-edit-fields">
              <div className="form-group-card">
                <label className="field-label">
                  <span>Tên hiển thị của bạn</span>
                  <span className="char-count">{displayName.length}/80</span>
                </label>
                <input
                  type="text"
                  className="custom-text-input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  minLength={1}
                  maxLength={80}
                  placeholder="Nhập tên bạn muốn mọi người gọi..."
                />
                <small className="field-hint-text">
                  Tên này sẽ hiển thị trên thanh điều hướng, các kỷ niệm chia sẻ và tin nhắn với bạn bè.
                </small>
              </div>

              <div className="form-group-card">
                <label className="field-label">
                  <span>Vài dòng về bản thân (Tiểu sử)</span>
                  <span className="char-count">{bio.length}/500</span>
                </label>
                <textarea
                  className="custom-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Ghi lại một châm ngôn sống, điều bạn trân trọng hoặc lời tự nhủ với bản thân..."
                />
                <small className="field-hint-text">
                  Không bắt buộc. Bạn có thể cập nhật bất cứ lúc nào.
                </small>
              </div>

              <div className="profile-actions-bar">
                <button
                  type="submit"
                  className="button primary btn-save-profile"
                  disabled={savingProfile}
                >
                  <Save size={18} />
                  <span>{savingProfile ? 'Đang lưu thông tin...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* ── CARD 2: PHẦN BẢO MẬT ĐÃ ĐƯỢC ẨN GỌN GÀNG (TOGGLE) ── */}
          <div className="security-collapsed-card">
            <button
              type="button"
              className="security-accordion-btn"
              onClick={() => setShowSecurity(!showSecurity)}
            >
              <div className="accordion-left">
                <div className="sec-icon-circle">
                  <KeyRound size={20} />
                </div>
                <div>
                  <strong>Cài đặt bảo mật & Đổi mật khẩu</strong>
                  <span>{showSecurity ? 'Nhấn để thu gọn lại' : 'Mục bảo mật được ẩn để giữ không gian riêng tư nhẹ nhàng'}</span>
                </div>
              </div>
              <div className="accordion-arrow">
                {showSecurity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {showSecurity && (
              <form className="security-form-drawer" onSubmit={handlePasswordChange}>
                <div className="drawer-inner-grid">
                  <label className="form-group-card">
                    <span className="field-label">Mật khẩu hiện tại</span>
                    <input
                      type="password"
                      className="custom-text-input"
                      value={currentPw}
                      onChange={e => setCurrentPw(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu hiện tại của bạn"
                    />
                  </label>

                  <label className="form-group-card">
                    <span className="field-label">Mật khẩu mới</span>
                    <input
                      type="password"
                      className="custom-text-input"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Ít nhất 8 ký tự an toàn"
                    />
                  </label>

                  <label className="form-group-card">
                    <span className="field-label">Xác nhận mật khẩu mới</span>
                    <input
                      type="password"
                      className="custom-text-input"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Nhập lại chính xác mật khẩu mới"
                    />
                  </label>
                </div>

                {pwError && <p className="error-message" style={{ marginTop: 12 }}>{pwError}</p>}

                <div className="security-drawer-actions">
                  <button
                    type="submit"
                    className="button primary btn-save-pw"
                    disabled={savingPw}
                  >
                    <Check size={18} />
                    <span>{savingPw ? 'Đang cập nhật mật khẩu...' : 'Xác Nhận Đổi Mật Khẩu'}</span>
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => { setShowSecurity(false); setPwError(''); }}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </RequireUser>
  )
}
