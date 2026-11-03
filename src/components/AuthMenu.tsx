'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { User, ShoppingBag, Store, ChevronDown, ClipboardList, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * Menu "Connexion" de la navbar. L'authentification est TOUJOURS facultative
 * pour l'acheteur : la navigation et la commande restent possibles sans compte.
 */
export default function AuthMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<{ role: string | null; label: string } | null>(null)

  useEffect(() => {
    const toState = (u: any) => u
      ? { role: (u.app_metadata?.role as string) ?? null, label: (u.user_metadata?.full_name || u.user_metadata?.name || u.phone || 'Mon compte') as string }
      : null
    supabase.auth.getUser().then(({ data }) => setUser(toState(data.user)))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(toState(session?.user)))
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  async function logout() {
    setOpen(false)
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

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
        <User size={compact ? 18 : 15} /> {user ? (user.role === 'merchant' ? 'Mon espace' : 'Mon compte') : 'Connexion'}
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
          {user ? (
            <>
              {user.role === 'merchant' && (
                <Link href="/merchant/dashboard" role="menuitem" style={item} onClick={() => setOpen(false)}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LayoutDashboard size={18} color="#f97316" />
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Tableau de bord</span>
                </Link>
              )}
              <Link href="/mes-commandes" role="menuitem" style={item} onClick={() => setOpen(false)}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={18} color="#16a34a" />
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Mes commandes</span>
              </Link>
              <button type="button" role="menuitem" onClick={logout} style={{ ...item, width: '100%', border: 'none', background: '#fef2f2', cursor: 'pointer', textAlign: 'left', minHeight: 'auto' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LogOut size={18} color="#dc2626" />
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#dc2626' }}>Se déconnecter</span>
              </button>
            </>
          ) : (<>
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
          </>)}
        </div>
      )}
    </div>
  )
}
