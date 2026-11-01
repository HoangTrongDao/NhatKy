import { Sparkles } from 'lucide-react'

export default function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state compact">
      <div className="empty-icon"><Sparkles /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
