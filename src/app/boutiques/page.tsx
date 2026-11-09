'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Store, MapPin, Package, ArrowRight, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ShopRow { id: string; name: string; slug: string | null; city: string | null; country: string | null; description: string | null; logo_url: string | null; count: number }

export default function BoutiquesPage() {
  const router = useRouter()
  const [shops, setShops] = useState<ShopRow[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('shops').select('id, name, slug, city, country, description, logo_url, status').eq('status', 'active'),
        supabase.from('products').select('shop_id').eq('status', 'active'),
      ])
      const counts: Record<string, number> = {}
      ;(p ?? []).forEach((r: any) => { counts[r.shop_id] = (counts[r.shop_id] || 0) + 1 })
      setShops(((s ?? []) as any[]).map(x => ({ ...x, count: counts[x.id] || 0 })).sort((a, b) => b.count - a.count))
    })().catch(() => setShops([]))
  }, [])

  const list = (shops ?? []).filter(s => {
    const t = q.trim().toLowerCase()
    return !t || s.name.toLowerCase().includes(t) || (s.city ?? '').toLowerCase().includes(t)
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 6, display: 'flex', cursor: 'pointer', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <Link href="/" aria-label="Accueil Jokoo" style={{ display: 'flex' }}>
          <img src="/logos/logo-jokoo-cart.png" alt="Jokoo" style={{ height: 30, width: 'auto' }} />
        </Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.98rem', color: '#111827', margin: 0, marginLeft: 'auto' }}>Boutiques</h1>
      </header>

      <main style={{ padding: 12, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une boutique…" style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', padding: '0 14px 0 40px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {shops === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" size={28} color="#f97316" /></div>}

        {shops !== null && list.length === 0 && (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '44px 20px', border: '1px solid #e5e7eb' }}>
            <Store size={44} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 800, color: '#111827' }}>Aucune boutique trouvée</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(s => (
            <Link key={s.id} href={`/boutique/${s.slug ?? s.id}`} style={{ background: 'white', borderRadius: 16, padding: 14, textDecoration: 'none', border: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'center' }}>
              {s.logo_url
                ? <img src={s.logo_url} alt={s.name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Store size={24} color="#f97316" /></div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.98rem', color: '#111827' }}>{s.name}</div>
                {s.description && <div style={{ fontSize: '0.76rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.74rem', color: '#6b7280', flexWrap: 'wrap' }}>
                  {(s.city || s.country) && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {[s.city, s.country].filter(Boolean).join(', ')}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} /> {s.count} produit{s.count > 1 ? 's' : ''}</span>
                </div>
              </div>
              <ArrowRight size={18} color="#9ca3af" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
