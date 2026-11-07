import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react'
import {
  Camera, RefreshCw, Send, Image as ImageIcon, Sparkles,
  Users, Globe, Lock, Trash2, Maximize2, X, Download
} from 'lucide-react'
import { User, LocketItem, fetchLocketFeed, fetchMyLockets, fetchFriendsLockets, createLocket, reactToLocket, deleteLocket, compressImageDataUrl } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'

const REACTION_EMOJIS = ['❤️', '🔥', '🥰', '😂', '✨']

export default function LocketPage({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'my'>('all')
  const [lockets, setLockets] = useState<LocketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  /* ── Camera State ── */
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<'friends' | 'public' | 'private'>('friends')
  const [isFlashActive, setIsFlashActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Lightbox State ── */
  const [lightboxLocket, setLightboxLocket] = useState<LocketItem | null>(null)

  const { addToast } = useToast()

  // Callback ref: gắn kết stream vào thẻ video ngay lập tức khi thẻ video xuất hiện trong DOM
  const bindVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current
      }
      node.onloadedmetadata = () => {
        node.play().catch(e => console.warn('Video play caught:', e))
      }
      node.play().catch(e => console.warn('Video play caught:', e))
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

  // Khởi động webcam với cơ chế đa tầng fallback (HD -> FacingMode -> Generic Video)
  const startCamera = async (targetMode?: 'user' | 'environment') => {
    const mode = targetMode || facingMode
    setCameraError(null)
    setCameraLoading(true)
    setIsVideoReady(false)

    // Dừng track cũ trước khi mở luồng mới
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop() } catch {}
      })
      streamRef.current = null
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt hoặc môi trường hiện tại không hỗ trợ camera trực tiếp. Bạn hãy bấm "Chọn ảnh từ thư viện" bên dưới.')
      setCameraLoading(false)
      setIsCameraActive(false)
      return
    }

    try {
      let stream: MediaStream | null = null

      // Tầng 1: Thử độ phân giải 16:9 chuẩn (tương thích hầu hết webcam máy tính và điện thoại)
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
        // Tầng 2: Thử chỉ với facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
            },
            audio: false,
          })
        } catch (err2) {
          console.warn('Tier 2 failed, falling back to generic video...', err2)
          // Tầng 3: Nhận bất kỳ luồng video nào từ thiết bị
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
        }
      }

      if (!stream) {
        throw new Error('Không thể nhận luồng hình ảnh từ camera.')
      }

      streamRef.current = stream
      setIsCameraActive(true)

      // Gắn trực tiếp nếu node đã tồn tại
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play caught:', e))
        }
        videoRef.current.play().catch(e => console.warn('Video play caught:', e))
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      let msg = 'Không thể mở camera trên thiết bị.'
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Quyền truy cập Camera đã bị từ chối. Vui lòng cho phép quyền Camera trong cài đặt trình duyệt để tiếp tục.'
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị camera khả dụng trên máy của bạn.'
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'Camera đang bị ứng dụng khác (Zoom, Teams, v.v.) chiếm dụng hoặc gặp xung đột phần cứng.'
      } else if (err?.name === 'OverconstrainedError') {
        msg = 'Camera không đáp ứng thông số video yêu cầu.'
      }
      setCameraError(`${msg} Bạn có thể chọn tải ảnh từ máy.`)
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

  // Chụp ảnh trực tiếp từ live camera
  const capturePhoto = async () => {
    if (!videoRef.current) return
    const video = videoRef.current

    const width = video.videoWidth || 640
    const height = video.videoHeight || 640
    if (width === 0 || height === 0) {
      addToast('Camera đang khởi động, vui lòng đợi trong giây lát...', 'info')
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
      // Nếu là camera trước, lật ảnh ngang để ảnh chụp khớp với hình ảnh phản chiếu người dùng thấy
      if (facingMode === 'user') {
        ctx.translate(size, 0)
        ctx.scale(-1, 1)
      }

      // Cắt khung vuông hoàn hảo ở tâm video
      const sx = (width - size) / 2
      const sy = (height - size) / 2
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
      const rawData = canvas.toDataURL('image/jpeg', 0.92)
      const optimized = await compressImageDataUrl(rawData, 1080, 0.85)
      setCapturedPhoto(optimized)
      stopCamera()
    }
  }

  // Tải ảnh từ thư viện thiết bị
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
    } finally {
      e.target.value = ''
    }
  }

  // Hủy ảnh / Chụp lại
  const retakePhoto = () => {
    setCapturedPhoto(null)
    setCaption('')
    startCamera()
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
      addToast('Đã gửi khoảnh khắc Locket thành công!', 'success')
      loadFeed()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Không gửi được Locket.', 'error')
    } finally {
      setSending(false)
    }
  }

  // Tải bảng tin Locket
  const loadFeed = async () => {
    setLoading(true)
    try {
      let data: LocketItem[] = []
      if (activeTab === 'all') {
        data = await fetchLocketFeed()
      } else if (activeTab === 'friends') {
        data = await fetchFriendsLockets()
      } else {
        data = await fetchMyLockets()
      }
      setLockets(data)
    } catch {
      addToast('Không thể tải bảng tin Locket.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadFeed()
    }
  }, [user, activeTab])

  // Thả cảm xúc
  const handleReact = async (locketId: number, emoji: string) => {
    if (!user) return
    try {
      // Cập nhật lạc quan trên UI
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
      loadFeed()
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
      <div className="page subpage locket-page-container">
        <PageHeader
          eyebrow="LOCKET KHOẢNH KHẮC"
          title="Chia sẻ khoảnh khắc chụp nhanh."
          description="Chụp ảnh trực tiếp từ camera hoặc tải ảnh lên để gửi ngay khoảnh khắc ấm áp đến bạn bè và cộng đồng."
          icon={<Camera />}
        />

        <div className="locket-main-layout">
          {/* ════════════════════════════════════════════════════
              CỘT TRÁI: CAMERA VIEW / CAPTURE WIDGET
             ════════════════════════════════════════════════════ */}
          <section className="locket-camera-card">
            <div className="locket-camera-header">
              <span className="locket-badge-live">
                <span className="live-dot" /> LIVE LOCKET
              </span>
              <h3>Chụp khoảnh khắc</h3>
            </div>

            {/* Viewfinder frame */}
            <div className={`locket-viewfinder ${isFlashActive ? 'flash' : ''}`}>
              {capturedPhoto ? (
                /* Đã chụp xong -> Xem trước & Thêm chú thích */
                <div className="locket-snap-preview">
                  <img src={capturedPhoto} alt="Captured Locket" className="locket-snap-img" />
                  <div className="locket-overlay-top">
                    <span className="locket-pill">
                      <Sparkles size={12} /> Khoảnh khắc vừa chụp
                    </span>
                  </div>
                  {caption.trim() && (
                    <div className="locket-overlay-bottom">
                      <span className="locket-caption-pill">{caption}</span>
                    </div>
                  )}
                </div>
              ) : isCameraActive ? (
                /* Đang mở Camera trực tiếp */
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
                      <RefreshCw size={24} className="locket-spinner" />
                      <span>Đang kết nối camera...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="locket-flip-btn"
                    onClick={toggleFacingMode}
                    title="Đổi camera trước/sau"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              ) : (
                /* Chưa mở camera -> Nút bật camera hoặc tải ảnh */
                <div className="locket-camera-placeholder">
                  <div className="locket-cam-icon-circle">
                    <Camera size={36} />
                  </div>
                  <strong>Sẵn sàng ghi lại khoảnh khắc?</strong>
                  <p>Bật camera để chụp trực tiếp hoặc tải ảnh từ máy</p>
                  <button type="button" className="button primary" onClick={() => void startCamera()}>
                    <Camera size={16} /> Mở Camera trực tiếp
                  </button>
                  {cameraError && <span className="locket-error-tag">{cameraError}</span>}
                </div>
              )}
            </div>

            {/* Điều khiển Camera / Gửi khoảnh khắc */}
            <div className="locket-camera-controls">
              {capturedPhoto ? (
                /* Form gửi */
                <div className="locket-publish-box">
                  <div className="locket-caption-input-wrap">
                    <input
                      type="text"
                      placeholder="Viết một ghi chú ngắn cho khoảnh khắc này…"
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      maxLength={140}
                      autoFocus
                    />
                    <small>{caption.length}/140</small>
                  </div>

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
                      onClick={handleSendLocket}
                      disabled={sending}
                    >
                      <Send size={15} /> {sending ? 'Đang gửi…' : 'Gửi Locket ✨'}
                    </button>
                  </div>
                </div>
              ) : isCameraActive ? (
                /* Nút chụp */
                <div className="locket-shutter-bar">
                  <button
                    type="button"
                    className="locket-gallery-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn từ thư viện"
                  >
                    <ImageIcon size={20} />
                  </button>

                  <button
                    type="button"
                    className="locket-shutter-button"
                    onClick={capturePhoto}
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
                /* Nút tải ảnh ngoài */
                <div className="locket-alt-upload">
                  <button
                    type="button"
                    className="button secondary full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} /> Chọn ảnh từ thư viện thiết bị
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </section>

          {/* ════════════════════════════════════════════════════
              CỘT PHẢI: FEED KHOẢNH KHẮC LOCKET
             ════════════════════════════════════════════════════ */}
          <section className="locket-feed-card">
            {/* Header Tabs */}
            <div className="locket-tabs-header">
              <button
                type="button"
                className={`locket-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Sparkles size={15} /> Tất cả
              </button>
              <button
                type="button"
                className={`locket-tab ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                <Users size={15} /> Bạn bè
              </button>
              <button
                type="button"
                className={`locket-tab ${activeTab === 'my' ? 'active' : ''}`}
                onClick={() => setActiveTab('my')}
              >
                <Camera size={15} /> Của tôi
              </button>
            </div>

            {/* Danh sách Locket */}
            {loading ? (
              <div className="locket-loading-state">
                <RefreshCw size={28} className="locket-spinner" />
                <span>Đang tải những khoảnh khắc mới nhất…</span>
              </div>
            ) : lockets.length === 0 ? (
              <div className="locket-empty-state">
                <div className="locket-empty-icon">
                  <Camera size={44} />
                </div>
                <h3>Chưa có khoảnh khắc Locket nào</h3>
                <p>
                  {activeTab === 'friends'
                    ? 'Bạn bè của bạn chưa đăng khoảnh khắc nào. Hãy kết bạn hoặc là người đầu tiên gửi Locket!'
                    : activeTab === 'my'
                    ? 'Bạn chưa chụp khoảnh khắc nào. Hãy bật camera để gửi tấm ảnh đầu tiên!'
                    : 'Bảng tin Locket đang yên bình. Hãy ghi lại khoảnh khắc đầu tiên của ngày hôm nay!'}
                </p>
                <button type="button" className="button primary" onClick={() => void startCamera()}>
                  <Camera size={16} /> Chụp Locket ngay
                </button>
              </div>
            ) : (
              <div className="locket-feed-grid">
                {lockets.map(item => {
                  const isMine = user && item.user_id === user.id
                  return (
                    <article className="locket-item-card" key={item.id}>
                      <div className="locket-item-widget">
                        {/* Ảnh Locket squircle */}
                        <div
                          className="locket-item-photo-wrap"
                          onClick={() => setLightboxLocket(item)}
                          title="Nhấp để phóng to"
                        >
                          <img src={item.image_url} alt={item.caption || 'Locket'} className="locket-item-photo" />

                          {/* Time badge */}
                          <div className="locket-photo-time-badge">
                            <span>{formatTimeAgo(item.created_at)}</span>
                          </div>

                          {/* Zoom icon hint */}
                          <div className="locket-photo-zoom-hint">
                            <Maximize2 size={15} />
                          </div>
                        </div>

                        {/* Thông tin người gửi */}
                        <div className="locket-author-row">
                          <div className="locket-author-info">
                            <span className="locket-author-avatar">
                              {item.owner?.avatar_url ? (
                                <img src={item.owner.avatar_url} alt="" />
                              ) : (
                                item.owner?.display_name?.charAt(0).toUpperCase() || 'U'
                              )}
                            </span>
                            <span className="locket-author-name">
                              {item.owner?.display_name || 'Thành viên'}
                            </span>
                          </div>

                          {isMine && (
                            <ConfirmDialog
                              title="Xóa khoảnh khắc"
                              message="Bạn có chắc chắn muốn xóa bức ảnh Locket này?"
                              onConfirm={() => handleDelete(item.id)}
                            >
                              {(open) => (
                                <button
                                  type="button"
                                  className="locket-delete-btn"
                                  onClick={open}
                                  title="Xóa ảnh này"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </ConfirmDialog>
                          )}
                        </div>

                        {/* Caption nếu có */}
                        {item.caption && (
                          <p className="locket-item-caption">{item.caption}</p>
                        )}

                        {/* Hàng thả cảm xúc nhanh */}
                        <div className="locket-quick-reactions">
                          {REACTION_EMOJIS.map(emoji => {
                            const count = (item.reactions?.[emoji] || []).length
                            const hasReacted = user && (item.reactions?.[emoji] || []).includes(user.id)
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={`locket-react-btn ${hasReacted ? 'reacted' : ''}`}
                                onClick={() => handleReact(item.id, emoji)}
                              >
                                <span className="react-emoji">{emoji}</span>
                                {count > 0 && <span className="react-count">{count}</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            MODAL LIGHTBOX: XEM ẢNH FULL KÍCH THƯỚC
           ════════════════════════════════════════════════════ */}
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
                        onClick={() => handleReact(lightboxLocket.id, emoji)}
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
