import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administration — Jokoo',
  description: 'Panneau de contrôle super administrateur',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(222 47% 8%)' }}>
      {children}
    </div>
  )
}
