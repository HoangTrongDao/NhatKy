import { useState, useEffect, useRef, ChangeEvent, DragEvent, useCallback } from 'react'
import {
  Camera, RefreshCw, Send, Image as ImageIcon, Sparkles,
  Users, Globe, Lock, Trash2, Maximize2, X, Download,
  UploadCloud, AlertCircle, PlusCircle
} from 'lucide-react'
import {
  User, LocketItem, fetchLocketFeed, fetchMyLockets, fetchFriendsLockets,
  createLocket, reactToLocket, deleteLocket, compressImageDataUrl
} from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'

const REACTION_EMOJIS = ['❤️', '🔥', '🥰', '😂', '✨']

export default function LocketPage({ user }: { user: User | null }) {
  /* ── Page Navigation (Studio vs Timeline) ── */
  const [pageMode, setPageMode] = useState<'studio' | 'timeline'>('studio')
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends' | 'my'>('all')

  /* ── Capture Source (Camera vs File Upload) ── */
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload'>('camera')
  const [isDragOver, setIsDragOver] = useState(false)

  /* ── Locket Data & Feed State ── */
  const [lockets, setLockets] = useState<LocketItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [sending, setSending] = useState(false)

  /* ── Camera State ── */
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isFlashActive, setIsFlashActive] = useState(false)

  /* ── Snapped Photo & Publish Form ── */
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<'friends' | 'public' | 'private'>('friends')

  /* ── Refs ── */
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Lightbox State ── */
  const [lightboxLocket, setLightboxLocket] = useState<LocketItem | null>(null)

  const { addToast } = useToast()

  // Callback ref: Gắn kết stream vào video ngay khoảnh khắc thẻ video được đưa vào DOM
  const bindVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current
      }
      node.onloadedmetadata = () => {
        node.play().catch(e => console.warn('Video play error:', e))
      }
      node.play().catch(e => console.warn('Video play error:', e))
    }
  }, [])

  // Đảm bảo stream luôn được bind vào video khi camera active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const v = videoRef.current
      if (v.srcObject !== streamRef.current) {
        v.srcObject = streamRef.current
      }
      v.play().catch(() => {})
    }
  }, [isCameraActive, facingMode])

  // Dọn dẹp stream khi unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop() } catch {}
        })
        streamRef.current = null
      }
    }
  }, [])

  // Khởi động webcam với cơ chế 3 tầng fallback
  const startCamera = async (targetMode?: 'user' | 'environment') => {
    const mode = targetMode || facingMode
    setCameraError(null)
    setCameraLoading(true)
    setIsVideoReady(false)

    // Dừng track cũ trước khi mở mới
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop() } catch {}
      })
      streamRef.current = null
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt hoặc môi trường hiện tại chưa hỗ trợ camera trực tiếp. Bạn hãy chuyển sang chế độ tải ảnh nhé.')
      setCameraLoading(false)
      setIsCameraActive(false)
      return
    }

    try {
      let stream: MediaStream | null = null

      // Tầng 1: HD 16:9 tương thích phổ quát
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (err1) {
        console.warn('Tier 1 constraints failed, trying facingMode only...', err1)
        // Tầng 2: Thử theo hướng camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: mode } },
            audio: false,
          })
        } catch (err2) {
          console.warn('Tier 2 failed, falling back to generic video...', err2)
          // Tầng 3: Nhận bất kỳ luồng video nào
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }
      }

      if (!stream) {
        throw new Error('Không nhận được luồng hình ảnh từ camera.')
      }

      streamRef.current = stream
      setIsCameraActive(true)

      // Gắn ngay nếu video element đã có sẵn
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Play caught:', e))
        }
        videoRef.current.play().catch(e => console.warn('Play caught:', e))
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      let msg = 'Không thể mở camera trên thiết bị.'
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Quyền Camera bị từ chối trong trình duyệt. Bạn có thể cấp quyền trong cài đặt hoặc tải ảnh từ máy.'
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị camera khả dụng trên máy của bạn.'
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'Camera đang bị ứng dụng khác chiếm dụng (Zoom, Meet, Teams, v.v.).'
      }
      setCameraError(msg)
      setIsCameraActive(false)
    } finally {
      setCameraLoading(false)
    }
  }

  // Tắt camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop() } catch {}
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsVideoReady(false)
  }

  // Đổi camera trước / sau
  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    if (isCameraActive) {
      await startCamera(nextMode)
    }
  }

  // Chuyển chế độ sang Tải ảnh
  const switchToUpload = () => {
    stopCamera()
    setCaptureSource('upload')
    setCameraError(null)
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 50)
  }

  // Chuyển chế độ sang Camera
  const switchToCamera = async () => {
    setCaptureSource('camera')
    setCameraError(null)
    await startCamera()
  }

  // Chụp ảnh từ live camera
  const capturePhoto = async () => {
    if (!videoRef.current) return
    const video = videoRef.current

    const width = video.videoWidth || 640
    const height = video.videoHeight || 640
    if (width === 0 || height === 0) {
      addToast('Camera đang khởi động, vui lòng thử lại sau vài giây...', 'info')
      return
    }

    // Hiệu ứng chớp flash
    setIsFlashActive(true)
    setTimeout(() => setIsFlashActive(false), 160)

    const canvas = document.createElement('canvas')
    const size = Math.min(width, height)
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Mirror nếu dùng camera trước
      if (facingMode === 'user') {
        ctx.translate(size, 0)
        ctx.scale(-1, 1)
      }

      const sx = (width - size) / 2
      const sy = (height - size) / 2
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
      const rawData = canvas.toDataURL('image/jpeg', 0.92)
      const optimized = await compressImageDataUrl(rawData, 1080, 0.85)
      setCapturedPhoto(optimized)
      stopCamera()
    }
  }

  // Xử lý khi chọn file ảnh từ máy
  const processSelectedFile = async (file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const raw = reader.result as string
        const optimized = await compressImageDataUrl(raw, 1080, 0.85)
        setCapturedPhoto(optimized)
        stopCamera()
      }
      reader.readAsDataURL(file)
    } catch {
      addToast('Không thể đọc tệp ảnh này.', 'error')
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processSelectedFile(file)
    e.target.value = ''
  }

  // Xử lý kéo thả ảnh (Drag & Drop)
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await processSelectedFile(file)
    } else {
      addToast('Vui lòng kéo thả tệp hình ảnh hợp lệ.', 'error')
    }
  }

  // Chụp lại / Chọn lại ảnh khác
  const retakePhoto = () => {
    setCapturedPhoto(null)
    setCaption('')
    if (captureSource === 'camera') {
      void startCamera()
    }
  }

  // Gửi Locket
  const handleSendLocket = async () => {
    if (!capturedPhoto) return
    setSending(true)
    try {
      const newLocket = await createLocket({
        image_url: capturedPhoto,
        caption: caption.trim(),
        visibility,
      })
      setLockets(prev => [newLocket, ...prev])
      setCapturedPhoto(null)
      setCaption('')
      addToast('Đã gửi khoảnh khắc Locket thành công! ✨', 'success')
      // Chuyển sang Dòng thời gian để xem ngay khoảnh khắc vừa đăng
      setPageMode('timeline')
      void loadFeed()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không gửi được Locket.', 'error')
    } finally {
      setSending(false)
    }
  }

  // Tải bảng tin Locket
  const loadFeed = async () => {
    setLoadingFeed(true)
    try {
      let data: LocketItem[] = []
      if (feedFilter === 'all') {
        data = await fetchLocketFeed()
      } else if (feedFilter === 'friends') {
        data = await fetchFriendsLockets()
      } else {
        data = await fetchMyLockets()
      }
      setLockets(data)
    } catch {
      addToast('Không thể tải bảng tin Locket.', 'error')
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    if (user) {
      void loadFeed()
    }
  }, [user, feedFilter])

  // Thả cảm xúc
  const handleReact = async (locketId: number, emoji: string) => {
    if (!user) return
    try {
      // Optimistic UI update
      setLockets(prev => prev.map(item => {
        if (item.id !== locketId) return item
        const reactions = { ...(item.reactions || {}) }
        const users = [...(reactions[emoji] || [])]
        if (users.includes(user.id)) {
          reactions[emoji] = users.filter(id => id !== user.id)
          if (reactions[emoji].length === 0) delete reactions[emoji]
        } else {
          reactions[emoji] = [...users, user.id]
        }
        return { ...item, reactions }
      }))

      const updated = await reactToLocket(locketId, emoji)
      setLockets(prev => prev.map(item => item.id === locketId ? updated : item))
      if (lightboxLocket?.id === locketId) {
        setLightboxLocket(updated)
      }
    } catch {
      addToast('Không thể thả cảm xúc.', 'error')
      void loadFeed()
    }
  }

  // Xóa Locket
  const handleDelete = async (locketId: number) => {
    try {
      await deleteLocket(locketId)
      setLockets(prev => prev.filter(item => item.id !== locketId))
      if (lightboxLocket?.id === locketId) setLightboxLocket(null)
      addToast('Đã xóa khoảnh khắc.', 'info')
    } catch {
      addToast('Không thể xóa khoảnh khắc này.', 'error')
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
      if (diffSec < 60) return 'Vừa xong'
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <RequireUser user={user}>
      {/* ── Scoped Full-Width & Bright Warm Theme Styles ── */}
      <style>{`
        .locket-page-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 16px 40px !important;
          box-sizing: border-box !important;
        }

        /* Nav Mode Bar */
        .locket-nav-mode-bar {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          width: 100%;
        }
        .locket-nav-mode-pills {
          display: inline-flex;
          background: #fcf7f2;
          padding: 6px;
          border-radius: 999px;
          border: 1px solid rgba(230, 103, 126, 0.2);
          box-shadow: 0 4px 16px rgba(230, 103, 126, 0.08);
          gap: 6px;
        }
        .locket-mode-btn {
          border: none;
          background: transparent;
          color: #7a5e66;
          font-weight: 700;
          font-size: 14px;
          padding: 9px 20px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .locket-mode-btn:hover {
          color: #e6677e;
          background: rgba(230, 103, 126, 0.08);
        }
        .locket-mode-btn.active {
          background: linear-gradient(135deg, #e6677e, #f27289);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.35);
        }

        /* ── STUDIO MODE: EXPANSIVE & BRIGHT WARM ── */
        .locket-studio-container {
          width: 100%;
          max-width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 4px 0 24px;
        }
        .locket-studio-card {
          width: 100%;
          max-width: 1020px;
          background: linear-gradient(145deg, #ffffff 0%, #fffdfa 45%, #fff1f4 100%) !important;
          border: 1.5px solid rgba(230, 103, 126, 0.22) !important;
          border-radius: 36px !important;
          padding: 32px !important;
          box-shadow: 0 16px 44px rgba(230, 103, 126, 0.08), 0 2px 12px rgba(180, 120, 130, 0.04) !important;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-sizing: border-box;
        }
        .locket-studio-grid {
          display: grid;
          grid-template-columns: minmax(320px, 480px) 1fr;
          gap: 36px;
          align-items: center;
        }
        @media (max-width: 860px) {
          .locket-studio-card {
            padding: 20px !important;
            border-radius: 28px !important;
          }
          .locket-studio-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        /* Viewfinder Squircle */
        .locket-viewfinder {
          position: relative;
          width: 100%;
          max-width: 480px;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          border-radius: 36px !important;
          overflow: hidden !important;
          background: linear-gradient(135deg, #fdf7f2 0%, #faedf0 100%) !important;
          border: 2.5px solid rgba(230, 103, 126, 0.28) !important;
          box-shadow: 0 12px 32px rgba(230, 103, 126, 0.12), inset 0 2px 8px rgba(230, 103, 126, 0.05) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s ease;
        }
        .locket-viewfinder.flash {
          filter: brightness(1.7);
        }

        /* Live Stream Box */
        .locket-live-stream-box {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fbf3ec;
        }
        .locket-video-stream {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .locket-camera-loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 252, 248, 0.9) !important;
          backdrop-filter: blur(8px);
          color: #5a2835 !important;
          font-size: 13.5px;
          font-weight: 700;
          gap: 12px;
          z-index: 5;
        }
        .locket-flip-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(230, 103, 126, 0.3) !important;
          color: #e6677e !important;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.3s ease, background 0.2s ease;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.2) !important;
          z-index: 10;
        }
        .locket-flip-btn:hover {
          transform: rotate(180deg);
          background: #ffffff !important;
        }

        /* Dropzone (Upload Mode) */
        .locket-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 360px;
          padding: 32px 24px;
          text-align: center;
          gap: 14px;
          cursor: pointer;
          color: #38242a !important;
          transition: all 0.25s ease;
          background: linear-gradient(135deg, #fffdfb 0%, #fdf6f1 60%, #fff1f4 100%) !important;
          border: 2px dashed rgba(230, 103, 126, 0.35) !important;
        }
        .locket-dropzone:hover,
        .locket-dropzone.dragover {
          background: linear-gradient(135deg, #ffffff 0%, #faedf0 100%) !important;
          border-color: #e6677e !important;
          transform: scale(1.01);
          box-shadow: 0 10px 28px rgba(230, 103, 126, 0.15);
        }
        .locket-dropzone-icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e6677e, #f27289);
          display: grid;
          place-items: center;
          color: #ffffff !important;
          box-shadow: 0 8px 24px rgba(230, 103, 126, 0.32);
        }
        .locket-dropzone strong {
          font-size: 16px;
          font-weight: 800;
          color: #38242a !important;
        }
        .locket-dropzone p {
          font-size: 13px;
          color: #7f6068 !important;
          margin: 0;
          max-width: 290px;
          line-height: 1.5;
        }

        /* Camera Error Fallback */
        .locket-camera-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 360px;
          padding: 28px 24px;
          text-align: center;
          gap: 14px;
          background: linear-gradient(135deg, #fff8f8 0%, #fdeef0 100%) !important;
          color: #4a222a !important;
          border: 1.5px solid rgba(230, 103, 126, 0.35) !important;
        }
        .locket-camera-fallback strong {
          font-size: 16px;
          font-weight: 800;
          color: #e6677e !important;
        }
        .locket-camera-fallback p {
          font-size: 12.5px;
          color: #7f525c !important;
          margin: 0;
          line-height: 1.5;
        }

        /* Snapped Photo Preview */
        .locket-snap-preview {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .locket-snap-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .locket-overlay-top {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 10;
        }
        .locket-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(230, 103, 126, 0.3) !important;
          color: #b83d54 !important;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.15) !important;
        }
        .locket-floating-caption {
          position: absolute;
          bottom: 14px;
          left: 14px;
          right: 14px;
          z-index: 10;
        }
        .locket-floating-caption input {
          width: 100%;
          background: rgba(255, 255, 255, 0.94) !important;
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(230, 103, 126, 0.35) !important;
          color: #38242a !important;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(70, 30, 40, 0.12) !important;
          box-sizing: border-box;
          outline: none;
        }
        .locket-floating-caption input:focus {
          border-color: #e6677e !important;
          box-shadow: 0 6px 22px rgba(230, 103, 126, 0.25) !important;
        }
        .locket-floating-caption input::placeholder {
          color: #9d7c86 !important;
        }

        /* Source Toggle */
        .locket-source-toggle {
          display: flex;
          background: #fdf5f0;
          padding: 5px;
          border-radius: 999px;
          border: 1px solid rgba(230, 103, 126, 0.18);
          gap: 6px;
          width: 100%;
        }
        .locket-source-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: #72525a;
          font-weight: 700;
          font-size: 13.5px;
          padding: 9px 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .locket-source-btn:hover {
          color: #e6677e;
          background: rgba(230, 103, 126, 0.08);
        }
        .locket-source-btn.active {
          background: linear-gradient(135deg, #e6677e, #f27289) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.28) !important;
        }

        /* Controls Panel */
        .locket-controls-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
        }
        .locket-studio-side-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Shutter Bar */
        .locket-shutter-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          padding: 8px 0;
        }
        .locket-shutter-button {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #e6677e, #f27289) !important;
          box-shadow: 0 8px 26px rgba(230, 103, 126, 0.4) !important;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .locket-shutter-button:hover {
          transform: scale(1.06);
          box-shadow: 0 10px 30px rgba(230, 103, 126, 0.5) !important;
        }
        .locket-shutter-button:active {
          transform: scale(0.94);
        }
        .shutter-inner-ring {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          display: block;
        }
        .locket-gallery-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff !important;
          border: 1.5px solid rgba(230, 103, 126, 0.25) !important;
          color: #e6677e !important;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(230, 103, 126, 0.12) !important;
          transition: all 0.2s ease;
        }
        .locket-gallery-btn:hover {
          transform: translateY(-2px);
          border-color: #e6677e !important;
          background: #fff0f3 !important;
        }

        /* Visibility Selector */
        .locket-vis-selector {
          display: flex;
          background: #fdf5f0;
          padding: 4px;
          border-radius: 999px;
          border: 1px solid rgba(230, 103, 126, 0.18);
          gap: 6px;
          width: 100%;
        }
        .locket-vis-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: #72525a;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .locket-vis-btn:hover {
          color: #e6677e;
        }
        .locket-vis-btn.active {
          background: #ffffff !important;
          color: #e6677e !important;
          box-shadow: 0 2px 8px rgba(230, 103, 126, 0.2) !important;
        }
        .locket-publish-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .locket-action-btns {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .locket-action-btns button {
          flex: 1;
        }

        /* Cozy studio hint card */
        .locket-studio-hint-card {
          background: linear-gradient(135deg, #fffcf9, #fbf2ea);
          border: 1px solid rgba(230, 103, 126, 0.16);
          border-radius: 20px;
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 12.5px;
          color: #785860;
          line-height: 1.5;
        }
        .locket-studio-hint-icon {
          color: #e6677e;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* ── TIMELINE MODE: EXPANSIVE FULL-WIDTH GRID ── */
        .locket-timeline-section {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .locket-timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          width: 100%;
        }
        .locket-feed-filter-pills {
          display: inline-flex;
          background: #fcf7f2;
          padding: 5px;
          border-radius: 999px;
          border: 1px solid rgba(230, 103, 126, 0.18);
          gap: 6px;
        }
        .locket-feed-filter-btn {
          border: none;
          background: transparent;
          color: #7a5e66;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .locket-feed-filter-btn:hover {
          color: #e6677e;
        }
        .locket-feed-filter-btn.active {
          background: #ffffff !important;
          color: #e6677e !important;
          box-shadow: 0 2px 10px rgba(230, 103, 126, 0.2) !important;
        }

        /* Expansive Widgets Grid */
        .locket-widgets-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
          gap: 24px !important;
          width: 100% !important;
          margin: 0 !important;
        }
        @media (max-width: 680px) {
          .locket-widgets-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
        }

        /* Single Widget Card */
        .locket-widget-card {
          background: linear-gradient(145deg, #ffffff 0%, #fffdfa 55%, #fff1f4 100%) !important;
          border: 1.5px solid rgba(230, 103, 126, 0.18) !important;
          border-radius: 28px !important;
          padding: 18px !important;
          box-shadow: 0 8px 24px rgba(230, 103, 126, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02) !important;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform 0.25s ease, box-shadow 0.25s ease !important;
          box-sizing: border-box;
        }
        .locket-widget-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(230, 103, 126, 0.16) !important;
        }
        .locket-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .locket-widget-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .locket-author-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e6677e, #f27289);
          color: #ffffff;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 14px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(230, 103, 126, 0.25);
        }
        .locket-author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .locket-author-text {
          display: flex;
          flex-direction: column;
        }
        .locket-author-text strong {
          font-size: 14px;
          font-weight: 700;
          color: #38242a;
        }
        .locket-author-text small {
          font-size: 12px;
          color: #8c6e76;
        }
        .locket-delete-btn {
          border: none;
          background: #fdf5f0;
          color: #8c6e76;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .locket-delete-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        /* Widget Photo Wrap */
        .locket-widget-photo-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          background: #faf2ec;
          border: 1px solid rgba(230, 103, 126, 0.14);
        }
        .locket-widget-photo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }
        .locket-widget-photo-wrap:hover img {
          transform: scale(1.03);
        }
        .locket-photo-time-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(230, 103, 126, 0.25) !important;
          color: #5a2835 !important;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .locket-photo-zoom-hint {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9) !important;
          color: #e6677e !important;
          border: 1px solid rgba(230, 103, 126, 0.25) !important;
          display: grid;
          place-items: center;
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(230, 103, 126, 0.15);
        }
        .locket-widget-photo-wrap:hover .locket-photo-zoom-hint {
          opacity: 1;
          transform: scale(1);
        }
        .locket-widget-caption {
          font-size: 14px;
          font-weight: 600;
          color: #38242a !important;
          line-height: 1.45;
          margin: 0;
          padding: 2px 4px;
        }

        /* Reactions Bar */
        .locket-reactions-bar {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .locket-react-btn {
          border: 1px solid rgba(230, 103, 126, 0.2) !important;
          background: #ffffff !important;
          color: #422830 !important;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .locket-react-btn:hover {
          transform: scale(1.12);
          border-color: #e6677e !important;
          background: #fff0f3 !important;
        }
        .locket-react-btn.reacted {
          background: #fdebee !important;
          border-color: #e6677e !important;
          box-shadow: 0 2px 8px rgba(230, 103, 126, 0.22) !important;
          font-weight: 700;
          color: #b83d54 !important;
        }
        .react-count {
          font-size: 11.5px;
          font-weight: 700;
        }

        /* Empty State */
        .locket-empty-state {
          background: linear-gradient(145deg, #ffffff 0%, #fffcf8 60%, #fff0f3 100%) !important;
          border: 1.5px solid rgba(230, 103, 126, 0.2) !important;
          border-radius: 32px !important;
          padding: 56px 24px;
          text-align: center;
          color: #38242a !important;
          box-shadow: 0 12px 36px rgba(230, 103, 126, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }
        .locket-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff0f3, #fdebee);
          border: 2px solid rgba(230, 103, 126, 0.25);
          display: grid;
          place-items: center;
          color: #e6677e;
          box-shadow: 0 8px 24px rgba(230, 103, 126, 0.16);
        }
        .locket-empty-state h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #38242a;
        }
        .locket-empty-state p {
          margin: 0;
          font-size: 13.5px;
          color: #846870;
          max-width: 440px;
          line-height: 1.5;
        }

        /* ── LIGHTBOX MODAL: WARM BLUR BACKDROP & CARD ── */
        .locket-lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(56, 32, 38, 0.65) !important;
          backdrop-filter: blur(12px) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          box-sizing: border-box;
        }
        .locket-lightbox-card {
          position: relative;
          background: linear-gradient(145deg, #ffffff 0%, #fffdfa 55%, #fff1f4 100%) !important;
          border: 1.5px solid rgba(230, 103, 126, 0.25) !important;
          border-radius: 32px !important;
          box-shadow: 0 24px 60px rgba(70, 30, 40, 0.25) !important;
          overflow: hidden;
          max-width: 900px;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(320px, 1fr) 340px;
          box-sizing: border-box;
        }
        @media (max-width: 760px) {
          .locket-lightbox-card {
            grid-template-columns: 1fr;
            max-height: 90vh;
            overflow-y: auto;
          }
        }
        .locket-lightbox-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(230, 103, 126, 0.25);
          background: #ffffff;
          color: #e6677e;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }
        .locket-lightbox-close:hover {
          transform: scale(1.08);
          background: #fff0f3;
        }
        .locket-lightbox-photo-wrap {
          position: relative;
          background: #faf3ec;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 340px;
        }
        .locket-lightbox-img {
          width: 100%;
          height: 100%;
          max-height: 520px;
          object-fit: cover;
          display: block;
        }
        .locket-lightbox-time-pill {
          position: absolute;
          bottom: 14px;
          left: 14px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(230, 103, 126, 0.25);
          color: #5a2835;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .locket-lightbox-details {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          justify-content: space-between;
        }
        .locket-lightbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .locket-author-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .locket-author-info strong {
          font-size: 15px;
          font-weight: 700;
          color: #38242a;
        }
        .locket-lightbox-story {
          font-size: 15px;
          font-weight: 500;
          color: #422830;
          line-height: 1.5;
          margin: 0;
          padding: 12px 14px;
          background: #fdf6f2;
          border-radius: 16px;
          border: 1px solid rgba(230, 103, 126, 0.14);
        }
      `}</style>

      <div className="page subpage locket-page-wrapper">
        <PageHeader
          eyebrow="LOCKET WIDGET"
          title="Khoảnh khắc trực tiếp."
          description="Chụp nhanh hoặc chia sẻ khoảnh khắc chân thật gửi gắm đến không gian riêng tư của bạn bè và chính mình."
          icon={<Camera />}
        />

        {/* ── Mode Navigation Bar: Chụp Locket vs Dòng thời gian ── */}
        <div className="locket-nav-mode-bar">
          <div className="locket-nav-mode-pills">
            <button
              type="button"
              className={`locket-mode-btn ${pageMode === 'studio' ? 'active' : ''}`}
              onClick={() => {
                setPageMode('studio')
                if (captureSource === 'camera' && !capturedPhoto && !isCameraActive) {
                  void startCamera()
                }
              }}
            >
              <Camera size={16} />
              <span>Chụp Locket</span>
            </button>
            <button
              type="button"
              className={`locket-mode-btn ${pageMode === 'timeline' ? 'active' : ''}`}
              onClick={() => {
                stopCamera()
                setPageMode('timeline')
              }}
            >
              <Sparkles size={16} />
              <span>Dòng thời gian</span>
              {lockets.length > 0 && <span className="badge-count">{lockets.length}</span>}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CHẾ ĐỘ 1: STUDIO CHỤP LOCKET (RESPONSIVE WIDE LAYOUT & WARM THEME)
           ══════════════════════════════════════════════════════════════════ */}
        {pageMode === 'studio' && (
          <div className="locket-studio-container">
            <div className="locket-studio-card">
              {/* Responsive 2-Column Grid on Wide Displays */}
              <div className="locket-studio-grid">
                {/* ── Left Column: Viewfinder Squircle ── */}
                <div className="locket-studio-left">
                  <div className={`locket-viewfinder ${isFlashActive ? 'flash' : ''}`}>
                    {capturedPhoto ? (
                      /* Ảnh đã chụp / tải lên -> Xem trước & Thêm caption */
                      <div className="locket-snap-preview">
                        <img src={capturedPhoto} alt="Captured Locket" className="locket-snap-img" />
                        <div className="locket-overlay-top">
                          <span className="locket-pill">
                            <Sparkles size={13} /> Khoảnh khắc vừa chụp
                          </span>
                        </div>

                        {/* Floating Caption Input on Photo */}
                        <div className="locket-floating-caption">
                          <input
                            type="text"
                            placeholder="Viết một ghi chú ngắn cho khoảnh khắc này…"
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            maxLength={140}
                            autoFocus
                          />
                        </div>
                      </div>
                    ) : captureSource === 'camera' ? (
                      /* Chế độ Camera */
                      isCameraActive ? (
                        <div className="locket-live-stream-box">
                          <video
                            ref={bindVideoRef}
                            autoPlay
                            playsInline
                            muted
                            onLoadedData={() => setIsVideoReady(true)}
                            onCanPlay={() => setIsVideoReady(true)}
                            className="locket-video-stream"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                          />

                          {(cameraLoading || !isVideoReady) && (
                            <div className="locket-camera-loading-overlay">
                              <RefreshCw size={26} className="locket-spinner" />
                              <span>Đang kết nối camera...</span>
                            </div>
                          )}

                          <button
                            type="button"
                            className="locket-flip-btn"
                            onClick={() => void toggleFacingMode()}
                            title="Đổi camera trước/sau"
                          >
                            <RefreshCw size={18} />
                          </button>
                        </div>
                      ) : cameraError ? (
                        /* Lỗi mở Camera -> Hiển thị chuyển nhanh sang tải ảnh */
                        <div className="locket-camera-fallback">
                          <AlertCircle size={40} color="#e6677e" />
                          <strong>Không thể mở Camera</strong>
                          <p>{cameraError}</p>
                          <button
                            type="button"
                            className="button primary small"
                            style={{ marginTop: 8 }}
                            onClick={switchToUpload}
                          >
                            <ImageIcon size={14} /> Chuyển sang tải ảnh từ máy
                          </button>
                        </div>
                      ) : (
                        /* Trạng thái chuẩn bị */
                        <div className="locket-dropzone" onClick={() => void startCamera()}>
                          <div className="locket-dropzone-icon">
                            <Camera size={34} />
                          </div>
                          <strong>Bật Camera Locket</strong>
                          <p>Nhấp vào đây để mở camera và bắt đầu chụp ảnh trực tiếp</p>
                          <button type="button" className="button primary small" style={{ marginTop: 6 }}>
                            Mở Camera ngay
                          </button>
                        </div>
                      )
                    ) : (
                      /* Chế độ Tải ảnh (Dropzone) */
                      <div
                        className={`locket-dropzone ${isDragOver ? 'dragover' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={e => void handleDrop(e)}
                      >
                        <div className="locket-dropzone-icon">
                          <UploadCloud size={34} />
                        </div>
                        <strong>Kéo thả ảnh vào đây</strong>
                        <p>Hoặc nhấp để chọn ảnh từ máy tính hoặc điện thoại của bạn</p>
                        <button type="button" className="button secondary small" style={{ marginTop: 6 }}>
                          <ImageIcon size={14} /> Chọn ảnh từ máy
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right Column: Studio Controls & Publish Form ── */}
                <div className="locket-studio-side-panel">
                  {/* Toggle Source: Camera vs Tải ảnh */}
                  {!capturedPhoto && (
                    <div className="locket-source-toggle">
                      <button
                        type="button"
                        className={`locket-source-btn ${captureSource === 'camera' ? 'active' : ''}`}
                        onClick={() => void switchToCamera()}
                      >
                        <Camera size={15} /> Camera trực tiếp
                      </button>
                      <button
                        type="button"
                        className={`locket-source-btn ${captureSource === 'upload' ? 'active' : ''}`}
                        onClick={switchToUpload}
                      >
                        <ImageIcon size={15} /> Tải ảnh lên
                      </button>
                    </div>
                  )}

                  {/* Điều khiển chụp & gửi */}
                  <div className="locket-controls-container">
                    {capturedPhoto ? (
                      /* Form xuất bản ảnh */
                      <div className="locket-publish-box">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: '#38242a' }}>
                            Ai có thể thấy khoảnh khắc này?
                          </label>
                          {/* Chọn đối tượng xem */}
                          <div className="locket-vis-selector">
                            <button
                              type="button"
                              className={`locket-vis-btn ${visibility === 'friends' ? 'active' : ''}`}
                              onClick={() => setVisibility('friends')}
                            >
                              <Users size={14} /> Bạn bè
                            </button>
                            <button
                              type="button"
                              className={`locket-vis-btn ${visibility === 'public' ? 'active' : ''}`}
                              onClick={() => setVisibility('public')}
                            >
                              <Globe size={14} /> Công khai
                            </button>
                            <button
                              type="button"
                              className={`locket-vis-btn ${visibility === 'private' ? 'active' : ''}`}
                              onClick={() => setVisibility('private')}
                            >
                              <Lock size={14} /> Riêng tư
                            </button>
                          </div>
                        </div>

                        <div className="locket-action-btns">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={retakePhoto}
                            disabled={sending}
                          >
                            <RefreshCw size={15} /> Chụp lại
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => void handleSendLocket()}
                            disabled={sending}
                          >
                            <Send size={15} /> {sending ? 'Đang gửi…' : 'Gửi Locket ✨'}
                          </button>
                        </div>
                      </div>
                    ) : captureSource === 'camera' && isCameraActive ? (
                      /* Shutter Bar khi Camera đang phát */
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div className="locket-shutter-bar">
                          <button
                            type="button"
                            className="locket-gallery-btn"
                            onClick={switchToUpload}
                            title="Chọn ảnh từ thư viện"
                          >
                            <ImageIcon size={20} />
                          </button>

                          <button
                            type="button"
                            className="locket-shutter-button"
                            onClick={() => void capturePhoto()}
                            aria-label="Chụp ảnh"
                          >
                            <span className="shutter-inner-ring" />
                          </button>

                          <button
                            type="button"
                            className="locket-gallery-btn"
                            onClick={stopCamera}
                            title="Tắt camera"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <span style={{ fontSize: 12.5, color: '#8c6e76', fontWeight: 600 }}>
                          Nhấp nút tròn ở giữa để chụp khoảnh khắc
                        </span>
                      </div>
                    ) : (
                      /* Nút bổ trợ dưới đáy Studio */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {captureSource === 'camera' ? (
                          <button
                            type="button"
                            className="button secondary full"
                            onClick={switchToUpload}
                          >
                            <ImageIcon size={15} /> Không có webcam? Bấm để tải ảnh lên
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button secondary full"
                            onClick={() => void switchToCamera()}
                          >
                            <Camera size={15} /> Quay lại Camera trực tiếp
                          </button>
                        )}
                      </div>
                    )}

                    {/* Friendly warm hint card */}
                    <div className="locket-studio-hint-card">
                      <Sparkles size={16} className="locket-studio-hint-icon" />
                      <span>
                        <strong>Mẹo Locket:</strong> Khoảnh khắc chân thật, không cầu kỳ. Ảnh sẽ xuất hiện ngay trên dòng thời gian và màn hình bạn bè!
                      </span>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => void handleFileChange(e)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHẾ ĐỘ 2: BẢNG TIN DÒNG THỜI GIAN (EXPANSIVE FULL-WIDTH GRID)
           ══════════════════════════════════════════════════════════════════ */}
        {pageMode === 'timeline' && (
          <div className="locket-timeline-section">
            <div className="locket-timeline-header">
              <div className="locket-feed-filter-pills">
                <button
                  type="button"
                  className={`locket-feed-filter-btn ${feedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('all')}
                >
                  <Sparkles size={14} /> Tất cả
                </button>
                <button
                  type="button"
                  className={`locket-feed-filter-btn ${feedFilter === 'friends' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('friends')}
                >
                  <Users size={14} /> Bạn bè
                </button>
                <button
                  type="button"
                  className={`locket-feed-filter-btn ${feedFilter === 'my' ? 'active' : ''}`}
                  onClick={() => setFeedFilter('my')}
                >
                  <Camera size={14} /> Của tôi
                </button>
              </div>

              <button
                type="button"
                className="button primary small"
                onClick={() => {
                  setPageMode('studio')
                  if (captureSource === 'camera') {
                    void startCamera()
                  }
                }}
              >
                <PlusCircle size={15} /> Chụp khoảnh khắc mới
              </button>
            </div>

            {/* Danh sách Widgets Expansive Grid */}
            {loadingFeed ? (
              <div className="locket-empty-state">
                <RefreshCw size={28} className="locket-spinner" />
                <span>Đang tải những khoảnh khắc Locket mới nhất…</span>
              </div>
            ) : lockets.length === 0 ? (
              <div className="locket-empty-state">
                <div className="locket-empty-icon">
                  <Camera size={40} />
                </div>
                <h3>Chưa có khoảnh khắc Locket nào</h3>
                <p>
                  {feedFilter === 'friends'
                    ? 'Bạn bè của bạn chưa đăng khoảnh khắc nào. Hãy kết bạn hoặc gửi tấm Locket đầu tiên!'
                    : feedFilter === 'my'
                    ? 'Bạn chưa đăng khoảnh khắc nào. Hãy gửi tấm ảnh Locket đầu tiên nhé!'
                    : 'Bảng tin Locket đang yên bình. Hãy ghi lại khoảnh khắc đầu tiên của ngày hôm nay!'}
                </p>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => setPageMode('studio')}
                >
                  <Camera size={16} /> Chụp Locket ngay
                </button>
              </div>
            ) : (
              <div className="locket-widgets-grid">
                {lockets.map(item => {
                  const isMine = user && item.user_id === user.id
                  return (
                    <article className="locket-widget-card" key={item.id}>
                      {/* Header Widget: Người gửi & Thời gian */}
                      <div className="locket-widget-header">
                        <div className="locket-widget-author">
                          <span className="locket-author-avatar">
                            {item.owner?.avatar_url ? (
                              <img src={item.owner.avatar_url} alt="" />
                            ) : (
                              item.owner?.display_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </span>
                          <div className="locket-author-text">
                            <strong>{item.owner?.display_name || 'Thành viên'}</strong>
                            <small>{formatTimeAgo(item.created_at)}</small>
                          </div>
                        </div>

                        {isMine && (
                          <ConfirmDialog
                            title="Xóa khoảnh khắc"
                            message="Bạn có chắc chắn muốn xóa bức ảnh Locket này?"
                            onConfirm={() => void handleDelete(item.id)}
                          >
                            {(open) => (
                              <button
                                type="button"
                                className="locket-delete-btn"
                                onClick={open}
                                title="Xóa ảnh này"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </ConfirmDialog>
                        )}
                      </div>

                      {/* Khung ảnh Squircle chuẩn Locket */}
                      <div
                        className="locket-widget-photo-wrap"
                        onClick={() => setLightboxLocket(item)}
                        title="Nhấp để phóng to"
                      >
                        <img src={item.image_url} alt={item.caption || 'Locket'} />
                        <div className="locket-photo-time-badge">
                          <span>{formatTimeAgo(item.created_at)}</span>
                        </div>
                        <div className="locket-photo-zoom-hint">
                          <Maximize2 size={14} />
                        </div>
                      </div>

                      {/* Caption nếu có */}
                      {item.caption && (
                        <p className="locket-widget-caption">“{item.caption}”</p>
                      )}

                      {/* Hàng thả cảm xúc nhanh */}
                      <div className="locket-reactions-bar">
                        {REACTION_EMOJIS.map(emoji => {
                          const count = (item.reactions?.[emoji] || []).length
                          const hasReacted = user && (item.reactions?.[emoji] || []).includes(user.id)
                          return (
                            <button
                              key={emoji}
                              type="button"
                              className={`locket-react-btn ${hasReacted ? 'reacted' : ''}`}
                              onClick={() => void handleReact(item.id, emoji)}
                            >
                              <span className="react-emoji">{emoji}</span>
                              {count > 0 && <span className="react-count">{count}</span>}
                            </button>
                          )
                        })}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL LIGHTBOX: XEM ẢNH FULL KÍCH THƯỚC (WARM FROSTED DESIGN)
           ══════════════════════════════════════════════════════════════════ */}
        {lightboxLocket && (
          <div className="locket-lightbox-overlay" onClick={() => setLightboxLocket(null)}>
            <div className="locket-lightbox-card" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="locket-lightbox-close"
                onClick={() => setLightboxLocket(null)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>

              <div className="locket-lightbox-photo-wrap">
                <img
                  src={lightboxLocket.image_url}
                  alt={lightboxLocket.caption || 'Locket Full'}
                  className="locket-lightbox-img"
                />
                <div className="locket-lightbox-time-pill">
                  <Sparkles size={13} />
                  {formatTimeAgo(lightboxLocket.created_at)}
                </div>
              </div>

              <div className="locket-lightbox-details">
                <div className="locket-lightbox-header">
                  <div className="locket-author-info">
                    <span className="locket-author-avatar">
                      {lightboxLocket.owner?.avatar_url ? (
                        <img src={lightboxLocket.owner.avatar_url} alt="" />
                      ) : (
                        lightboxLocket.owner?.display_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </span>
                    <strong>{lightboxLocket.owner?.display_name || 'Thành viên'}</strong>
                  </div>
                  <a
                    href={lightboxLocket.image_url}
                    download={`locket-${lightboxLocket.id}.jpg`}
                    className="button secondary small"
                    title="Tải ảnh về máy"
                  >
                    <Download size={14} /> Tải về
                  </a>
                </div>

                {lightboxLocket.caption && (
                  <p className="locket-lightbox-story">{lightboxLocket.caption}</p>
                )}

                {/* Reactions in lightbox */}
                <div className="locket-reactions-bar">
                  {REACTION_EMOJIS.map(emoji => {
                    const count = (lightboxLocket.reactions?.[emoji] || []).length
                    const hasReacted = user && (lightboxLocket.reactions?.[emoji] || []).includes(user.id)
                    return (
                      <button
                        key={emoji}
                        type="button"
                        className={`locket-react-btn ${hasReacted ? 'reacted' : ''}`}
                        onClick={() => void handleReact(lightboxLocket.id, emoji)}
                      >
                        <span className="react-emoji">{emoji}</span>
                        {count > 0 && <span className="react-count">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireUser>
  )
}
