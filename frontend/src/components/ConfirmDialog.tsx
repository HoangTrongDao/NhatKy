import { useState, useCallback, ReactNode } from 'react'

interface Props {
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  children: (open: () => void) => ReactNode
}

export default function ConfirmDialog({ title, message, onConfirm, children }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleConfirm = useCallback(async () => {
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false); setOpen(false) }
  }, [onConfirm])

  return (
    <>
      {children(() => setOpen(true))}
      {open && (
        <div className="dialog-overlay" onClick={() => !busy && setOpen(false)}>
          <div className="dialog-card" onClick={e => e.stopPropagation()}>
            <h3>{title}</h3>
            <p>{message}</p>
            <div className="dialog-actions">
              <button className="button secondary" onClick={() => setOpen(false)} disabled={busy}>Hủy</button>
              <button className="button primary danger-bg" onClick={handleConfirm} disabled={busy}>
                {busy ? 'Đang xử lý…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
