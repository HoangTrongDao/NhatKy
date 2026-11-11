/**
 * Tiện ích quản lý thông báo tin nhắn (Web Audio API Chime & Web/PWA Push Notifications)
 * Tương thích hoàn toàn trên Desktop, Mobile Web và Ứng dụng PWA điện thoại.
 */

export type NotificationPermissionStatus = NotificationPermission

export interface MessageNotificationOptions {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

const STORAGE_KEY = 'nb_message_notifications_enabled'

// Quản lý AudioContext đơn nhất cho âm thanh chuông
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  return audioCtx
}

// Tự động mở khóa Web Audio API trên thiết bị di động khi có tương tác chạm/click đầu tiên
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    window.removeEventListener('click', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }
  window.addEventListener('click', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

/**
 * Kiểm tra xem trình duyệt hiện tại có hỗ trợ Notification API hay không.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Lấy trạng thái cấp quyền thông báo hiện tại ('granted' | 'denied' | 'default').
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

/**
 * Yêu cầu người dùng cấp quyền thông báo đẩy trên trình duyệt/thiết bị di động.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return 'denied'
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationEnabled(true)
    }
    return permission
  } catch (err) {
    console.warn('Lỗi khi yêu cầu cấp quyền thông báo:', err)
    return Notification.permission
  }
}

/**
 * Kiểm tra tùy chọn bật/tắt nhận thông báo tin nhắn của người dùng trong localStorage.
 * Mặc định: true (bật).
 */
export function isNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) {
    return true
  }
  return saved === 'true'
}

/**
 * Lưu tùy chọn bật/tắt nhận thông báo tin nhắn vào localStorage và phát sự kiện đồng bộ.
 */
export function setNotificationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(
    new CustomEvent('nb_notification_setting_changed', {
      detail: { enabled },
    })
  )
}

/**
 * Phát chuông báo tin nhắn mới được tổng hợp trực tiếp bằng Web Audio API.
 * Hoạt động mượt mà offline, không phụ thuộc file mp3 ngoài, âm thanh dịu êm phong cách pastel/zen.
 */
export function playMessageChime(): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Nốt 1: E5 (659.25Hz) - Âm vang mở đầu thanh thoát
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.015)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.28)

    // Nốt 2: A5 (880.00Hz) - Âm sắc hài hòa vui tươi, bắt đầu sau 70ms
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, now + 0.07)
    gain2.gain.setValueAtTime(0, now + 0.07)
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.09)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.07)
    osc2.stop(now + 0.42)
  } catch (e) {
    console.warn('Lỗi khi phát chuông báo tin nhắn:', e)
  }
}

/**
 * Kích hoạt thông báo tin nhắn toàn diện:
 * 1. Phát chuông báo âm thanh nhẹ nhàng (Web Audio API).
 * 2. Kích hoạt thông báo hệ thống / PWA qua ServiceWorkerRegistration.showNotification (hoặc new Notification).
 * 3. Hỗ trợ rung điện thoại và điều hướng trực tiếp vào cuộc trò chuyện khi bấm vào.
 */
export async function triggerMessageNotification({
  title,
  body,
  icon = '/pwa-192x192.png',
  url = '/messages',
  tag = 'chat-message',
}: MessageNotificationOptions): Promise<void> {
  // 1. Luôn phát chuông thông báo nếu người dùng đã bật
  if (isNotificationEnabled()) {
    playMessageChime()
  }

  // 2. Kiểm tra quyền và cài đặt thông báo của người dùng
  if (!isNotificationSupported()) return
  if (getNotificationPermission() !== 'granted') return
  if (!isNotificationEnabled()) return

  // 3. Hiển thị thông báo hệ thống
  try {
    let pushedViaServiceWorker = false

    // Ưu tiên ServiceWorker showNotification cho Mobile PWA & Android/iOS web app
    if ('serviceWorker' in navigator) {
      try {
        const registration = await (navigator.serviceWorker.ready || navigator.serviceWorker.getRegistration())
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, {
            body,
            icon,
            badge: '/pwa-192x192.png',
            tag,
            vibrate: [150, 75, 150],
            renotify: true,
            data: { url },
          } as NotificationOptions)
          pushedViaServiceWorker = true
        }
      } catch (swErr) {
        console.warn('ServiceWorker showNotification không khả dụng:', swErr)
      }
    }

    // Dự phòng với window.Notification cho Desktop hoặc khi ServiceWorker chưa kích hoạt
    if (!pushedViaServiceWorker) {
      const notif = new Notification(title, {
        body,
        icon,
        tag,
        data: { url },
      })

      notif.onclick = (e) => {
        e.preventDefault()
        window.focus()
        if (url) {
          window.location.href = url
        }
        notif.close()
      }
    }
  } catch (err) {
    console.warn('Lỗi khi kích hoạt thông báo hệ thống:', err)
  }
}
