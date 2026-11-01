import { ReactNode } from 'react'

export default function PageHeader({ eyebrow, title, description, icon }: {
  eyebrow: string; title: string; description: string; icon: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="page-header-icon">{icon}</div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
