'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { User, ShoppingBag, Store, ChevronDown, ClipboardList } from 'lucide-react'

/**
 * Menu "Connexion" de la navbar. L'authentification est TOUJOURS facultative
 * pour l'acheteur : la navigation et la commande restent possibles sans compte.
 */
export default function AuthMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  const item: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    textDecoration: 'none', color: '#111827', borderBottom: '1px solid #f3f4f6',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="btn-auth-menu"
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, height: compact ? 44 : 38,
          padding: compact ? '0 12px' : '0 14px', borderRadius: compact ? 10 : 8,
          border: '1px solid #e5e7eb', background: 'white', color: '#374151',
          fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', minHeight: 'auto',
        }}
      >
        <User size={compact ? 18 : 15} /> Connexion
        <ChevronDown size={14} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 290, zIndex: 300,
            background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
          }}
        >
          <Link href="/login?role=buyer" role="menuitem" style={item} onClick={() => setOpen(false)}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={18} color="#2D6BE4" />
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem' }}>Je suis acheteur</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Facultatif · retrouver mes commandes</span>
            </span>
          </Link>
          <Link href="/login?role=merchant" role="menuitem" style={item} onClick={() => setOpen(false)}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={18} color="#f97316" />
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem' }}>Je suis marchand</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Gérer ma boutique et mes commandes</span>
            </span>
          </Link>
          <Link href="/mes-commandes" role="menuitem" style={{ ...item, borderBottom: 'none', background: '#f9fafb' }} onClick={() => setOpen(false)}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={18} color="#16a34a" />
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: '0.88rem' }}>Suivre ma commande</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Sans compte</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
