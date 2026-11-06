import { useEffect, useState, useCallback, useRef, FormEvent, ChangeEvent } from 'react'
import {
  BookHeart, Plus, LockKeyhole, Search, X, Pencil,
  Camera, Sparkles, Maximize2, Calendar, Image as ImageIcon
} from 'lucide-react'
import { api, User, Memory } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import ConfirmDialog from './ConfirmDialog'
import SkeletonCards from './SkeletonCards'

const PAGE_SIZE = 20

/**
 * Nén ảnh phía client bằng HTML5 Canvas để tối ưu tốc độ và dung lượng,
 * tự động xoay chuẩn và nén nhẹ nhàng chuẩn khoảnh khắc Locket.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const MAX_DIM = 1200
        let { width, height } = img
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function MemoriesPage({ user }: { user: User | null }) {
  const [items, setItems] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  /* ── Create form state ── */
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [occurred, setOccurred] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [compressing, setCompressing] = useState(false)
  const createFileInputRef = useRef<HTMLInputElement>(null)

  /* ── Search/filter state ── */
  const [search, setSearch] = useState('')
  const [filterVis, setFilterVis] = useState<'' | 'private' | 'public'>('')

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editOccurred, setEditOccurred] = useState('')
  const [editVisibility, setEditVisibility] = useState<'private' | 'public'>('private')
  const [editImageUrl, setEditImageUrl] = useState<string>('')
  const [editBusy, setEditBusy] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  /* ── Locket Lightbox Viewer ── */
  const [lightboxMemory, setLightboxMemory] = useState<Memory | null>(null)

  const { addToast } = useToast()

  // Esc key listener to close lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxMemory(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const load = useCallback(async (append = false, offset = 0) => {
    try {
      if (!append) setLoading(true)
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      if (search) params.set('search', search)
      if (filterVis) params.set('visibility', filterVis)
      const data = await api<Memory[]>(`/memories?${params}`)
      setItems(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE_SIZE)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [search, filterVis])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  /* debounced search */
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [search, filterVis])

  async function handleImagePick(e: ChangeEvent<HTMLInputElement>, isEdit = false) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setCompressing(true)
      const base64 = await compressImage(file)
      if (isEdit) {
        setEditImageUrl(base64)
      } else {
        setImageUrl(base64)
      }
      addToast('Ảnh khoảnh khắc Locket đã sẵn sàng!', 'success')
    } catch {
      addToast('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác.', 'error')
    } finally {
      setCompressing(false)
      e.target.value = ''
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/memories', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          image_url: imageUrl || null,
          occurred_at: occurred || null,
          visibility
        }),
      })
      setTitle('')
      setContent('')
      setOccurred('')
      setVisibility('private')
      setImageUrl('')
      addToast('Khoảnh khắc Locket đã được lưu giữ!', 'success')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được kỷ niệm.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: number) {
    try {
      await api(`/memories/${id}`, { method: 'DELETE' })
      addToast('Đã xóa kỷ niệm.', 'info')
      if (lightboxMemory?.id === id) setLightboxMemory(null)
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không xóa được.', 'error')
    }
  }

  function startEdit(item: Memory) {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditContent(item.content)
    setEditOccurred(item.occurred_at || '')
    setEditVisibility(item.visibility)
    setEditImageUrl(item.image_url || '')
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editingId === null) return
    setEditBusy(true)
    try {
      await api(`/memories/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          image_url: editImageUrl || null,
          occurred_at: editOccurred || null,
          visibility: editVisibility,
        }),
      })
      setEditingId(null)
      addToast('Đã cập nhật kỷ niệm!', 'success')
      await load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không cập nhật được.', 'error')
    } finally {
      setEditBusy(false)
    }
  }

  function loadMore() {
    void load(true, items.length)
  }

  function formatDateBadge(dateStr?: string | null) {
    if (!dateStr) return 'Khoảnh khắc đáng nhớ'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <RequireUser user={user}>
      <div className="page subpage">
        <PageHeader
          eyebrow="GÓC KÝ ỨC ĐẸP"
          title="Khoảnh khắc Locket của bạn."
          description="Chụp hoặc lưu giữ những hình ảnh ấm áp nhất bên bạn bè, người thân và cuộc sống thường nhật."
          icon={<BookHeart />}
        />

        <div className="content-grid">
          {/* ── Create form ── */}
          <form className="editor-card locket-editor-card" onSubmit={submit}>
            <span className="eyebrow">
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              KHOẢNH KHẮC MỚI
            </span>
            <h2>Lưu giữ một điều đẹp đẽ.</h2>

            {/* ── Locket Photo Uploader & Live Preview ── */}
            <div className="locket-upload-section">
              <input
                ref={createFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImagePick(e, false)}
              />

              {imageUrl ? (
                <div className="locket-preview-container">
                  <div className="locket-widget-frame">
                    <img src={imageUrl} alt="Locket preview" className="locket-widget-img" />
                    <div className="locket-overlay-top">
                      <span className="locket-pill">
                        <Calendar size={12} />
                        {occurred ? formatDateBadge(occurred) : 'Hôm nay'}
                      </span>
                    </div>
                    <div className="locket-overlay-bottom">
                      <span className="locket-caption-pill">
                        {title.trim() ? title : 'Khoảnh khắc Locket'}
                      </span>
                    </div>
                  </div>
                  <div className="locket-preview-actions">
                    <button
                      type="button"
                      className="button secondary small"
                      onClick={() => createFileInputRef.current?.click()}
                      disabled={compressing}
                    >
                      <Camera size={14} /> {compressing ? 'Đang nén…' : 'Đổi ảnh khác'}
                    </button>
                    <button
                      type="button"
                      className="button secondary small danger"
                      onClick={() => setImageUrl('')}
                    >
                      <X size={14} /> Bỏ ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="locket-dropzone"
                  onClick={() => createFileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="locket-dropzone-icon">
                    <Camera size={28} />
                  </div>
                  <div className="locket-dropzone-text">
                    <strong>Chụp hoặc chọn ảnh (kiểu Locket)</strong>
                    <span>Khung ảnh bo tròn widget lưu trọn kỷ niệm</span>
                  </div>
                  {compressing && <span className="locket-compress-tag">Đang xử lý ảnh…</span>}
                </div>
              )}
            </div>

            <label>Tiêu đề khoảnh khắc
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={160}
                placeholder="Ví dụ: Buổi chiều ngắm hoàng hôn thật yên"
              />
            </label>

            <label>Câu chuyện đằng sau bức ảnh
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                maxLength={10000}
                rows={4}
                placeholder="Điều gì đã xảy ra? Vì sao khoảnh khắc này khiến bạn mỉm cười?"
              />
            </label>

            <div className="form-row-2col">
              <label>Ngày diễn ra
                <input type="date" value={occurred} onChange={e => setOccurred(e.target.value)} />
              </label>

              <label>Chế độ hiển thị
                <select value={visibility} onChange={e => setVisibility(e.target.value as 'private' | 'public')}>
                  <option value="private">Chỉ mình tôi (Riêng tư)</option>
                  <option value="public">Chia sẻ lên Bảng tin cộng đồng</option>
                </select>
              </label>
            </div>

            <p className="field-hint">
              <LockKeyhole size={14} /> Mặc định riêng tư an toàn. Bạn hoàn toàn có thể chia sẻ công khai khi sẵn lòng.
            </p>

            {error && <p className="error-message">{error}</p>}

            <button className="button primary full" disabled={busy || compressing}>
              <Plus size={17} />{busy ? 'Đang lưu…' : 'Lưu khoảnh khắc'}
            </button>
          </form>

          {/* ── List ── */}
          <div className="list-panel">
            {/* Search bar */}
            <div className="search-bar">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm ký ức…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && <button className="icon-button-sm" onClick={() => setSearch('')}><X size={14} /></button>}
              </div>
              <select
                className="filter-select"
                value={filterVis}
                onChange={e => setFilterVis(e.target.value as '' | 'private' | 'public')}
              >
                <option value="">Tất cả</option>
                <option value="private">Riêng tư</option>
                <option value="public">Công khai</option>
              </select>
            </div>

            <div className="list-heading">
              <h2>Kệ ký ức</h2>
              <span>{items.length} mục</span>
            </div>

            {loading ? (
              <SkeletonCards />
            ) : items.length === 0 ? (
              <EmptyCard
                title="Kệ ký ức đang chờ bạn"
                text="Hãy lưu lại khoảnh khắc hoặc tấm ảnh đầu tiên theo phong cách Locket!"
              />
            ) : (
              <>
                {items.map(item => (
                  editingId === item.id ? (
                    /* ── Edit form ── */
                    <form key={item.id} className="data-card editing locket-editor-card" onSubmit={saveEdit}>
                      {/* Edit photo */}
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImagePick(e, true)}
                      />

                      <div className="locket-upload-section">
                        {editImageUrl ? (
                          <div className="locket-preview-container">
                            <div className="locket-widget-frame">
                              <img src={editImageUrl} alt="Locket preview" className="locket-widget-img" />
                              <div className="locket-overlay-bottom">
                                <span className="locket-caption-pill">{editTitle || 'Khoảnh khắc Locket'}</span>
                              </div>
                            </div>
                            <div className="locket-preview-actions">
                              <button
                                type="button"
                                className="button secondary small"
                                onClick={() => editFileInputRef.current?.click()}
                              >
                                <Camera size={14} /> Thay ảnh
                              </button>
                              <button
                                type="button"
                                className="button secondary small danger"
                                onClick={() => setEditImageUrl('')}
                              >
                                <X size={14} /> Gỡ ảnh
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="locket-dropzone small"
                            onClick={() => editFileInputRef.current?.click()}
                          >
                            <ImageIcon size={22} />
                            <span>Thêm ảnh khoảnh khắc Locket cho kỷ niệm này</span>
                          </div>
                        )}
                      </div>

                      <label>Tiêu đề
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          required
                          maxLength={160}
                        />
                      </label>

                      <label>Câu chuyện
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          required
                          maxLength={10000}
                          rows={4}
                        />
                      </label>

                      <div className="form-row-2col">
                        <label>Ngày diễn ra
                          <input
                            type="date"
                            value={editOccurred}
                            onChange={e => setEditOccurred(e.target.value)}
                          />
                        </label>
                        <label>Hiển thị
                          <select
                            value={editVisibility}
                            onChange={e => setEditVisibility(e.target.value as 'private' | 'public')}
                          >
                            <option value="private">Riêng tư</option>
                            <option value="public">Công khai</option>
                          </select>
                        </label>
                      </div>

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Hủy
                        </button>
                        <button type="submit" className="button primary" disabled={editBusy}>
                          {editBusy ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Display card ── */
                    <article className={`data-card ${item.image_url ? 'has-locket-photo' : ''}`} key={item.id}>
                      {/* ── Locket Photo Widget Presentation ── */}
                      {item.image_url && (
                        <div
                          className="locket-card-widget"
                          onClick={() => setLightboxMemory(item)}
                          title="Chạm để xem ảnh toàn màn hình"
                        >
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="locket-widget-img"
                            loading="lazy"
                          />
                          <div className="locket-overlay-top">
                            <span className="locket-pill">
                              <Calendar size={11} />
                              {formatDateBadge(item.occurred_at || item.created_at)}
                            </span>
                          </div>
                          <div className="locket-overlay-bottom">
                            <span className="locket-caption-pill">
                              {item.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="locket-zoom-hint"
                            aria-label="Xem ảnh lớn"
                            onClick={(e) => { e.stopPropagation(); setLightboxMemory(item) }}
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>
                      )}

                      <div className="data-card-top">
                        <span className="mini-tag">
                          {item.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                        </span>
                        <div className="card-actions">
                          <button className="text-button" onClick={() => startEdit(item)}>
                            <Pencil size={13} /> Sửa
                          </button>
                          <ConfirmDialog
                            title="Xóa kỷ niệm"
                            message="Bạn có chắc muốn xóa kỷ niệm này? Hành động này không thể hoàn tác."
                            onConfirm={() => remove(item.id)}
                          >
                            {(open) => <button className="text-button danger" onClick={open}>Xóa</button>}
                          </ConfirmDialog>
                        </div>
                      </div>

                      <h3>{item.title}</h3>
                      <p className="memory-story-text">{item.content}</p>
                      <small className="memory-date-footer">
                        <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {item.occurred_at || new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </small>
                    </article>
                  )
                ))}

                {hasMore && (
                  <button className="button secondary full load-more" onClick={loadMore}>
                    Tải thêm…
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Locket Fullscreen Lightbox Modal ── */}
      {lightboxMemory && lightboxMemory.image_url && (
        <div
          className="locket-lightbox-overlay"
          onClick={() => setLightboxMemory(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="locket-lightbox-card" onClick={e => e.stopPropagation()}>
            <button
              className="locket-lightbox-close"
              onClick={() => setLightboxMemory(null)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="locket-lightbox-photo-wrap">
              <img
                src={lightboxMemory.image_url}
                alt={lightboxMemory.title}
                className="locket-lightbox-img"
              />
              <div className="locket-lightbox-time-pill">
                <Calendar size={13} />
                {formatDateBadge(lightboxMemory.occurred_at || lightboxMemory.created_at)}
              </div>
            </div>

            <div className="locket-lightbox-details">
              <div className="locket-lightbox-header">
                <h3>{lightboxMemory.title}</h3>
                <span className="mini-tag">
                  {lightboxMemory.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                </span>
              </div>
              <p className="locket-lightbox-story">{lightboxMemory.content}</p>
            </div>
          </div>
        </div>
      )}
    </RequireUser>
  )
}
