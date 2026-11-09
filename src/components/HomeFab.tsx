'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'

/** Bouton flottant "Accueil" : retour à la page d'accueil en un tap depuis l'espace marchand / admin. */
export default function HomeFab() {
  const pathname = usePathname()
  if (pathname.startsWith('/merchant/products/new') || pathname.includes('/edit')) return null
  return (
    <Link
      href="/"
      aria-label="Retour à l'accueil"
      style={{
        position: 'fixed', left: 12,
        bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px) + 12px)',
        zIndex: 800, display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white',
        padding: '10px 14px', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem',
        textDecoration: 'none', boxShadow: '0 6px 18px rgba(234,88,12,0.45)',
        touchAction: 'manipulation',
      }}
    >
      <Home size={16} /> Accueil
    </Link>
  )
}
