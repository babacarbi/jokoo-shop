import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', background: '#0f172a', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ fontSize: '3.5rem' }}>🧭</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Page introuvable</h1>
      <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.92rem', maxWidth: 320, margin: 0 }}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '13px 22px', borderRadius: 14, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
        <Home size={18} /> Retour à l&apos;accueil
      </Link>
    </main>
  )
}
