'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, ShoppingCart, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'

const ORANGE = '#f97316'
const BLUE = '#2D6BE4'

function fmt(p: number) {
  return p.toLocaleString('fr-FR') + ' FCFA'
}

export default function PanierPage() {
  const router = useRouter()
  const { items, updateQty, removeItem, totalItems, totalPrice } = useCart()
  const [going, setGoing] = useState(false)

  // Précharge la page commande dès l'ouverture du panier → navigation instantanée
  useEffect(() => { router.prefetch('/commande') }, [router])

  function goCheckout() {
    if (going) return
    setGoing(true) // retour visuel immédiat
    try { navigator.vibrate?.(10) } catch {}
    router.push('/commande')
    setTimeout(() => setGoing(false), 4000) // sécurité si la navigation échoue
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
      <style>{`.jk-press{transition:transform .08s ease,filter .08s ease}.jk-press:active:not(:disabled){transform:scale(.97);filter:brightness(.92)}`}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={20} color={ORANGE} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
            Mon Panier
          </span>
          {totalItems > 0 && (
            <span style={{ background: ORANGE, color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
              {totalItems} article{totalItems > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </nav>

      {items.length === 0 ? (
        /* ── PANIER VIDE ── */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', marginBottom: 8 }}>
            Votre panier est vide
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: 24 }}>
            Ajoutez des produits depuis la page d'accueil
          </p>
          <Link href="/" style={{ background: ORANGE, color: 'white', padding: '12px 28px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <>
          {/* ── LISTE ARTICLES ── */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 12, border: '1px solid #e5e7eb' }}>
                {/* Image */}
                <Link href={`/produit/${item.id}`}>
                  <img
                    src={item.img}
                    alt={item.name}
                    style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 10, background: '#f9fafb', padding: 4, flexShrink: 0 }}
                  />
                </Link>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 8 }}>{item.shop}</div>
                  <div style={{ fontWeight: 900, color: '#111827', fontSize: '0.95rem', marginBottom: 10 }}>
                    {fmt(item.price)}
                  </div>
                  {/* Contrôles quantité */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      style={{ width: 30, height: 30, background: item.quantity === 1 ? '#fef2f2' : ORANGE, color: item.quantity === 1 ? '#ef4444' : 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }}
                    >
                      {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: 24, textAlign: 'center', color: '#111827' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      style={{ width: 30, height: 30, background: ORANGE, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto' }}
                    >
                      <Plus size={13} />
                    </button>
                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 800, color: BLUE }}>
                      {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                {/* Supprimer */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', minHeight: 'auto' }}
                >
                  <Trash2 size={16} color="#9ca3af" />
                </button>
              </div>
            ))}
          </div>

          {/* ── RÉCAPITULATIF ── */}
          <div style={{ margin: '0 12px', background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>Récapitulatif</div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: '#6b7280' }}>
                <span>{item.name.slice(0, 28)}{item.name.length > 28 ? '…' : ''} × {item.quantity}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>{fmt(totalPrice)}</span>
            </div>
          </div>
        </>
      )}

      {/* ── BARRE FIXE BAS ── */}
      {items.length > 0 && <div style={{ height: 'calc(190px + var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px))' }} />}
      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px))', left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '12px 16px', zIndex: 500, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{totalItems} article{totalItems > 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>{fmt(totalPrice)}</span>
          </div>
          <button
            onClick={goCheckout}
            disabled={going}
            className="jk-press"
            style={{ width: '100%', background: going ? '#ea580c' : ORANGE, color: 'white', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'auto', boxShadow: '0 4px 14px rgba(249,115,22,0.35)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', opacity: going ? 0.92 : 1 }}
          >
            {going ? <><Loader2 size={18} className="animate-spin" /> Chargement…</> : <><ShoppingBag size={18} /> Finaliser ma commande</>}
          </button>
        </div>
      )}
    </div>
  )
}
