import { useEffect, useState, useCallback, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  BookHeart, Plus, LockKeyhole, Search, X, Pencil,
  Camera, Calendar, Maximize2
} from 'lucide-react'
import { api, User, Memory } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import EmptyCard from './EmptyCard'
import ConfirmDialog from './ConfirmDialog'
import SkeletonCards from './SkeletonCards'

const PAGE_SIZE = 20

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

  /* ── Search/filter state ── */
  const [search, setSearch] = useState('')
  const [filterVis, setFilterVis] = useState<'' | 'private' | 'public'>('')

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editOccurred, setEditOccurred] = useState('')
  const [editVisibility, setEditVisibility] = useState<'private' | 'public'>('private')
  const [editBusy, setEditBusy] = useState(false)

  /* ── Lightbox Viewer for existing memories with photo ── */
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
          occurred_at: occurred || null,
          visibility
        }),
      })
      setTitle('')
      setContent('')
      setOccurred('')
      setVisibility('private')
      addToast('Kỷ niệm đã được lưu giữ!', 'success')
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

  return (
    <RequireUser user={user}>
      <div className="page subpage">
        <PageHeader
          eyebrow="GÓC KÝ ỨC ĐẸP"
          title="Điều gì đáng được giữ lại?"
          description="Không cần là điều lớn lao. Đôi khi chỉ một khoảnh khắc bình thường cũng đủ để ta mỉm cười khi nhớ về."
          icon={<BookHeart />}
        />

        {/* Locket shortcut banner */}
        <Link to="/locket" className="locket-invite-banner" title="Mở trang Locket">
          <div className="locket-invite-icon">
            <Camera size={20} />
          </div>
          <div className="locket-invite-text">
            <strong>Bạn muốn chụp và gửi ảnh khoảnh khắc kiểu Locket?</strong>
            <span>Đã có mục <strong>Locket</strong> riêng biệt với Camera trực tiếp và thả cảm xúc! Nhấn để trải nghiệm ngay →</span>
          </div>
        </Link>

        <div className="content-grid">
          {/* ── Create form ── */}
          <form className="editor-card" onSubmit={submit}>
            <span className="eyebrow">THÊM MỘT KÝ NIỆM</span>
            <h2>Một điều đẹp đẽ bạn nhớ.</h2>

            <label>Tiêu đề
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={160}
                placeholder="Ví dụ: Buổi chiều ngắm hoàng hôn thật yên"
              />
            </label>

            <label>Câu chuyện
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                maxLength={10000}
                rows={5}
                placeholder="Điều gì đã xảy ra? Vì sao khoảnh khắc này có ý nghĩa với bạn?"
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
              <LockKeyhole size={14} /> Mặc định riêng tư an toàn. Chỉ chia sẻ công khai khi bạn thật sự muốn lan tỏa điều tốt đẹp.
            </p>

            {error && <p className="error-message">{error}</p>}

            <button className="button primary full" disabled={busy}>
              <Plus size={17} />{busy ? 'Đang lưu…' : 'Lưu kỷ niệm'}
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
                text="Khi sẵn sàng, hãy bắt đầu bằng một khoảnh khắc nhỏ đáng nhớ."
              />
            ) : (
              <>
                {items.map(item => (
                  editingId === item.id ? (
                    /* ── Edit form ── */
                    <form key={item.id} className="data-card editing" onSubmit={saveEdit}>
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
                    <article className="data-card" key={item.id}>
                      {item.image_url && (
                        <div
                          className="locket-card-widget"
                          onClick={() => setLightboxMemory(item)}
                          title="Chạm để xem ảnh lớn"
                        >
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="locket-widget-img"
                            loading="lazy"
                          />
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

      {/* ── Lightbox Modal for photos ── */}
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
