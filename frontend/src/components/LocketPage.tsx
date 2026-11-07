import { useState, useEffect, useRef, ChangeEvent } from 'react'
import {
  Camera, RefreshCw, Send, Image as ImageIcon, Sparkles,
  Users, Globe, Lock, Trash2, Maximize2, X, Download
} from 'lucide-react'
import { User, LocketItem, fetchLocketFeed, fetchMyLockets, fetchFriendsLockets, createLocket, reactToLocket, deleteLocket } from '../api'
import { useToast } from './Toast'
import RequireUser from './RequireUser'
import PageHeader from './PageHeader'
import ConfirmDialog from './ConfirmDialog'

const REACTION_EMOJIS = ['❤️', '🔥', '🥰', '😂', '✨']

/**
 * Nén ảnh sang JPEG chất lượng cao phía client bằng Canvas
 */
function compressImageDataUrl(dataUrl: string, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export default function LocketPage({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'my'>('all')
  const [lockets, setLockets] = useState<LocketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  /* ── Camera State ── */
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<'friends' | 'public' | 'private'>('friends')
  const [isFlashActive, setIsFlashActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Lightbox State ── */
  const [lightboxLocket, setLightboxLocket] = useState<LocketItem | null>(null)

  const { addToast } = useToast()

  // Start webcam
  const startCamera = async () => {
    stopCamera()
    setCameraError(null)
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraActive(true)
    } catch {
      setCameraError('Không thể mở camera trên thiết bị. Bạn có thể chọn tải ảnh từ thư viện.')
      setIsCameraActive(false)
    }
  }

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  // Flip front/back camera
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  useEffect(() => {
    if (isCameraActive && !capturedPhoto) {
      startCamera()
    }
    return () => stopCamera()
  }, [facingMode])

  // Snap photo from live camera
  const capturePhoto = async () => {
    if (!videoRef.current) return
    const video = videoRef.current

    // Trigger visual flash
    setIsFlashActive(true)
    setTimeout(() => setIsFlashActive(false), 150)

    const canvas = document.createElement('canvas')
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640)
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Crop square from video center
      const sx = ((video.videoWidth || size) - size) / 2
      const sy = ((video.videoHeight || size) - size) / 2
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)
      const rawData = canvas.toDataURL('image/jpeg', 0.9)
      const optimized = await compressImageDataUrl(rawData, 1080, 0.85)
      setCapturedPhoto(optimized)
      stopCamera()
    }
  }

  // Pick photo from file input
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

  // Discard / Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null)
    setCaption('')
    startCamera()
  }

  // Submit / Send Locket
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

  // Load Locket Feed
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

  // React to Locket
  const handleReact = async (locketId: number, emoji: string) => {
    if (!user) return
    try {
      // Optimistic update
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

  // Delete Locket
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
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="locket-video-stream"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
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
                  <button type="button" className="button primary" onClick={startCamera}>
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

              {/* Input file ẩn */}
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
              CỘT PHẢI: BẢNG TIN KHOẢNH KHẮC LOCKET (FEED)
             ════════════════════════════════════════════════════ */}
          <section className="locket-feed-card">
            {/* Thanh Tab phân loại */}
            <div className="locket-tab-bar">
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
              <div className="locket-loading-grid">
                <div className="locket-skeleton-card" />
                <div className="locket-skeleton-card" />
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
                <button type="button" className="button primary" onClick={startCamera}>
                  <Camera size={16} /> Chụp Locket ngay
                </button>
              </div>
            ) : (
              <div className="locket-feed-grid">
                {lockets.map(item => {
                  const isOwner = user?.id === item.user_id
                  return (
                    <article className="locket-post-card" key={item.id}>
                      {/* Locket Header */}
                      <div className="locket-post-header">
                        <div className="locket-author-info">
                          <span className="locket-author-avatar">
                            {item.owner?.avatar_url ? (
                              <img src={item.owner.avatar_url} alt="" />
                            ) : (
                              item.owner?.display_name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </span>
                          <div>
                            <strong>{item.owner?.display_name || 'Thành viên'}</strong>
                            <small>{formatTimeAgo(item.created_at)}</small>
                          </div>
                        </div>

                        {/* Visibility & Actions */}
                        <div className="locket-post-actions">
                          <span className="locket-vis-pill" title={item.visibility}>
                            {item.visibility === 'public' ? (
                              <Globe size={12} />
                            ) : item.visibility === 'private' ? (
                              <Lock size={12} />
                            ) : (
                              <Users size={12} />
                            )}
                          </span>

                          {isOwner && (
                            <ConfirmDialog
                              title="Xóa khoảnh khắc Locket"
                              message="Bạn có chắc chắn muốn xóa khoảnh khắc này?"
                              onConfirm={() => handleDelete(item.id)}
                            >
                              {open => (
                                <button
                                  type="button"
                                  className="locket-del-btn"
                                  onClick={open}
                                  title="Xóa khoảnh khắc"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </ConfirmDialog>
                          )}
                        </div>
                      </div>

                      {/* Locket Image Squircle */}
                      <div
                        className="locket-post-img-frame"
                        onClick={() => setLightboxLocket(item)}
                        title="Chạm để xem ảnh toàn màn hình"
                      >
                        <img src={item.image_url} alt={item.caption || 'Locket'} loading="lazy" />

                        {/* Frosted caption pill */}
                        {item.caption && (
                          <div className="locket-overlay-bottom">
                            <span className="locket-caption-pill">{item.caption}</span>
                          </div>
                        )}

                        <span className="locket-tap-hint">
                          <Maximize2 size={13} />
                        </span>
                      </div>

                      {/* Interactive Emoji Reaction Bar */}
                      <div className="locket-reactions-bar">
                        {REACTION_EMOJIS.map(emoji => {
                          const count = (item.reactions?.[emoji] || []).length
                          const hasReacted = user && (item.reactions?.[emoji] || []).includes(user.id)
                          return (
                            <button
                              key={emoji}
                              type="button"
                              className={`locket-react-btn ${hasReacted ? 'reacted' : ''}`}
                              onClick={() => handleReact(item.id, emoji)}
                              title={`Thả cảm xúc ${emoji}`}
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
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            LIGHTBOX XEM ẢNH FULLSCREEN
           ════════════════════════════════════════════════════ */}
        {lightboxLocket && (
          <div
            className="locket-lightbox-overlay"
            onClick={() => setLightboxLocket(null)}
            role="dialog"
            aria-modal="true"
          >
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
