import { useState, FormEvent } from 'react'
import { User as UserIcon, KeyRound, Save } from 'lucide-react'
import { User, updateProfile, changePassword } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'

export default function ProfilePage({ user, onUserUpdate }: { user: User | null; onUserUpdate: (u: User) => void }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')

  const { addToast } = useToast()

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await updateProfile({ display_name: displayName, bio })
      onUserUpdate(updated)
      addToast('Hồ sơ đã được cập nhật!', 'success')
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
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      addToast('Mật khẩu đã được đổi thành công!', 'success')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <RequireUser user={user}>
      <div className="page subpage">
        <PageHeader
          eyebrow="HỒ SƠ CÁ NHÂN"
          title="Không gian của riêng bạn."
          description="Cập nhật thông tin hiển thị và bảo mật tài khoản."
          icon={<UserIcon />}
        />

        <div className="profile-grid">
          {/* ── Profile info ── */}
          <form className="editor-card" onSubmit={handleProfileSave}>
            <span className="eyebrow">THÔNG TIN CÁ NHÂN</span>
            <h2>Về bạn</h2>

            <div className="profile-avatar-section">
              <div className="avatar large">{user?.display_name?.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{user?.display_name}</strong>
                <small>{user?.email}</small>
                {user?.created_at && (
                  <small>Tham gia từ {new Date(user.created_at).toLocaleDateString('vi-VN')}</small>
                )}
              </div>
            </div>

            <label>Tên hiển thị
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                required minLength={1} maxLength={80} placeholder="Tên bạn muốn mọi người gọi" />
            </label>
            <label>Giới thiệu bản thân
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                rows={4} maxLength={500} placeholder="Một vài dòng về bạn… (không bắt buộc)" />
            </label>
            <button className="button primary full" disabled={savingProfile}>
              <Save size={16} /> {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </form>

          {/* ── Change password ── */}
          <form className="editor-card" onSubmit={handlePasswordChange}>
            <span className="eyebrow">BẢO MẬT</span>
            <h2><KeyRound size={20} /> Đổi mật khẩu</h2>
            <label>Mật khẩu hiện tại
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                required placeholder="Nhập mật khẩu hiện tại" />
            </label>
            <label>Mật khẩu mới
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                required minLength={8} maxLength={128} placeholder="Ít nhất 8 ký tự" />
            </label>
            <label>Xác nhận mật khẩu mới
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                required minLength={8} maxLength={128} placeholder="Nhập lại mật khẩu mới" />
            </label>
            {pwError && <p className="error-message">{pwError}</p>}
            <button className="button primary full" disabled={savingPw}>
              <KeyRound size={16} /> {savingPw ? 'Đang đổi…' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </RequireUser>
  )
}
