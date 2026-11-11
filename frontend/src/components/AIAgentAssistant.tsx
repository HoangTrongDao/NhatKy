import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ChevronRight,
  Zap
} from 'lucide-react'
import { User } from '../api'

export interface AIAgentAssistantProps {
  user?: User | null
}

interface AgentAction {
  label: string
  path: string
  icon?: string
}

interface Message {
  id: string
  sender: 'agent' | 'user'
  text: string
  actions?: AgentAction[]
  timestamp: string
}

const MAX_MESSAGES = 30

const QUICK_INQUIRIES = [
  {
    label: '📱 Cách tải app về điện thoại',
    query: 'Cách tải app về điện thoại như thế nào?'
  },
  {
    label: '💭 Gợi ý viết nhật ký hôm nay',
    query: 'Gợi ý giúp mình vài ý tưởng viết nhật ký hôm nay nhé!'
  },
  {
    label: '📸 Hướng dẫn dùng Locket',
    query: 'Hướng dẫn mình cách dùng tính năng ảnh Locket với bạn bè'
  },
  {
    label: '🎯 Đặt mục tiêu tương lai',
    query: 'Làm thế nào để đặt mục tiêu hiệu quả cho lứa tuổi 16-22?'
  },
  {
    label: '🌱 Góc chiêm nghiệm chữa lành',
    query: 'Góc chiêm nghiệm là gì và giúp chữa lành cảm xúc ra sao?'
  },
  {
    label: '🔒 Bảo mật nhật ký của tôi',
    query: 'Dữ liệu và nhật ký của tôi có được bảo mật an toàn không?'
  }
]

export default function AIAgentAssistant({ user }: AIAgentAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const navigate = useNavigate()

  // Initial welcome message tailored for Gen Z (16-22)
  const initialMessages: Message[] = useMemo(() => [
    {
      id: 'welcome-1',
      sender: 'agent',
      text: user
        ? `Chào ${user.display_name} iu! ✨ Mình là AI Đồng Hành của bạn. Mình ở đây để gợi ý viết nhật ký chữa lành, chia sẻ ảnh Locket, đặt mục tiêu hay hướng dẫn bạn cài app về điện thoại nè. Bạn muốn khám phá điều gì trước?`
        : `Chào bạn iu! ✨ Mình là AI Đồng Hành của bạn tại Nhật Ký New Beginning. Mình ở đây để giúp bạn lưu giữ thanh xuân, gợi ý viết nhật ký, chụp ảnh Locket và kết nối bạn thân không áp lực. Bạn cần mình hỗ trợ gì nè?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Gợi Ý Viết Nhật Ký', path: '/memories' },
        { label: 'Thử Locket Ngay', path: '/locket' }
      ]
    }
  ], [user])

  const [messages, setMessages] = useState<Message[]>(initialMessages)

  // Safe timeout tracking to guarantee zero memory leaks
  const timeoutsRef = useRef<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id))
    timeoutsRef.current = []
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [])

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      const scrollTimer = window.setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
      timeoutsRef.current.push(scrollTimer)
    }
  }, [messages, isTyping, isOpen])

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen) {
      const focusTimer = window.setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
      timeoutsRef.current.push(focusTimer)
    }
  }, [isOpen])

  // Token estimate computation (~1 token per 3.5 chars)
  const estimatedTokens = useMemo(() => {
    const totalChars = messages.reduce((acc, m) => acc + m.text.length, 0)
    return Math.max(18, Math.round(totalChars / 3.5))
  }, [messages])

  // Smart intent processor providing empathetic, inspiring, concise Gen Z responses
  const generateAgentResponse = (userQuery: string): { text: string; actions?: AgentAction[] } => {
    const q = userQuery.toLowerCase().trim()

    // 1. App Download / PWA / Install
    if (q.includes('tải app') || q.includes('cài đặt') || q.includes('download') || q.includes('pwa') || q.includes('điện thoại')) {
      return {
        text: `Dễ ợt luôn bạn iu ơi! Ứng dụng là **PWA (Progressive Web App)** siêu nhẹ, không tốn dung lượng máy:\n\n• **iPhone (iOS Safari):** Chạm nút **Chia sẻ** (icon ô vuông có mũi tên lên) ➡️ Chọn **'Thêm vào MH chính' (Add to Home Screen)**.\n• **Android (Chrome):** Chạm menu 3 chấm góc phải trên ➡️ Chọn **'Cài đặt ứng dụng'** (Install App).\n\nSau khi cài, bạn có icon riêng ngoài màn hình, lướt êm ru, nhận thông báo đẩy tức thì và mở nhanh ngay cả khi mạng yếu!`,
        actions: [
          { label: 'Về Trang Chủ Cài Đặt', path: '/' },
          { label: 'Trang Cá Nhân', path: '/profile' }
        ]
      }
    }

    // 2. Journal Prompts / Memories
    if (q.includes('gợi ý') || q.includes('viết nhật ký') || q.includes('hôm nay viết gì') || q.includes('ý tưởng') || q.includes('ký ức')) {
      return {
        text: `Nếu hôm nay lòng bạn có chút bộn bề hoặc chưa biết bắt đầu từ đâu, hãy thử 3 gợi ý nhỏ này nhé:\n\n1. **Khoảnh khắc đáng yêu:** Hôm nay điều gì nhỏ bé làm bạn mỉm cười? (Ly trà sữa, bài hát ngẫu nhiên, hay ánh hoàng hôn chiều nay?)\n2. **Giải tỏa lòng mình:** Có áp lực hay cảm xúc nào bạn chưa dám nói ra? Hãy gửi vào trang nhật ký để nhẹ lòng hơn.\n3. **Tự hào về bản thân:** Một điều bạn cảm thấy biết ơn chính mình hôm nay là gì?\n\nViết cho chính bạn thôi, không cần trau chuốt câu từ đâu nè ✨`,
        actions: [
          { label: 'Mở Ký Ức Ngay', path: '/memories' },
          { label: 'Góc Chiêm Nghiệm', path: '/reflections' }
        ]
      }
    }

    // 3. Locket Camera & Moments
    if (q.includes('locket') || q.includes('chụp') || q.includes('ảnh') || q.includes('khoảnh khắc') || q.includes('camera')) {
      return {
        text: `Tính năng **Locket** là nơi cất giữ những khoảnh khắc chân thật nhất cùng hội bạn thân:\n\n• **Kính ngắm Squircle sống động:** Chụp ảnh nhanh, lưu lại từng ánh mắt nụ cười đời thường.\n• **Không áp lực:** Không đếm Like, không đua view hay so đo tương tác - chỉ có sự kết nối chân thành.\n• **Tức thì:** Bạn bè mở ứng dụng là thấy ngay khoảnh khắc mới nhất bạn vừa gửi gắm!\n\nThử chụp một bức ảnh Locket ngay bây giờ không nè?`,
        actions: [
          { label: 'Thử Locket Ngay', path: '/locket' },
          { label: 'Tìm Bạn Thân', path: '/friends' }
        ]
      }
    }

    // 4. Goals & Future
    if (q.includes('mục tiêu') || q.includes('tương lai') || q.includes('kế hoạch') || q.includes('phát triển') || q.includes('ước mơ')) {
      return {
        text: `Tuổi 16 đến 22 là thời điểm vàng để bạn khám phá chính mình! Bí quyết là chia nhỏ mục tiêu theo 3 khía cạnh:\n\n• **Học tập & Kỹ năng:** Học 1 kỹ năng mới mỗi quý, đọc 10 trang sách hoặc luyện ngoại ngữ 15 phút mỗi ngày.\n• **Sức khỏe & Thể chất:** Ngủ trước 23h30, uống đủ 2L nước và vận động thể thao nhẹ nhàng.\n• **Tâm hồn & Trải nghiệm:** Dành thời gian viết nhật ký, kết nối bạn bè và khám phá những vùng đất mới.\n\nTừng bước nhỏ mỗi ngày sẽ tạo nên một phiên bản rực rỡ nhất của bạn!`,
        actions: [
          { label: 'Đặt Mục Tiêu Ngay', path: '/goals' },
          { label: 'Theo Dõi Tiến Độ', path: '/goals' }
        ]
      }
    }

    // 5. Healing & Reflections
    if (q.includes('chiêm nghiệm') || q.includes('chữa lành') || q.includes('buồn') || q.includes('áp lực') || q.includes('stress') || q.includes('mệt')) {
      return {
        text: `Mình ở đây lắng nghe bạn nè ❤️ Tuổi trẻ đôi lúc chênh vênh và nhiều áp lực thi cử, định hướng, nhưng hãy nhớ rằng bạn đã cố gắng rất nhiều rồi.\n\n• Bạn không cần phải luôn tỏ ra mạnh mẽ.\n• Mọi cảm xúc đều đáng được lắng nghe và vỗ về.\n• Dành vài phút trong **Góc Chiêm Nghiệm** để ghi lại cảm xúc, đúc kết bài học và khép lại những muộn phiền để bước tiếp vững vàng nhé!`,
        actions: [
          { label: 'Vào Góc Chiêm Nghiệm', path: '/reflections' },
          { label: 'Đọc Lại Ký Ức Đẹp', path: '/memories' }
        ]
      }
    }

    // 6. Privacy & Security
    if (q.includes('bảo mật') || q.includes('an toàn') || q.includes('riêng tư') || q.includes('lộ') || q.includes('mật khẩu')) {
      return {
        text: `Nhật ký của bạn là không gian thiêng liêng nhất! Bạn hoàn toàn an tâm:\n\n• **Mặc định riêng tư 100%:** Chỉ mình bạn được xem các dòng ký ức và cảm xúc cá nhân.\n• **Không quảng cáo rác:** Không có thuật toán theo dõi hay bán dữ liệu người dùng.\n• **Chủ động chia sẻ:** Bạn toàn quyền quyết định bài viết nào chia sẻ cho bạn thân hay cộng đồng.\n\nKhông gian riêng tư tuyệt đối cho tâm hồn bạn!`,
        actions: [
          { label: 'Kiểm Tra Trang Cá Nhân', path: '/profile' }
        ]
      }
    }

    // 7. Friends & Social
    if (q.includes('bạn bè') || q.includes('kết bạn') || q.includes('tin nhắn') || q.includes('chat')) {
      return {
        text: `Kết nối trên New Beginning cực kỳ ấm áp và chân thành:\n\n• Tìm kiếm bạn bè qua email hoặc tên hiển thị.\n• Trò chuyện bảo mật qua Hộp Tin Nhắn với thông báo thời gian thực.\n• Gửi ảnh Locket tức thì để cùng nhau chia sẻ thanh xuân rực rỡ!`,
        actions: [
          { label: 'Khám Phá Bạn Bè', path: '/friends' },
          { label: 'Mở Tin Nhắn', path: '/messages' }
        ]
      }
    }

    // 8. Greetings & Fallback
    if (q.includes('chào') || q.includes('hi') || q.includes('hello') || q.includes('ơi')) {
      return {
        text: `Chào bạn iu nha! ✨ Mình luôn ở đây sẵn sàng đồng hành cùng bạn. Bạn muốn mình gợi ý viết nhật ký hôm nay, hướng dẫn chụp ảnh Locket, hay đặt mục tiêu cho tuần mới nè?`,
        actions: [
          { label: 'Gợi Ý Viết Nhật Ký', path: '/memories' },
          { label: 'Thử Locket Ngay', path: '/locket' }
        ]
      }
    }

    return {
      text: `Cảm ơn bạn iu đã chia sẻ nè! ✨ Mình là AI Đồng Hành hỗ trợ bạn khám phá mọi tính năng của New Beginning. Bạn có thể chọn các chủ đề nhanh bên dưới hoặc hỏi mình về cách viết nhật ký, chụp ảnh Locket, đặt mục tiêu hay tải app nha!`,
      actions: [
        { label: 'Mở Ký Ức', path: '/memories' },
        { label: 'Đặt Mục Tiêu', path: '/goals' }
      ]
    }
  }

  const handleSend = (textToSend?: string) => {
    const rawContent = textToSend !== undefined ? textToSend : input
    const trimmed = rawContent.trim()
    if (!trimmed || isTyping) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Enforce bounded buffer (max 30 messages) to avoid memory leaks & token explosion
    setMessages(prev => {
      const updated = [...prev, userMessage]
      return updated.slice(-MAX_MESSAGES)
    })

    setInput('')
    setIsTyping(true)

    // Simulate smart empathetic response generation with safe timeout
    const thinkingDelay = Math.min(600, 320 + Math.random() * 200)
    const replyTimer = window.setTimeout(() => {
      const { text, actions } = generateAgentResponse(trimmed)
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text,
        actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => {
        const updated = [...prev, agentMessage]
        return updated.slice(-MAX_MESSAGES)
      })
      setIsTyping(false)
    }, thinkingDelay)

    timeoutsRef.current.push(replyTimer)
  }

  const handleResetHistory = () => {
    clearAllTimeouts()
    setIsTyping(false)
    setMessages(initialMessages)
  }

  const handleActionClick = (path: string) => {
    navigate(path)
  }

  return (
    <>
      {/* ── Scoped Minimalist Styling for Butter + Slate Blue Theme ── */}
      <style>{`
        /* Floating Action Button (FAB) */
        .ai-agent-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px 10px 14px;
          border-radius: 9999px;
          border: 1px solid var(--butter-border, #ede4d3);
          background: linear-gradient(135deg, var(--butter-50, #fffdfa) 0%, var(--butter-100, #fefaf0) 100%);
          box-shadow: 0 8px 24px -4px rgba(84, 65, 48, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
          color: var(--slate-900, #1a2233);
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          user-select: none;
        }
        .ai-agent-fab:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 28px -4px rgba(84, 65, 48, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);
          border-color: #dfd4c0;
        }
        .ai-agent-fab:active {
          transform: translateY(0) scale(0.98);
        }
        .ai-agent-fab-icon-box {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fcead2 0%, #f6deb5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #92541a;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6);
        }
        .ai-agent-fab-badge {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--slate-900, #1a2233);
        }
        .ai-agent-fab-dot {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid #ffffff;
        }

        /* Responsive placement on mobile so it doesn't cover the bottom navigation bar */
        @media (max-width: 768px) {
          .ai-agent-fab {
            bottom: calc(82px + env(safe-area-inset-bottom, 12px));
            right: 16px;
            padding: 8px 14px 8px 10px;
          }
          .ai-agent-fab-badge {
            font-size: 12.5px;
          }
          .ai-agent-fab-icon-box {
            width: 28px;
            height: 28px;
          }
        }

        /* ── Minimalist Assistant Popover Dialog ── */
        /* ABSOLUTELY NO backdrop dark overlay - it must NOT darken the UI ('không làm tối ui hiện tại') */
        .ai-agent-dialog {
          position: fixed;
          bottom: 86px;
          right: 28px;
          width: 380px;
          max-width: calc(100vw - 32px);
          height: 540px;
          max-height: calc(100vh - 120px);
          background: var(--butter-50, #fffdfa);
          border: 1px solid var(--butter-border, #ede4d3);
          border-radius: 20px;
          box-shadow: 0 18px 48px -8px rgba(43, 54, 76, 0.16), 0 4px 16px rgba(246, 238, 219, 0.5), 0 0 0 1px rgba(237, 228, 211, 0.8);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          animation: aiAgentSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes aiAgentSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .ai-agent-dialog {
            bottom: calc(134px + env(safe-area-inset-bottom, 12px));
            right: 16px;
            width: calc(100vw - 32px);
            height: 500px;
            max-height: calc(100vh - 160px);
          }
        }

        /* Header */
        .ai-agent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--butter-100, #fefaf0);
          border-bottom: 1px solid var(--butter-border, #ede4d3);
        }
        .ai-agent-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-agent-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #fcead2 0%, #f6deb5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #92541a;
          box-shadow: 0 2px 6px rgba(146, 84, 26, 0.12);
        }
        .ai-agent-header-titles {
          display: flex;
          flex-direction: column;
        }
        .ai-agent-header-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--slate-900, #1a2233);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-agent-header-status {
          font-size: 11px;
          color: #059669;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
        .ai-agent-header-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
        }
        .ai-agent-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-agent-tool-btn {
          background: transparent;
          border: none;
          color: var(--slate-600, #4f6080);
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-agent-tool-btn:hover {
          background: rgba(59, 75, 104, 0.08);
          color: var(--slate-900, #1a2233);
        }

        /* Token & Memory Bar */
        .ai-agent-token-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px;
          background: var(--butter-200, #fbf5e6);
          border-bottom: 1px solid rgba(237, 228, 211, 0.7);
          font-size: 10.5px;
          color: var(--slate-600, #4f6080);
          font-weight: 500;
        }
        .ai-agent-token-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.7);
          padding: 2px 7px;
          border-radius: 6px;
          border: 1px solid rgba(237, 228, 211, 0.8);
          font-weight: 600;
          color: var(--slate-800, #2b364c);
        }

        /* Messages Body */
        .ai-agent-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 14px 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--butter-50, #fffdfa);
        }
        .ai-agent-body::-webkit-scrollbar {
          width: 5px;
        }
        .ai-agent-body::-webkit-scrollbar-thumb {
          background: #ede4d3;
          border-radius: 4px;
        }

        /* Message Bubbles */
        .ai-agent-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 88%;
        }
        .ai-agent-row-agent {
          align-self: flex-start;
        }
        .ai-agent-row-user {
          align-self: flex-end;
        }

        .ai-agent-bubble {
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
        }
        .ai-agent-bubble-agent {
          background: #ffffff;
          color: var(--slate-800, #2b364c);
          border: 1px solid var(--butter-border, #ede4d3);
          border-radius: 16px 16px 16px 4px;
          box-shadow: 0 2px 8px rgba(84, 65, 48, 0.04);
        }
        .ai-agent-bubble-user {
          background: var(--slate-800, #2b364c);
          color: #ffffff;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 2px 8px rgba(43, 54, 76, 0.16);
        }

        .ai-agent-msg-time {
          font-size: 9.5px;
          color: #8f8578;
          padding: 0 4px;
        }
        .ai-agent-row-user .ai-agent-msg-time {
          align-self: flex-end;
          color: #8b99ad;
        }

        /* Action Buttons within Agent Response */
        .ai-agent-actions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .ai-agent-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 8px;
          background: var(--butter-100, #fefaf0);
          border: 1px solid var(--butter-border, #ede4d3);
          color: var(--slate-900, #1a2233);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-agent-action-btn:hover {
          background: #ffffff;
          border-color: #c9ba9e;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(84, 65, 48, 0.08);
        }

        /* Quick Inquiry Chips Carousel */
        .ai-agent-chips-tray {
          padding: 8px 12px;
          background: var(--butter-100, #fefaf0);
          border-top: 1px solid var(--butter-border, #ede4d3);
          display: flex;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
        }
        .ai-agent-chips-tray::-webkit-scrollbar {
          display: none;
        }
        .ai-agent-chip {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid var(--butter-border, #ede4d3);
          color: var(--slate-800, #2b364c);
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ai-agent-chip:hover {
          background: var(--butter-200, #fbf5e6);
          border-color: #d1c4ae;
          transform: translateY(-1px);
        }

        /* Typing Indicator */
        .ai-agent-typing-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid var(--butter-border, #ede4d3);
          border-radius: 14px;
          width: fit-content;
        }
        .ai-agent-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--slate-600, #4f6080);
          animation: aiAgentBounce 1.2s infinite ease-in-out;
        }
        .ai-agent-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .ai-agent-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes aiAgentBounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Input Bar */
        .ai-agent-footer {
          padding: 10px 12px;
          background: var(--butter-50, #fffdfa);
          border-top: 1px solid var(--butter-border, #ede4d3);
        }
        .ai-agent-input-form {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid var(--butter-border, #ede4d3);
          border-radius: 12px;
          padding: 4px 6px 4px 12px;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: border-color 0.2s;
        }
        .ai-agent-input-form:focus-within {
          border-color: var(--slate-700, #3b4b68);
          box-shadow: 0 0 0 2px rgba(59, 75, 104, 0.1);
        }
        .ai-agent-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          color: var(--slate-900, #1a2233);
          background: transparent;
        }
        .ai-agent-input::placeholder {
          color: #9c8e7e;
        }
        .ai-agent-send-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--slate-800, #2b364c);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ai-agent-send-btn:hover:not(:disabled) {
          background: var(--slate-900, #1a2233);
          transform: scale(1.05);
        }
        .ai-agent-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Floating Launcher Trigger (.ai-agent-fab) ── */}
      <button
        className="ai-agent-fab"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Mở AI Đồng Hành hỗ trợ nhật ký"
        aria-expanded={isOpen}
      >
        <span className="ai-agent-fab-icon-box">
          <Sparkles size={17} />
          <span className="ai-agent-fab-dot" />
        </span>
        <span className="ai-agent-fab-badge">AI Đồng Hành</span>
      </button>

      {/* ── Minimalist Assistant Popover Dialog (.ai-agent-dialog) ── */}
      {/* ABSOLUTELY NO backdrop dark overlay - it must NOT darken the UI ('không làm tối ui hiện tại') */}
      {isOpen && (
        <aside className="ai-agent-dialog" aria-label="Khung trò chuyện cùng AI Đồng Hành">
          {/* Header */}
          <header className="ai-agent-header">
            <div className="ai-agent-header-left">
              <div className="ai-agent-avatar">
                <Sparkles size={18} />
              </div>
              <div className="ai-agent-header-titles">
                <span className="ai-agent-header-title">
                  AI Đồng Hành
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f3e8d2', color: '#7c4e1f' }}>
                    16-22
                  </span>
                </span>
                <span className="ai-agent-header-status">
                  <span className="ai-agent-header-status-dot" />
                  Luôn lắng nghe & thấu cảm
                </span>
              </div>
            </div>

            <div className="ai-agent-header-actions">
              <button
                className="ai-agent-tool-btn"
                onClick={handleResetHistory}
                title="Làm mới hội thoại (Giải phóng bộ nhớ)"
                aria-label="Làm mới hội thoại"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="ai-agent-tool-btn"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ trợ lý"
                aria-label="Thu nhỏ trợ lý"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* Token & Memory Bar */}
          <div className="ai-agent-token-bar">
            <span>Tối ưu token & không tràn bộ nhớ</span>
            <span className="ai-agent-token-badge">
              <Zap size={11} color="#d97706" />
              ~{estimatedTokens} tokens • Max {MAX_MESSAGES} tin
            </span>
          </div>

          {/* Messages Body */}
          <div className="ai-agent-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-agent-row ${msg.sender === 'agent' ? 'ai-agent-row-agent' : 'ai-agent-row-user'}`}
              >
                <div
                  className={`ai-agent-bubble ${
                    msg.sender === 'agent' ? 'ai-agent-bubble-agent' : 'ai-agent-bubble-user'
                  }`}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* Navigation Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="ai-agent-actions-list">
                      {msg.actions.map((act) => (
                        <button
                          key={act.path + act.label}
                          className="ai-agent-action-btn"
                          onClick={() => handleActionClick(act.path)}
                        >
                          {act.label}
                          <ChevronRight size={13} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="ai-agent-msg-time">{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="ai-agent-typing-row">
                <span className="ai-agent-typing-dot" />
                <span className="ai-agent-typing-dot" />
                <span className="ai-agent-typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiry Chips */}
          <div className="ai-agent-chips-tray" aria-label="Gợi ý câu hỏi nhanh">
            {QUICK_INQUIRIES.map((chip) => (
              <button
                key={chip.label}
                className="ai-agent-chip"
                onClick={() => handleSend(chip.query)}
                disabled={isTyping}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <footer className="ai-agent-footer">
            <form
              className="ai-agent-input-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="ai-agent-input"
                placeholder="Hỏi AI Đồng Hành điều gì nè..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={250}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="ai-agent-send-btn"
                disabled={!input.trim() || isTyping}
                aria-label="Gửi tin nhắn"
              >
                <Send size={15} />
              </button>
            </form>
          </footer>
        </aside>
      )}
    </>
  )
}
