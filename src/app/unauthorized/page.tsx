'use client'

import Link from 'next/link'
import { Shield, Home, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen gradient-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }} className="animate-fade-in">
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'hsl(0 72% 55% / 0.15)', border: '1px solid hsl(0 72% 55% / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Shield size={36} color="hsl(0 72% 65%)" />
        </div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Accès refusé</h1>
        <p style={{ color: 'hsl(220 15% 60%)', marginBottom: 32, lineHeight: 1.7 }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => history.back()} className="btn btn-secondary">
            <ArrowLeft size={16} /> Retour
          </button>
          <Link href="/" className="btn btn-primary">
            <Home size={16} /> Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
