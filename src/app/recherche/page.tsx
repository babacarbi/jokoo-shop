'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, SlidersHorizontal, X, Loader2, ShoppingCart } from 'lucide-react'

const ORANGE = '#f97316'
const CATEGORIES = [
  { id: 'c6272313-cad1-4679-aba5-59dbcf9ad3b5', name: 'Mode & Vêtements' },
]

type P = { id: string; name: string; price: number; oldPrice: number | null; shop: string; img: string | null }
const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA'

function SearchInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [q, setQ] = useState(sp.get('q') ?? '')
  const [sort, setSort] = useState('new')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [cat, setCat] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [items, setItems] = useState<P[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cats, setCats] = useState<{ id: string; name: string }[]>(CATEGORIES)
  const reqId = useRef(0)

  useEffect(() => {
    fetch('/api/search/categories').then(r => r.ok ? r.json() : null).then(d => { if (d?.categories?.length) setCats(d.categories) }).catch(() => {})
  }, [])

  const run = useCallback(async (reset: boolean, nextPage: number) => {
    const id = ++reqId.current
    setLoading(true)
    const params = new URLSearchParams({ q, sort, page: String(nextPage) })
    if (min) params.set('min', min); if (max) params.set('max', max); if (cat) params.set('cat', cat)
    try {
      const r = await fetch(`/api/search?${params}`)
      const d = await r.json()
      if (id !== reqId.current) return
      setItems(prev => reset ? d.products : [...prev, ...d.products])
      setTotal(d.total); setHasMore(d.hasMore); setPage(nextPage)
    } catch {}
    if (id === reqId.current) setLoading(false)
  }, [q, sort, min, max, cat])

  // recherche automatique (anti-rebond 350 ms)
  useEffect(() => {
    const t = setTimeout(() => run(true, 0), 350)
    return () => clearTimeout(t)
  }, [run])

  const activeFilters = [min, max, cat].filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px) + 24px)' }}>
      <div style={{ background: 'white', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} aria-label="Retour" style={{ background: 'none', border: 'none', padding: 8, display: 'flex', minHeight: 'auto' }}><ArrowLeft size={20} color="#374151" /></button>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input autoFocus type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Produit, marque…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 34px 11px 36px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', fontSize: '0.9rem', outline: 'none' }} />
          {q && <button onClick={() => setQ('')} aria-label="Effacer" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 6, minHeight: 'auto', display: 'flex' }}><X size={16} color="#9ca3af" /></button>}
        </div>
        <button onClick={() => setShowFilters(s => !s)} aria-label="Filtres"
          style={{ position: 'relative', background: showFilters || activeFilters ? ORANGE : 'white', color: showFilters || activeFilters ? 'white' : '#374151', border: '1.5px solid ' + (activeFilters || showFilters ? ORANGE : '#e5e7eb'), borderRadius: 12, padding: 10, display: 'flex', minHeight: 'auto' }}>
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#111827', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
        </button>
      </div>

      {showFilters && (
        <div style={{ background: 'white', padding: '12px 14px', borderBottom: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" inputMode="numeric" placeholder="Prix min" value={min} onChange={e => setMin(e.target.value)} style={inp} />
            <input type="number" inputMode="numeric" placeholder="Prix max" value={max} onChange={e => setMax(e.target.value)} style={inp} />
          </div>
          <select value={cat} onChange={e => setCat(e.target.value)} style={inp}>
            <option value="">Toutes les catégories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {activeFilters > 0 && <button onClick={() => { setMin(''); setMax(''); setCat('') }} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', textAlign: 'left', minHeight: 'auto' }}>Réinitialiser les filtres</button>}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{loading && items.length === 0 ? 'Recherche…' : `${total} résultat${total > 1 ? 's' : ''}`}</span>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 8px', fontSize: '0.78rem', background: 'white' }}>
          <option value="new">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
      </div>

      {!loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Aucun produit trouvé</div>
          <div style={{ fontSize: '0.82rem' }}>Essayez un autre mot ou retirez les filtres.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '0 12px' }}>
          {items.map(p => (
            <Link key={p.id} href={`/produit/${p.id}`} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '1', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.img ? <img src={p.img} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingCart size={32} color="#d1d5db" />}
              </div>
              <div style={{ padding: '8px 10px 12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.6em' }}>{p.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af', margin: '2px 0 4px' }}>{p.shop}</div>
                <div style={{ fontWeight: 900, color: '#111827', fontSize: '0.88rem' }}>{fmt(p.price)}</div>
                {p.oldPrice ? <div style={{ fontSize: '0.7rem', color: '#9ca3af', textDecoration: 'line-through' }}>{fmt(p.oldPrice)}</div> : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="animate-spin" size={24} color={ORANGE} /></div>}
      {!loading && hasMore && (
        <div style={{ padding: '16px 12px' }}>
          <button onClick={() => run(false, page + 1)} style={{ width: '100%', background: 'white', border: `2px solid ${ORANGE}`, color: ORANGE, borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: '0.9rem', minHeight: 'auto' }}>Voir plus de produits</button>
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = { flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.88rem', background: 'white', boxSizing: 'border-box', width: '100%' }

export default function SearchPage() {
  return <Suspense fallback={null}><SearchInner /></Suspense>
}
