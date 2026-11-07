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
      addToast('Chờ tý nhé, hihi...', 'info')
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
      addToast('Lỗi rồi, thử lại đi...', 'error')
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
      addToast('Ôi,thử ảnh khác đi bạn...', 'error')
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
      addToast('Ảnh đẹp quá, hihi... ✨', 'success')
      // Chuyển sang Dòng thời gian để xem ngay khoảnh khắc vừa đăng
      setPageMode('timeline')
      void loadFeed()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Thử lại nhé...', 'error')
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
      addToast('Lỗi bảng tin...', 'error')
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
      addToast('Lỗi cảm xúc r...', 'error')
      void loadFeed()
    }
  }

  // Xóa Locket
  const handleDelete = async (locketId: number) => {
    try {
      await deleteLocket(locketId)
      setLockets(prev => prev.filter(item => item.id !== locketId))
      if (lightboxLocket?.id === locketId) setLightboxLocket(null)
      addToast('Delete.', 'info')
    } catch {
      addToast('Không thể xóa khoảng khắc này...', 'error')
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
      <div className="page subpage locket-page-wrapper">
        <PageHeader
          eyebrow="CamNK"
          title="Chia sẻ Ảnh đi."
          description="Mời bạn chụp ảnh..."
          icon={<Camera />}
        />

        {/* ── Mode Navigation Bar: Chụp Locket vs Dòng thời gian ── */}
        <div className="NK-nav-mode-bar">
          <div className="NK-nav-mode-pills">
            <button
              type="button"
              className={`NK-mode-btn ${pageMode === 'studio' ? 'active' : ''}`}
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
              className={`NK-mode-btn ${pageMode === 'timeline' ? 'active' : ''}`}
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
            CHẾ ĐỘ 1: STUDIO CHỤP LOCKET (IPHONE VIEW-FINDER DESIGN)
           ══════════════════════════════════════════════════════════════════ */}
        {pageMode === 'studio' && (
          <div className="NK-studio-container">
            <div className="NK-studio-card">
              {/* Toggle Source: Camera vs Tải ảnh */}
              {!capturedPhoto && (
                <div className="NK-source-toggle">
                  <button
                    type="button"
                    className={`NK-source-btn ${captureSource === 'camera' ? 'active' : ''}`}
                    onClick={() => void switchToCamera()}
                  >
                    <Camera size={14} /> Camera trực tiếp
                  </button>
                  <button
                    type="button"
                    className={`NK-source-btn ${captureSource === 'upload' ? 'active' : ''}`}
                    onClick={switchToUpload}
                  >
                    <ImageIcon size={14} /> Tải ảnh lên
                  </button>
                </div>
              )}

              {/* Viewfinder Squircle (Khung hình chính) */}
              <div className={`NK-viewfinder ${isFlashActive ? 'flash' : ''}`}>
                {capturedPhoto ? (
                  /* Ảnh đã chụp / tải lên -> Xem trước & Thêm caption */
                  <div className="NK-snap-preview">
                    <img src={capturedPhoto} alt="Captured Locket" className="NK-snap-img" />
                    <div className="NK-overlay-top">
                      <span className="NK-pill">
                        <Sparkles size={12} /> Khoảnh khắc vừa chụp
                      </span>
                    </div>

                    {/* Floating Caption Input */}
                    <div className="NK-floating-caption">
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
                    <div className="NK-live-stream-box">
                      <video
                        ref={bindVideoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedData={() => setIsVideoReady(true)}
                        onCanPlay={() => setIsVideoReady(true)}
                        className="NK-video-stream"
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                      />

                      {(cameraLoading || !isVideoReady) && (
                        <div className="NK-camera-loading-overlay">
                          <RefreshCw size={26} className="NK-spinner" />
                          <span>Đang kết nối camera...</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="NK-flip-btn"
                        onClick={() => void toggleFacingMode()}
                        title="Đổi camera trước/sau"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  ) : cameraError ? (
                    /* Lỗi mở Camera -> Hiển thị chuyển nhanh sang tải ảnh */
                    <div className="NK-camera-fallback">
                      <AlertCircle size={40} color="#f87171" />
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
                    <div className="NK-dropzone" onClick={() => void startCamera()}>
                      <div className="NK-dropzone-icon">
                        <Camera size={34} />
                      </div>
                      <strong>Bật Camera NK</strong>
                      <p>Nhấp vào đây để mở camera và bắt đầu chụp ảnh trực tiếp</p>
                      <button type="button" className="button primary small" style={{ marginTop: 6 }}>
                        Mở Camera ngay
                      </button>
                    </div>
                  )
                ) : (
                  /* Chế độ Tải ảnh (Dropzone) */
                  <div
                    className={`NK-dropzone ${isDragOver ? 'dragover' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={e => void handleDrop(e)}
                  >
                    <div className="NK-dropzone-icon">
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

              {/* Điều khiển chụp & gửi */}
              <div className="NK-controls-container">
                {capturedPhoto ? (
                  /* Form xuất bản ảnh */
                  <div className="NK-publish-box">
                    {/* Chọn đối tượng xem */}
                    <div className="NK-vis-selector">
                      <button
                        type="button"
                        className={`NK-vis-btn ${visibility === 'friends' ? 'active' : ''}`}
                        onClick={() => setVisibility('friends')}
                      >
                        <Users size={14} /> Bạn bè
                      </button>
                      <button
                        type="button"
                        className={`NK-vis-btn ${visibility === 'public' ? 'active' : ''}`}
                        onClick={() => setVisibility('public')}
                      >
                        <Globe size={14} /> Công khai
                      </button>
                      <button
                        type="button"
                        className={`NK-vis-btn ${visibility === 'private' ? 'active' : ''}`}
                        onClick={() => setVisibility('private')}
                      >
                        <Lock size={14} /> Riêng tư
                      </button>
                    </div>

                    <div className="NK-action-btns">
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
                ) : (
                  /* Nút bổ trợ dưới đáy Studio */
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {captureSource === 'camera' ? (
                      <button
                        type="button"
                        className="button secondary full"
                        onClick={switchToUpload}
                      >
                        <ImageIcon size={15} /> Bạn không có webcam? Bấm để tải ảnh lên
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
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHẾ ĐỘ 2: BẢNG TIN DÒNG THỜI GIAN (REAL iOS LOCKET WIDGETS)
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

            {/* Danh sách Widgets */}
            {loadingFeed ? (
              <div className="locket-empty-state">
                <RefreshCw size={28} className="NK-spinner" />
                <span>Đang tải những khoảnh khắc NK mới nhất…</span>
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
              <div className="NK-widgets-grid">
                {lockets.map(item => {
                  const isMine = user && item.user_id === user.id
                  return (
                    <article className="NK-widget-card" key={item.id}>
                      {/* Header Widget: Người gửi & Thời gian */}
                      <div className="NK-widget-header">
                        <div className="NK-widget-author">
                          <span className="NK-author-avatar">
                            {item.owner?.avatar_url ? (
                              <img src={item.owner.avatar_url} alt="" />
                            ) : (
                              item.owner?.display_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </span>
                          <div className="NK-author-text">
                            <strong>{item.owner?.display_name || 'Thành viên'}</strong>
                            <small>{formatTimeAgo(item.created_at)}</small>
                          </div>
                        </div>

                        {isMine && (
                          <ConfirmDialog
                            title="Xóa khoảnh khắc"
                            message="Suy nghĩ lại đi, nên xóa nó không..?"
                            onConfirm={() => void handleDelete(item.id)}
                          >
                            {(open) => (
                              <button
                                type="button"
                                className="NK-delete-btn"
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
                        className="NK-widget-photo-wrap"
                        onClick={() => setLightboxLocket(item)}
                        title="Nhấp để phóng to"
                      >
                        <img src={item.image_url} alt={item.caption || 'Locket'} />
                        <div className="locket-photo-time-badge">
                          <span>{formatTimeAgo(item.created_at)}</span>
                        </div>
                        <div className="NK-photo-zoom-hint">
                          <Maximize2 size={14} />
                        </div>
                      </div>

                      {/* Caption nếu có */}
                      {item.caption && (
                        <p className="NK-widget-caption">“{item.caption}”</p>
                      )}

                      {/* Hàng thả cảm xúc nhanh */}
                      <div className="NK-reactions-bar">
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
            MODAL LIGHTBOX: XEM ẢNH FULL KÍCH THƯỚC
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
