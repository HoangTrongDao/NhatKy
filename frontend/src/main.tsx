import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// ── Bảo vệ & Mã hóa Console (Ngăn chặn rò rỉ Gmail/Email và dữ liệu nhạy cảm) ──
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

function maskEmailString(str: string): string {
  return str.replace(EMAIL_REGEX, (_match, user, domain) => {
    if (user.length <= 2) return `${user[0]}***@${domain}`
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
  })
}

function sanitizeConsoleData(data: unknown): unknown {
  if (typeof data === 'string') return maskEmailString(data)
  if (data && typeof data === 'object') {
    try {
      const raw = JSON.stringify(data)
      if (EMAIL_REGEX.test(raw)) {
        return JSON.parse(maskEmailString(raw))
      }
    } catch {
      return data
    }
  }
  return data
}

if (import.meta.env.PROD) {
  // Khi chạy production: vô hiệu hóa hoàn toàn console.log, info, debug để bảo mật tuyệt đối
  console.log = () => {}
  console.info = () => {}
  console.debug = () => {}
} else {
  // Khi chạy development: tự động che mờ email nếu xuất hiện trong bất kỳ log nào
  const rawLog = console.log.bind(console)
  const rawInfo = console.info.bind(console)
  console.log = (...args: unknown[]) => rawLog(...args.map(sanitizeConsoleData))
  console.info = (...args: unknown[]) => rawInfo(...args.map(sanitizeConsoleData))
}

const rawWarn = console.warn.bind(console)
const rawError = console.error.bind(console)
console.warn = (...args: unknown[]) => rawWarn(...args.map(sanitizeConsoleData))
console.error = (...args: unknown[]) => rawError(...args.map(sanitizeConsoleData))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
)
