'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Store, ClipboardList, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ComptePage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<{ role: string | null } | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      setUser(data.user ? { role: (data.user.app_metadata?.role as string) ?? null } : null)
    )
  }, [supabase])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const row = (href: string, icon: React.ReactNode, bg: string, title: string, sub: string) => (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '14px 14px', textDecoration: 'none', border: '1px solid #e5e7eb' }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>{title}</span>
        <span style={{ display: 'block', fontSize: '0.74rem', color: '#6b7280', marginTop: 2 }}>{sub}</span>
      </span>
      <ChevronRight size={18} color="#9ca3af" />
    </Link>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 6, display: 'flex', cursor: 'pointer', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>Mon compte</h1>
      </header>
      <main style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560, margin: '0 auto' }}>
        {user === undefined && <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>Chargement…</p>}

        {user === null && (<>
          <p style={{ color: '#6b7280', fontSize: '0.84rem', lineHeight: 1.6, margin: '4px 4px 6px' }}>
            Vous n'avez pas besoin de compte pour acheter sur Jokoo. Connectez-vous seulement si vous le souhaitez.
          </p>
          {row('/login?role=buyer', <ShoppingBag size={20} color="#2D6BE4" />, '#eff6ff', 'Je suis acheteur', 'Facultatif · retrouver mes commandes')}
          {row('/login?role=merchant', <Store size={20} color="#f97316" />, '#fff7ed', 'Je suis marchand', 'Gérer ma boutique et mes commandes')}
          {row('/mes-commandes', <ClipboardList size={20} color="#16a34a" />, '#f0fdf4', 'Suivre ma commande', 'Sans compte · commandes de cet appareil')}
        </>)}

        {user && (<>
          {user.role === 'merchant' && row('/merchant/dashboard', <LayoutDashboard size={20} color="#f97316" />, '#fff7ed', 'Mon espace marchand', 'Tableau de bord, produits, commandes')}
          {row('/mes-commandes', <ClipboardList size={20} color="#16a34a" />, '#f0fdf4', 'Mes commandes', 'Suivi de mes achats')}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px', cursor: 'pointer', textAlign: 'left', minHeight: 'auto' }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={20} color="#dc2626" /></span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#dc2626' }}>Se déconnecter</span>
          </button>
        </>)}
      </main>
    </div>
  )
}
