import { useEffect, useState, useCallback, FormEvent, ChangeEvent, useRef } from 'react'
import { Leaf, Pencil, Camera, X, ZoomIn, Trash2 } from 'lucide-react'
import { api, User, Reflection, compressImageDataUrl } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import ConfirmDialog from './ConfirmDialog'
import SkeletonCards from './SkeletonCards'

const PAGE_SIZE = 20

export default function ReflectionsPage({ user }: { user: User | null }) {
  const [items, setItems] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  /* ── Photo state (Create) ── */
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSituation, setEditSituation] = useState('')
  const [editFeelings, setEditFeelings] = useState('')
  const [editLesson, setEditLesson] = useState('')
  const [editClosure, setEditClosure] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement | null>(null)

  /* ── Lightbox state ── */
  const [lightboxItem, setLightboxItem] = useState<Reflection | null>(null)

  const { addToast } = useToast()

  const load = useCallback(async (append = false, offset = 0) => {
    try {
      if (!append) setLoading(true)
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      const data = await api<Reflection[]>(`/reflections?${params}`)
      setItems(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE_SIZE)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
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
      await api('/reflections', {
        method: 'POST',
        body: JSON.stringify({
          situation: d.get('situation'),
          feelings: d.get('feelings'),
          lesson: d.get('lesson'),
          closure_note: d.get('closure_note'),
          image_url: imageUrl || null,
        }),
      })
      form.reset()
      setImageUrl(null)
      addToast('Ghi chép đã được lưu!', 'success')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    try {
      await api(`/reflections/${id}`, { method: 'DELETE' })
      addToast('Đã xóa ghi chép.', 'info')
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không xóa được.', 'error')
    }
  }

  function startEdit(item: Reflection) {
    setEditingId(item.id)
    setEditSituation(item.situation)
    setEditFeelings(item.feelings)
    setEditLesson(item.lesson)
    setEditClosure(item.closure_note)
    setEditImageUrl(item.image_url || null)
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editingId === null) return
    setEditBusy(true)
    try {
      await api(`/reflections/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          situation: editSituation,
          feelings: editFeelings,
          lesson: editLesson,
          closure_note: editClosure,
          image_url: editImageUrl || null,
        }),
      })
      setEditingId(null)
      addToast('Đã cập nhật ghi chép!', 'success')
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
          eyebrow="GÓC NHÌN LẠI"
          title="Đặt xuống điều không cần mang theo."
          description="Đây là nơi riêng tư để nhìn lại một tình huống, lắng nghe cảm xúc và chọn bài học cho mình — không phải nơi để phán xét bản thân hay người khác."
          icon={<Leaf />}
        />

        <div className="content-grid">
          {/* ── Create form ── */}
          <form className="editor-card" onSubmit={submit}>
            <span className="eyebrow">VIẾT CHO RIÊNG MÌNH</span>
            <h2>Nhìn lại, không kết tội.</h2>

            <label>Tình huống
              <input name="situation" required maxLength={160} placeholder="Điều bạn muốn nhìn lại" />
            </label>

            <label>Mình đã cảm thấy thế nào?
              <textarea name="feelings" rows={3} maxLength={10000} placeholder="Hãy viết thật với cảm xúc của mình." />
            </label>

            <label>Mình học được điều gì?
              <textarea name="lesson" rows={3} maxLength={10000} placeholder="Điều gì nằm trong khả năng thay đổi của mình?" />
            </label>

            <label>Điều mình muốn đặt xuống
              <textarea name="closure_note" rows={3} maxLength={10000} placeholder="Một lời nhắc nhẹ nhàng cho bản thân." />
            </label>

            {/* ── Locket Photo Attachment ── */}
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
                    Ảnh Locket
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
              {busy ? 'Đang lưu…' : 'Lưu ghi chép riêng tư'}
            </button>
          </form>

          {/* ── List ── */}
          <div className="list-panel">
            <div className="list-heading">
              <h2>Những lần mình đã trưởng thành</h2>
              <span>{items.length} mục</span>
            </div>

            {loading ? (
              <SkeletonCards />
            ) : items.length === 0 ? (
              <EmptyCard title="Không cần vội" text="Bạn có thể quay lại đây bất cứ lúc nào bạn thấy sẵn sàng." />
            ) : (
              <>
                {items.map(item =>
                  editingId === item.id ? (
                    <form key={item.id} className="data-card editing" onSubmit={saveEdit}>
                      <label>Tình huống
                        <input value={editSituation} onChange={e => setEditSituation(e.target.value)} required maxLength={160} />
                      </label>
                      <label>Cảm xúc
                        <textarea value={editFeelings} onChange={e => setEditFeelings(e.target.value)} rows={3} maxLength={10000} />
                      </label>
                      <label>Bài học
                        <textarea value={editLesson} onChange={e => setEditLesson(e.target.value)} rows={3} maxLength={10000} />
                      </label>
                      <label>Đặt xuống
                        <textarea value={editClosure} onChange={e => setEditClosure(e.target.value)} rows={3} maxLength={10000} />
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
                    <article className="data-card" key={item.id}>
                      <div className="data-card-top">
                        <span className="mini-tag">Riêng tư</span>
                        <div className="card-actions">
                          <button className="text-button" onClick={() => startEdit(item)}><Pencil size={13} /> Sửa</button>
                          <ConfirmDialog title="Xóa ghi chép" message="Bạn có chắc muốn xóa ghi chép này?" onConfirm={() => remove(item.id)}>
                            {(open) => <button className="text-button danger" onClick={open}><Trash2 size={13} /> Xóa</button>}
                          </ConfirmDialog>
                        </div>
                      </div>

                      <h3>{item.situation}</h3>
                      {item.feelings && <p><strong>Cảm xúc:</strong> {item.feelings}</p>}
                      {item.lesson && <p><strong>Bài học:</strong> {item.lesson}</p>}
                      {item.closure_note && <p><strong>Đặt xuống:</strong> {item.closure_note}</p>}

                      {/* ── Locket Photo Widget ── */}
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
                  <h3>{lightboxItem.situation}</h3>
                </div>
                {lightboxItem.lesson && (
                  <p className="locket-lightbox-story">
                    <strong>Bài học:</strong> {lightboxItem.lesson}
                  </p>
                )}
                {lightboxItem.closure_note && (
                  <p className="locket-lightbox-story" style={{ fontSize: 13, color: 'var(--muted)' }}>
                    <strong>Đặt xuống:</strong> {lightboxItem.closure_note}
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
