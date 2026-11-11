import { ReactNode } from 'react'

export type PageHeaderVariant = 'memories' | 'reflections' | 'goals' | 'community' | 'locket' | 'friends' | 'default'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  icon?: ReactNode
  variant?: PageHeaderVariant
}

function resolveVariant(variant?: PageHeaderVariant, title?: string, eyebrow?: string): PageHeaderVariant {
  if (variant && variant !== 'default') return variant
  const text = `${eyebrow || ''} ${title || ''}`.toLowerCase()
  if (text.includes('ký ức') || text.includes('kỷ niệm') || text.includes('memory') || text.includes('memories')) return 'memories'
  if (text.includes('nhìn lại') || text.includes('suy ngẫm') || text.includes('reflection') || text.includes('bài học')) return 'reflections'
  if (text.includes('ngày mai') || text.includes('mục tiêu') || text.includes('kế hoạch') || text.includes('goal')) return 'goals'
  if (text.includes('cộng đồng') || text.includes('chia sẻ') || text.includes('community')) return 'community'
  if (text.includes('locket') || text.includes('ảnh') || text.includes('khoảnh khắc')) return 'locket'
  if (text.includes('bạn bè') || text.includes('kết nối') || text.includes('friends')) return 'friends'
  return variant || 'default'
}

export default function PageHeader({ eyebrow, title, description, icon, variant }: PageHeaderProps) {
  const activeVariant = resolveVariant(variant, title, eyebrow)
  return (
    <div className={`page-header page-header-${activeVariant}`}>
      {icon && (
        <div className={`page-header-icon page-header-icon-embossed page-header-icon-${activeVariant}`}>
          {icon}
        </div>
      )}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}

