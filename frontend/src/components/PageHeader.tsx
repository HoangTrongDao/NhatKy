import { ReactNode } from 'react'

export default function PageHeader({ eyebrow, title, description, icon }: {
  eyebrow?: string; title: string; description?: string; icon?: ReactNode
}) {
  return (
    <div className="page-header">
      {icon && <div className="page-header-icon">{icon}</div>}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}
