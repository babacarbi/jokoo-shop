'use client'

import Link from 'next/link'
import { WifiOff, RefreshCw, Home } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(222 47% 8%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'hsl(32 95% 55% / 0.15)',
          border: '1px solid hsl(32 95% 55% / 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <WifiOff size={36} color="hsl(32 95% 65%)" />
        </div>

        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem',
          fontWeight: 800, color: 'white', marginBottom: 12
        }}>
          Pas de connexion
        </h1>
        <p style={{ color: 'hsl(220 15% 60%)', marginBottom: 32, lineHeight: 1.7 }}>
          Vous êtes hors ligne. Vérifiez votre connexion internet et réessayez.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, hsl(220 90% 56%), hsl(142 72% 45%))',
              color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            <RefreshCw size={16} /> Réessayer
          </button>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10,
            border: '1px solid hsl(222 25% 28%)',
            background: 'hsl(222 40% 14%)',
            color: 'hsl(220 15% 80%)', fontWeight: 600,
            textDecoration: 'none', fontSize: '0.9rem'
          }}>
            <Home size={16} /> Accueil
          </Link>
        </div>

        <p style={{ marginTop: 32, fontSize: '0.8rem', color: 'hsl(220 15% 45%)' }}>
          💡 Certaines pages sont disponibles hors ligne
        </p>
      </div>
    </div>
  )
}
