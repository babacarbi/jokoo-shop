'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { getOrderByTrackingToken } from '@/app/actions'

const BLUE = '#2D6BE4'

type Saved = { token: string; name: string; shop: string; date: string }
type Live = {
  product_name: string
  product_img: string | null
  price: number
  quantity: number
  shop_name: string
  status: string
  created_at: string
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  new:              { label: 'Commande reçue',        color: '#2D6BE4', bg: '#eff6ff' },
  processing:       { label: 'En préparation',        color: '#d97706', bg: '#fffbeb' },
  out_for_delivery: { label: 'En cours de livraison', color: '#7c3aed', bg: '#f5f3ff' },
  delivered_paid:   { label: 'Livrée',                color: '#16a34a', bg: '#f0fdf4' },
  delivered_unpaid: { label: 'Livrée',                color: '#ea580c', bg: '#fff7ed' },
  cancelled:        { label: 'Annulée',               color: '#dc2626', bg: '#fef2f2' },
}

function fmt(p: number) { return p.toLocaleString('fr-FR') + ' FCFA' }

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h} h`
  return `Il y a ${Math.floor(h / 24)} j`
}

/**
 * Historique des commandes SANS compte : les liens de suivi sont mémorisés
 * sur l'appareil au moment de la commande (localStorage).
 */
export default function MesCommandesPage() {
  const [rows, setRows] = useState<{ saved: Saved; live: Live | null }[] | null>(null)

  useEffect(() => {
    let saved: Saved[] = []
    try { saved = JSON.parse(localStorage.getItem('jokoo_my_orders') ?? '[]') } catch {}
    if (saved.length === 0) { setRows([]); return }
    Promise.all(
      saved.map(async s => ({
        saved: s,
        live: (await getOrderByTrackingToken(s.token).catch(() => null)) as Live | null,
      }))
    ).then(setRows)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      <header style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/" aria-label="Retour" style={{ display: 'flex', padding: 6 }}><ArrowLeft size={20} color="#374151" /></Link>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#111827', margin: 0 }}>Mes commandes</h1>
      </header>

      <main style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560, margin: '0 auto' }}>
        {rows === null && <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>Chargement…</p>}

        {rows?.length === 0 && (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '40px 20px', border: '1px solid #e5e7eb' }}>
            <ShoppingBag size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 800, color: '#111827', marginBottom: 6 }}>Aucune commande sur cet appareil</div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 18px' }}>
              Pas besoin de compte pour commander. Vos commandes apparaîtront ici automatiquement.
            </p>
            <Link href="/" style={{ display: 'inline-block', background: BLUE, color: 'white', padding: '12px 22px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.88rem' }}>
              Découvrir les produits
            </Link>
          </div>
        )}

        {rows?.map(({ saved, live }) => {
          const st = STATUS[live?.status ?? ''] ?? { label: 'Commande envoyée', color: '#6b7280', bg: '#f3f4f6' }
          return (
            <Link key={saved.token} href={`/suivi/${saved.token}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: 12, border: '1px solid #e5e7eb', textDecoration: 'none' }}>
              {live?.product_img
                ? <img src={live.product_img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, background: '#f8fafc', padding: 3, flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {live ? `${live.quantity > 1 ? live.quantity + '× ' : ''}${live.product_name}` : saved.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: 2 }}>
                  {live?.shop_name ?? saved.shop} · {ago(live?.created_at ?? saved.date)}
                  {live ? ` · ${fmt(live.price)}` : ''}
                </div>
                <span style={{ display: 'inline-block', marginTop: 6, background: st.bg, color: st.color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>
                  {st.label}
                </span>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </Link>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: 12 }}>
          Historique enregistré sur cet appareil · Aucun compte requis
        </p>
      </main>
    </div>
  )
}
