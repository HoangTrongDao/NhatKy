import { useEffect, useState, useCallback, FormEvent, ChangeEvent, useRef } from 'react'
import { Target, Pencil, Camera, X, ZoomIn, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { api, User, Goal, compressImageDataUrl } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import ConfirmDialog from './ConfirmDialog'
import SkeletonCards from './SkeletonCards'

const PAGE_SIZE = 20

export default function GoalsPage({ user }: { user: User | null }) {
  const [items, setItems] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  /* ── Photo state (Create) ── */
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement | null>(null)

  /* ── Lightbox state ── */
  const [lightboxItem, setLightboxItem] = useState<Goal | null>(null)

  const { addToast } = useToast()

  const load = useCallback(async (append = false, offset = 0) => {
    try {
      if (!append) setLoading(true)
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      const data = await api<Goal[]>(`/goals?${params}`)
      setItems(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE_SIZE)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được mục tiêu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (user) void load() }, [user, load])

  const handleFile = async (e: ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const raw = reader.result as string
        const optimized = await compressImageDataUrl(raw, 1080, 0.85)
        if (isEdit) {
          setEditImageUrl(optimized)
        } else {
          setImageUrl(optimized)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      addToast('Không thể đọc tệp ảnh này.', 'error')
    } finally {
      e.target.value = ''
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setBusy(true); setError('')
    const d = new FormData(form)
    try {
      await api('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: d.get('title'),
          description: d.get('description'),
          target_date: d.get('target_date') || null,
          image_url: imageUrl || null,
        }),
      })
      form.reset()
      setImageUrl(null)
      addToast('Mục tiêu đã được thêm!', 'success')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được.')
    } finally {
      setBusy(false)
    }
  }

  async function updateStatus(item: Goal, status: Goal['status']) {
    try {
      await api(`/goals/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      const label = status === 'completed' ? 'Đã đánh dấu hoàn thành!' : 'Đã cập nhật trạng thái!'
      addToast(label, 'success')
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không cập nhật được.', 'error')
    }
  }

  async function remove(id: number) {
    try {
      await api(`/goals/${id}`, { method: 'DELETE' })
      addToast('Đã xóa mục tiêu.', 'info')
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không xóa được.', 'error')
    }
  }

  function startEdit(item: Goal) {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditDesc(item.description)
    setEditDate(item.target_date || '')
    setEditImageUrl(item.image_url || null)
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editingId === null) return
    setEditBusy(true)
    try {
      await api(`/goals/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          target_date: editDate || null,
          image_url: editImageUrl || null,
        }),
      })
      setEditingId(null)
      addToast('Đã cập nhật mục tiêu!', 'success')
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không cập nhật được.', 'error')
    } finally {
      setEditBusy(false)
    }
  }

  return (
    <RequireUser user={user}>
      <div className="page subpage">
        <PageHeader
          eyebrow="TRANG NGÀY MAI"
          title="Một bước nhỏ cũng là tiến về phía trước."
          description="Bạn không cần thay đổi tất cả trong một ngày. Chọn một điều đủ nhỏ để có thể bắt đầu."
          icon={<Target />}
        />

        <div className="content-grid">
          {/* ── Create form ── */}
          <form className="editor-card" onSubmit={submit}>
            <span className="eyebrow">GIEO MỘT HẠT GIỐNG</span>
            <h2>Điều mình muốn xây dựng.</h2>

            <label>Mục tiêu
              <input name="title" required maxLength={160} placeholder="Ví dụ: Chủ động lắng nghe hơn" />
            </label>

            <label>Mình sẽ làm thế nào?
              <textarea name="description" rows={4} maxLength={10000} placeholder="Một hành động nhỏ có thể thực hiện trong tuần này." />
            </label>

            <label>Ngày dự kiến
              <input name="target_date" type="date" />
            </label>

            {/* ── Locket / Vision Board Photo Attachment ── */}
            <div className="locket-attachment-section" style={{ margin: '14px 0' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => void handleFile(e, false)}
              />

              {imageUrl ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 220, aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden', border: '2px solid var(--line)', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                  <img src={imageUrl} alt="Đính kèm" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Gỡ ảnh"
                  >
                    <X size={15} />
                  </button>
                  <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                    Ảnh Locket / Bảng tầm nhìn
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="button secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'auto', padding: '8px 14px', fontSize: 13 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={16} />
                  <span>Chụp / Đính kèm ảnh Locket</span>
                </button>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}
            <button className="button primary full" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Thêm mục tiêu'}
            </button>
          </form>

          {/* ── List ── */}
          <div className="list-panel">
            <div className="list-heading">
              <h2>Điều mình đang vun đắp</h2>
              <span>{items.length} mục</span>
            </div>

            {loading ? (
              <SkeletonCards />
            ) : items.length === 0 ? (
              <EmptyCard title="Tương lai chưa cần có mọi câu trả lời" text="Chỉ cần chọn một điều bạn muốn thử làm khác đi." />
            ) : (
              <>
                {items.map(item =>
                  editingId === item.id ? (
                    <form key={item.id} className="data-card editing" onSubmit={saveEdit}>
                      <label>Mục tiêu
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required maxLength={160} />
                      </label>
                      <label>Cách thực hiện
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} maxLength={10000} />
                      </label>
                      <label>Ngày dự kiến
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                      </label>

                      {/* Edit photo */}
                      <div style={{ margin: '12px 0' }}>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => void handleFile(e, true)}
                        />
                        {editImageUrl ? (
                          <div style={{ position: 'relative', width: 140, height: 140, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)' }}>
                            <img src={editImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setEditImageUrl(null)}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              title="Gỡ ảnh"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button secondary small"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            onClick={() => editFileInputRef.current?.click()}
                          >
                            <Camera size={14} />
                            <span>Thêm ảnh Locket</span>
                          </button>
                        )}
                      </div>

                      <div className="edit-actions">
                        <button type="button" className="button secondary" onClick={() => setEditingId(null)}>Hủy</button>
                        <button type="submit" className="button primary" disabled={editBusy}>
                          {editBusy ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <article className="data-card goal-card" key={item.id}>
                      <div className="data-card-top">
                        <span className={`status-tag ${item.status}`}>
                          {item.status === 'completed' ? 'Hoàn thành' : item.status === 'in_progress' ? 'Đang thực hiện' : 'Dự định'}
                        </span>
                        <div className="card-actions">
                          <button className="text-button" onClick={() => startEdit(item)}><Pencil size={13} /> Sửa</button>
                          <ConfirmDialog title="Xóa mục tiêu" message="Bạn có chắc muốn xóa mục tiêu này?" onConfirm={() => remove(item.id)}>
                            {(open) => <button className="text-button danger" onClick={open}><Trash2 size={13} /> Xóa</button>}
                          </ConfirmDialog>
                        </div>
                      </div>

                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      {item.target_date && <small>Dự kiến: {item.target_date}</small>}

                      {/* ── Locket / Vision Board Photo Widget ── */}
                      {item.image_url && (
                        <div
                          className="locket-card-widget"
                          style={{ marginTop: 14, cursor: 'pointer', maxWidth: 300, aspectRatio: '1/1' }}
                          onClick={() => setLightboxItem(item)}
                          title="Nhấp để phóng to ảnh Locket"
                        >
                          <img src={item.image_url} alt="" className="locket-widget-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div className="locket-zoom-hint">
                            <ZoomIn size={14} /> <span>Xem ảnh Locket</span>
                          </div>
                        </div>
                      )}

                      <div className="goal-actions" style={{ marginTop: 14 }}>
                        {item.status !== 'in_progress' && (
                          <button className="button small secondary" onClick={() => void updateStatus(item, 'in_progress')}>
                            <Clock size={13} /> Đang thực hiện
                          </button>
                        )}
                        {item.status !== 'completed' && (
                          <button className="button small primary" onClick={() => void updateStatus(item, 'completed')}>
                            <CheckCircle2 size={13} /> Đánh dấu hoàn thành ✓
                          </button>
                        )}
                      </div>
                    </article>
                  )
                )}

                {hasMore && (
                  <button className="button secondary full load-more" onClick={() => void load(true, items.length)}>
                    Tải thêm…
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Lightbox Modal ── */}
        {lightboxItem && lightboxItem.image_url && (
          <div className="locket-lightbox-overlay" onClick={() => setLightboxItem(null)}>
            <div className="locket-lightbox-card" onClick={e => e.stopPropagation()}>
              <button className="locket-lightbox-close" onClick={() => setLightboxItem(null)} aria-label="Đóng">
                <X size={20} />
              </button>
              <div className="locket-lightbox-photo-wrap">
                <img src={lightboxItem.image_url} alt="" className="locket-lightbox-img" />
              </div>
              <div className="locket-lightbox-details">
                <div className="locket-lightbox-header">
                  <h3>{lightboxItem.title}</h3>
                  <span className={`status-tag ${lightboxItem.status}`}>
                    {lightboxItem.status === 'completed' ? 'Hoàn thành' : lightboxItem.status === 'in_progress' ? 'Đang thực hiện' : 'Dự định'}
                  </span>
                </div>
                {lightboxItem.description && (
                  <p className="locket-lightbox-story">
                    {lightboxItem.description}
                  </p>
                )}
                {lightboxItem.target_date && (
                  <p className="locket-lightbox-story" style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Dự kiến: {lightboxItem.target_date}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireUser>
  )
}
