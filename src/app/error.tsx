'use client'

import Link from 'next/link'
import { Home, RefreshCw } from 'lucide-react'

export default function GlobalRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', background: '#0f172a', color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ fontSize: '3.5rem' }}>⚠️</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Une erreur est survenue</h1>
      <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.92rem', maxWidth: 320, margin: 0 }}>
        Réessayez ou revenez à l&apos;accueil.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 14, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={16} /> Réessayer
        </button>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 14, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 800, textDecoration: 'none' }}>
          <Home size={18} /> Accueil
        </Link>
      </div>
    </main>
  )
}
