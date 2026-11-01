import { useEffect, useState, useCallback, FormEvent } from 'react'
import { Target, Pencil } from 'lucide-react'
import { api, User, Goal } from '../api'
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

  /* ── Edit state ── */
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editBusy, setEditBusy] = useState(false)

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
        }),
      })
      form.reset()
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
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editingId === null) return
    setEditBusy(true)
    try {
      await api(`/goals/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle, description: editDesc, target_date: editDate || null }),
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
                            {(open) => <button className="text-button danger" onClick={open}>Xóa</button>}
                          </ConfirmDialog>
                        </div>
                      </div>
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      {item.target_date && <small>Dự kiến: {item.target_date}</small>}
                      <div className="goal-actions">
                        {item.status !== 'in_progress' && (
                          <button className="button small secondary" onClick={() => void updateStatus(item, 'in_progress')}>
                            Đang thực hiện
                          </button>
                        )}
                        {item.status !== 'completed' && (
                          <button className="button small primary" onClick={() => void updateStatus(item, 'completed')}>
                            Đánh dấu hoàn thành ✓
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
      </div>
    </RequireUser>
  )
}
