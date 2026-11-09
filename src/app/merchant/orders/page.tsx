'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PushNotificationsToggle from '@/components/PushNotificationsToggle'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingBag, Store, Settings,
  LogOut, Phone, CheckCircle, Clock, XCircle, Plus, RefreshCw,
  Truck, ClipboardList, ChevronDown, ChevronRight, MessageCircle,
  ExternalLink, X, Check, ArrowRight
} from 'lucide-react'
import { getMyOrdersAction, updateGuestOrderStatusAction, type GuestOrderStatus } from '@/app/actions'

const BLUE   = '#2D6BE4'
const ORANGE = '#f97316'

const navItems = [
  { href: '/merchant/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/merchant/products',     icon: Package,         label: 'Produits' },
  { href: '/merchant/products/new', icon: Plus,            label: '+ Produit', accent: true },
  { href: '/merchant/orders',       icon: ShoppingBag,     label: 'Commandes', active: true },
  { href: '/merchant/shop',         icon: Store,           label: 'Ma Boutique' },
  { href: '/merchant/settings',     icon: Settings,        label: 'Paramètres' },
]

// ─── Mapping des anciens statuts (avant migration SQL) ──────────────────────
const LEGACY_STATUS_MAP: Record<string, GuestOrderStatus> = {
  delivered: 'delivered_paid',
  called:    'processing',
  new:       'new',
  cancelled: 'cancelled',
}

function normalizeStatus(raw: string): GuestOrderStatus {
  if (STATUS_CONFIG_KEYS.has(raw)) return raw as GuestOrderStatus
  return LEGACY_STATUS_MAP[raw] ?? 'new'
}

const STATUS_CONFIG_KEYS = new Set<string>([
  'new', 'processing', 'out_for_delivery', 'delivered_paid', 'delivered_unpaid', 'cancelled'
])

// ─── Configuration des 6 statuts ──────────────────────────────────────────────
const STATUS_CONFIG: Record<GuestOrderStatus, {
  label: string
  sublabel: string
  color: string
  bg: string
  border: string
  icon: React.ElementType
  emoji: string
}> = {
  new: {
    label:    'Commande reçue',
    sublabel: 'Nouvelle commande enregistrée à traiter',
    color:    '#2563eb',
    bg:       '#eff6ff',
    border:   '#bfdbfe',
    icon:     ClipboardList,
    emoji:    '📋',
  },
  processing: {
    label:    'En préparation',
    sublabel: 'Colis en cours d’emballage pour expédition',
    color:    '#d97706',
    bg:       '#fffbeb',
    border:   '#fde68a',
    icon:     Package,
    emoji:    '⚙️',
  },
  out_for_delivery: {
    label:    'En livraison',
    sublabel: 'Colis en route avec le livreur',
    color:    '#7c3aed',
    bg:       '#f5f3ff',
    border:   '#ddd6fe',
    icon:     Truck,
    emoji:    '🚚',
  },
  delivered_paid: {
    label:    'Livré · Payé',
    sublabel: 'Colis remis au client et montant encaissé avec succès',
    color:    '#16a34a',
    bg:       '#f0fdf4',
    border:   '#bbf7d0',
    icon:     CheckCircle,
    emoji:    '✅',
  },
  delivered_unpaid: {
    label:    'Livré · Non payé',
    sublabel: 'Colis remis mais en attente d’encaissement',
    color:    '#ea580c',
    bg:       '#fff7ed',
    border:   '#fed7aa',
    icon:     CheckCircle,
    emoji:    '📦',
  },
  cancelled: {
    label:    'Annulée',
    sublabel: 'Commande annulée ou commande rejetée',
    color:    '#dc2626',
    bg:       '#fef2f2',
    border:   '#fecaca',
    icon:     XCircle,
    emoji:    '❌',
  },
}

type GuestOrder = {
  id: string
  product_id: string
  product_name: string
  product_img: string | null
  price: number
  quantity: number
  buyer_prenom: string
  buyer_nom: string
  buyer_phone: string
  buyer_whatsapp: boolean
  shop_name: string
  status: string
  created_at: string
  tracking_token?: string
}

function fmt(p: number) {
  return p.toLocaleString('fr-FR') + ' FCFA'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

// ─── Page principale ──────────────────────────────────────────────────────────
const ORDERS_CACHE = 'jokoo_merchant_orders_cache'
export default function MerchantOrdersPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [orders,   setOrders]   = useState<GuestOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | GuestOrderStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)
  const [statusModalOrder, setStatusModalOrder] = useState<GuestOrder | null>(null)

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    const data = (await getMyOrdersAction()) as GuestOrder[]
    setOrders(data)
    try { localStorage.setItem(ORDERS_CACHE, JSON.stringify(data)) } catch {}
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    // Affichage instantané depuis le cache, puis rafraîchissement en arrière-plan
    let hadCache = false
    try {
      const raw = localStorage.getItem(ORDERS_CACHE)
      if (raw) { setOrders(JSON.parse(raw)); setLoading(false); hadCache = true }
    } catch {}
    loadOrders(hadCache)
  }, [])

  useEffect(() => {
    const h = () => { loadOrders(true) }
    window.addEventListener('jokoo:new-order', h)
    return () => window.removeEventListener('jokoo:new-order', h)
  }, [])

  async function updateStatus(id: string, status: GuestOrderStatus) {
    setUpdating(id)
    setUpdateError(null)
    setSuccessMsg(null)
    try {
      await updateGuestOrderStatusAction(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as string } : o))
      // mise à jour optimiste déjà appliquée : pas de rechargement complet (économie d'egress)
      const label = STATUS_CONFIG[status]?.label ?? status
      setSuccessMsg(`✅ Statut mis à jour : ${label}`)
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (e: any) {
      console.error(e)
      setUpdateError(e?.message ?? 'Erreur lors de la mise à jour du statut.')
      setTimeout(() => setUpdateError(null), 8000)
    }
    setUpdating(null)
  }

  function handleShareTracking(order: GuestOrder) {
    if (!order.tracking_token) return
    const url = `${window.location.origin}/suivi/${order.tracking_token}`
    if (order.buyer_whatsapp) {
      const msg = `Bonjour ${order.buyer_prenom}, voici le lien pour suivre votre commande Jokoo en temps réel :\n${url}`
      window.open(`https://wa.me/${order.buyer_phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      navigator.clipboard?.writeText(url)
      setSuccessMsg('📋 Lien de suivi copié !')
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => normalizeStatus(o.status) === filter)
  const counts: Record<string, number> = {
    all: orders.length,
    ...Object.fromEntries(
      (Object.keys(STATUS_CONFIG) as GuestOrderStatus[]).map(s => [
        s,
        orders.filter(o => normalizeStatus(o.status) === s).length
      ])
    ),
  }

  const urgentCount = orders.filter(o => normalizeStatus(o.status) === 'new').length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── NAV MOBILE ── */}
      <nav className="merchant-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e2e8f0', zIndex: 100, padding: '6px 0 8px' }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', flex: 1, position: 'relative' }}>
            <item.icon size={18} color={item.active ? BLUE : '#94a3b8'} />
            <span style={{ fontSize: '0.62rem', color: item.active ? BLUE : '#94a3b8', fontWeight: item.active ? 700 : 500 }}>{item.label}</span>
            {item.active && orders.length > 0 && (
              <span style={{ position: 'absolute', top: -2, right: '20%', background: '#ef4444', color: 'white', fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', borderRadius: 10, minWidth: 16, textAlign: 'center' }}>{orders.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* ── HEADER MOBILE ── */}
      <div className="merchant-mobile-header" style={{ display: 'none', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/merchant/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logos/logo-jokoo-cart.png" alt="Jokko" style={{ height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', borderLeft: '1px solid #e2e8f0', paddingLeft: 8 }}>COMMANDES</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {urgentCount > 0 && (
            <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, border: '1px solid #fecaca' }}>
              🔴 {urgentCount}
            </span>
          )}
          <button
            onClick={() => loadOrders()}
            style={{ width: 34, height: 34, borderRadius: 9, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
            aria-label="Actualiser"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar" style={{
        position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        background: 'white', borderRight: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        boxShadow: '1px 0 8px rgba(0,0,0,0.03)',
      }}>
        {/* Logo Jokko */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/merchant/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logos/logo-jokoo-cart.png" alt="Jokko" style={{ height: 38, objectFit: 'contain' }} />
            <div style={{ borderLeft: '1.5px solid #e2e8f0', paddingLeft: 8 }}>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1 }}>ESPACE</div>
              <div style={{ fontSize: '0.72rem', color: BLUE, fontWeight: 800, lineHeight: 1.2 }}>MARCHAND</div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none',
              background: item.active ? '#eff6ff' : item.accent ? '#fff7ed' : 'transparent',
              color: item.active ? BLUE : item.accent ? '#ea580c' : '#334155',
              fontWeight: item.active || item.accent ? 700 : 500,
              fontSize: '0.85rem', position: 'relative',
              transition: 'background 0.15s',
            }}>
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.active && orders.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.62rem', fontWeight: 900, padding: '2px 7px', borderRadius: 10 }}>{orders.length}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: '0.85rem', minHeight: 'auto',
          }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── DESKTOP TOP HEADER ── */}
      <header className="desktop-top-header" style={{
        position: 'fixed', top: 0, left: 240, right: 0, height: 62,
        background: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>📦 Commandes reçues</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>Gestion centralisée et expédition en temps réel</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {urgentCount > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '5px 12px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
              🔴 {urgentCount} nouvelle{urgentCount > 1 ? 's' : ''}
            </div>
          )}
          <button onClick={() => loadOrders()} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9,
            padding: '7px 13px', fontSize: '0.8rem', color: '#334155',
            cursor: 'pointer', fontWeight: 600, minHeight: 'auto',
          }}>
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content" style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Toast succès ── */}
        {successMsg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
            padding: '10px 14px', marginBottom: 14,
            display: 'flex', gap: 10, alignItems: 'center',
            animation: 'slideIn 0.25s ease',
          }}>
            <span style={{ fontSize: '1rem' }}>✅</span>
            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.84rem' }}>{successMsg}</span>
          </div>
        )}

        {/* ── Erreur ── */}
        {updateError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: '12px 14px', marginBottom: 14,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.82rem', marginBottom: 2 }}>
                Erreur de mise à jour
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', lineHeight: 1.5 }}>
                {updateError}
              </div>
            </div>
            <button
              onClick={() => setUpdateError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', padding: 0 }}
            >✕</button>
          </div>
        )}

        <PushNotificationsToggle />

        {/* Titre Mobile */}
        <div className="mobile-only-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>
              Commandes
            </h1>
            <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {orders.length} commande{orders.length > 1 ? 's' : ''} au total
            </p>
          </div>
          {urgentCount > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '4px 10px', fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>
              🔴 {urgentCount} à traiter
            </div>
          )}
        </div>

        {/* ── FILTRES HORIZONTAUX COMPACTS ── */}
        <div className="filter-chips-bar">
          <button
            onClick={() => setFilter('all')}
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          >
            Toutes <span className="chip-badge">{counts.all}</span>
          </button>
          {(Object.keys(STATUS_CONFIG) as GuestOrderStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            const count = counts[s] ?? 0
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`filter-chip ${filter === s ? 'active' : ''}`}
                style={filter === s ? { borderColor: c.color, background: c.bg, color: c.color } : {}}
              >
                <span>{c.emoji} {c.label}</span>
                {count > 0 && <span className="chip-badge" style={filter === s ? { background: c.color, color: 'white' } : {}}>{count}</span>}
              </button>
            )
          })}
        </div>

        {/* ── LISTE DES COMMANDES ULTRA-COMPACTE ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chargement des commandes…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', marginTop: 8 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 4 }}>Aucune commande dans cet onglet</div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Sélectionnez un autre filtre ou attendez de nouvelles commandes</div>
          </div>
        ) : (
          <div className="orders-compact-list">
            {filtered.map(order => {
              const safeStatus = normalizeStatus(order.status)
              const cfg = STATUS_CONFIG[safeStatus]
              const isUrgent = safeStatus === 'new'
              const CfgIcon = cfg.icon

              return (
                <div
                  key={order.id}
                  className="order-card-compact"
                  style={{ borderLeftColor: cfg.color }}
                >
                  {/* LIGNE 1 : Thumbnail + Info Client & Produit + Prix */}
                  <div className="card-top-row">
                    {/* Thumbnail produit */}
                    <div className="product-thumb">
                      {order.product_img ? (
                        <img src={order.product_img} alt={order.product_name} />
                      ) : (
                        <div className="thumb-fallback">
                          <ShoppingBag size={17} color="#94a3b8" />
                        </div>
                      )}
                    </div>

                    {/* Meta Client & Produit */}
                    <div className="order-meta-info">
                      <div className="customer-row">
                        <span className="customer-name">
                          {order.buyer_prenom} {order.buyer_nom}
                        </span>
                        {isUrgent && <span className="urgent-badge">Nouveau</span>}
                        {order.buyer_whatsapp && <span className="whatsapp-badge">WhatsApp</span>}
                      </div>

                      <div className="product-subtext">
                        <span className="product-title">
                          {order.quantity > 1 && <strong>{order.quantity}× </strong>}
                          {order.product_name}
                        </span>
                        <span className="subtext-separator">·</span>
                        <span className="time-text">{timeAgo(order.created_at)}</span>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="order-price-container">
                      <div className="order-price-value">{fmt(order.price)}</div>
                    </div>
                  </div>

                  {/* LIGNE 2 : Barre d'action intelligente */}
                  <div className="card-bottom-row">
                    {/* Statut cliquable (Interactive Status Pill) */}
                    <button
                      onClick={() => setStatusModalOrder(order)}
                      className="status-interactive-pill"
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        borderColor: cfg.border,
                      }}
                      title="Cliquez pour changer le statut de la commande"
                    >
                      <CfgIcon size={13} />
                      <span className="pill-text">{cfg.label}</span>
                      <ChevronDown size={12} className="pill-arrow" />
                    </button>

                    {/* Quick actions : Contact WhatsApp + Suivi + Appel */}
                    <div className="card-quick-actions">
                      <a
                        href={order.buyer_whatsapp ? `https://wa.me/${order.buyer_phone.replace(/[^0-9+]/g, '')}` : `tel:${order.buyer_phone}`}
                        target={order.buyer_whatsapp ? '_blank' : undefined}
                        rel={order.buyer_whatsapp ? 'noopener noreferrer' : undefined}
                        className="quick-btn-whatsapp"
                        title={`Ouvrir la conversation (${order.buyer_phone})`}
                      >
                        <MessageCircle size={13} />
                        <span className="btn-label-text">WhatsApp</span>
                      </a>

                      {order.tracking_token && (
                        <button
                          onClick={() => handleShareTracking(order)}
                          className="quick-btn-tracking"
                          title="Lien de suivi client"
                        >
                          <ExternalLink size={13} />
                          <span className="btn-label-text">Suivi</span>
                        </button>
                      )}

                      <a
                        href={`tel:${order.buyer_phone}`}
                        className="quick-btn-call"
                        title={`Appeler ${order.buyer_phone}`}
                        aria-label="Appeler"
                      >
                        <Phone size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── MODALE / BOTTOM SHEET DE STATUT MODERNE ── */}
      {statusModalOrder && (
        <div className="status-modal-overlay" onClick={() => setStatusModalOrder(null)}>
          <div className="status-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-drag-handle" />

            <div className="modal-sheet-header">
              <div>
                <h3 className="modal-title">Modifier le statut</h3>
                <p className="modal-subtitle">
                  Client : <strong>{statusModalOrder.buyer_prenom} {statusModalOrder.buyer_nom}</strong> · {fmt(statusModalOrder.price)}
                </p>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="modal-close-btn"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-sheet-content">
              {/* GROUPE 1 : FLUX LOGISTIQUE */}
              <div className="status-group-label">FLUX LOGISTIQUE</div>
              {(['new', 'processing', 'out_for_delivery'] as GuestOrderStatus[]).map(s => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                const isCurrent = normalizeStatus(statusModalOrder.status) === s
                return (
                  <button
                    key={s}
                    disabled={updating === statusModalOrder.id}
                    onClick={() => {
                      updateStatus(statusModalOrder.id, s)
                      setStatusModalOrder(null)
                    }}
                    className={`status-choice-card ${isCurrent ? 'is-current' : ''}`}
                  >
                    <div className="choice-icon" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                      <Icon size={17} />
                    </div>
                    <div className="choice-body">
                      <div className="choice-title" style={{ color: isCurrent ? c.color : '#0f172a' }}>
                        {c.emoji} {c.label}
                      </div>
                      <div className="choice-desc">{c.sublabel}</div>
                    </div>
                    {isCurrent ? (
                      <span className="current-badge" style={{ background: c.bg, color: c.color }}>Actuel</span>
                    ) : (
                      <ChevronRight size={15} color="#94a3b8" />
                    )}
                  </button>
                )
              })}

              {/* GROUPE 2 : FINALISATION LIVRAISON */}
              <div className="status-group-label" style={{ marginTop: 14 }}>FINALISER LA COMMANDE</div>
              {(['delivered_paid', 'delivered_unpaid'] as GuestOrderStatus[]).map(s => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                const isCurrent = normalizeStatus(statusModalOrder.status) === s
                const isPaid = s === 'delivered_paid'
                return (
                  <button
                    key={s}
                    disabled={updating === statusModalOrder.id}
                    onClick={() => {
                      updateStatus(statusModalOrder.id, s)
                      setStatusModalOrder(null)
                    }}
                    className={`status-choice-card final-action ${isCurrent ? 'is-current' : ''}`}
                    style={{
                      borderLeft: `3px solid ${c.color}`,
                      background: isCurrent ? c.bg : isPaid ? '#f0fdf4' : '#fff7ed',
                    }}
                  >
                    <div className="choice-icon" style={{ background: 'white', color: c.color, borderColor: c.border }}>
                      <Icon size={17} />
                    </div>
                    <div className="choice-body">
                      <div className="choice-title" style={{ color: c.color, fontWeight: 800 }}>
                        {c.emoji} {c.label}
                        {isPaid && <span className="recommended-tag">Recommandé</span>}
                      </div>
                      <div className="choice-desc" style={{ color: isPaid ? '#166534' : '#9a3412' }}>{c.sublabel}</div>
                    </div>
                    {isCurrent ? (
                      <span className="current-badge" style={{ background: 'white', color: c.color }}>Actuel</span>
                    ) : (
                      <ChevronRight size={15} color={c.color} />
                    )}
                  </button>
                )
              })}

              {/* GROUPE 3 : AUTRE */}
              <div className="status-group-label" style={{ marginTop: 14 }}>AUTRE OPTION</div>
              {(['cancelled'] as GuestOrderStatus[]).map(s => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                const isCurrent = normalizeStatus(statusModalOrder.status) === s
                return (
                  <button
                    key={s}
                    disabled={updating === statusModalOrder.id}
                    onClick={() => {
                      if (confirm('Voulez-vous marquer cette commande comme annulée ?')) {
                        updateStatus(statusModalOrder.id, s)
                        setStatusModalOrder(null)
                      }
                    }}
                    className={`status-choice-card cancel-action ${isCurrent ? 'is-current' : ''}`}
                  >
                    <div className="choice-icon" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                      <Icon size={17} />
                    </div>
                    <div className="choice-body">
                      <div className="choice-title" style={{ color: '#dc2626' }}>
                        {c.emoji} {c.label}
                      </div>
                      <div className="choice-desc">{c.sublabel}</div>
                    </div>
                    {isCurrent ? (
                      <span className="current-badge" style={{ background: c.bg, color: c.color }}>Actuel</span>
                    ) : (
                      <ChevronRight size={15} color="#94a3b8" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STYLES RESPONSIVES DE DERNIÈRE GÉNÉRATION ── */}
      <style>{`
        /* Global layout container */
        .orders-compact-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Order Card Compact */
        .order-card-compact {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #cbd5e1;
          padding: 12px 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .order-card-compact:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        /* Top Row */
        .card-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .product-thumb {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .product-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .thumb-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .order-meta-info {
          flex: 1;
          min-width: 0;
        }
        .customer-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .customer-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .urgent-badge {
          background: #fef2f2;
          color: #ef4444;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 6px;
          border: 1px solid #fecaca;
          animation: pulse 1.5s infinite;
        }
        .whatsapp-badge {
          background: #f0fdf4;
          color: #16a34a;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 6px;
          border: 1px solid #bbf7d0;
        }

        .product-subtext {
          font-size: 0.76rem;
          color: #64748b;
          margin-top: 1px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-title {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .subtext-separator {
          color: #cbd5e1;
        }
        .time-text {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .order-price-container {
          text-align: right;
          flex-shrink: 0;
        }
        .order-price-value {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        /* Bottom Row */
        .card-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 9px;
          border-top: 1px solid #f1f5f9;
        }

        /* Interactive Status Pill */
        .status-interactive-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1.5px solid;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.15s;
          min-height: 28px;
          outline: none;
        }
        .status-interactive-pill:active {
          transform: scale(0.97);
        }
        .pill-text {
          letter-spacing: 0.01em;
        }
        .pill-arrow {
          opacity: 0.7;
          margin-left: 2px;
        }

        /* Quick Action Buttons */
        .card-quick-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .quick-btn-whatsapp, .quick-btn-tracking, .quick-btn-call {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 8px;
          padding: 5px 9px;
          font-size: 0.72rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid;
          height: 28px;
          box-sizing: border-box;
          transition: background 0.15s, transform 0.1s;
        }
        .quick-btn-whatsapp:active, .quick-btn-tracking:active, .quick-btn-call:active {
          transform: scale(0.96);
        }
        .quick-btn-whatsapp {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }
        .quick-btn-whatsapp:hover {
          background: #d1fae5;
        }
        .quick-btn-tracking {
          background: #f8fafc;
          color: #334155;
          border-color: #e2e8f0;
        }
        .quick-btn-tracking:hover {
          background: #f1f5f9;
        }
        .quick-btn-call {
          width: 28px;
          padding: 0;
          justify-content: center;
          background: #f8fafc;
          color: #334155;
          border-color: #e2e8f0;
        }
        .quick-btn-call:hover {
          background: #f1f5f9;
        }

        /* Filter Chips Bar */
        .filter-chips-bar {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .filter-chips-bar::-webkit-scrollbar {
          display: none;
        }
        .filter-chip {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          font-weight: 600;
          font-size: 0.74rem;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .filter-chip.active {
          background: #eff6ff;
          border-color: #2D6BE4;
          color: #2D6BE4;
          font-weight: 700;
        }
        .chip-badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.65rem;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
        }

        /* Status Modal / Bottom Sheet */
        .status-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.15s ease;
        }
        .status-modal-sheet {
          background: #ffffff;
          width: 100%;
          max-width: 480px;
          border-radius: 24px 24px 0 0;
          padding: 16px 20px 32px;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
          max-height: 85vh;
          overflow-y: auto;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sheet-drag-handle {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: #cbd5e1;
          margin: 0 auto 12px;
        }
        .modal-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modal-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0;
        }
        .modal-subtitle {
          font-size: 0.75rem;
          color: #64748b;
          margin: 2px 0 0;
        }
        .modal-close-btn {
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }

        .status-group-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .status-choice-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          background: #ffffff;
          margin-bottom: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          box-sizing: border-box;
        }
        .status-choice-card:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .status-choice-card.is-current {
          border-color: #2D6BE4;
          background: #eff6ff;
        }
        .choice-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid;
        }
        .choice-body {
          flex: 1;
          min-width: 0;
        }
        .choice-title {
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .choice-desc {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 1px;
        }
        .recommended-tag {
          font-size: 0.62rem;
          background: #dcfce7;
          color: #15803d;
          padding: 1px 6px;
          border-radius: 6px;
          font-weight: 800;
        }
        .current-badge {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        /* ── DESKTOP (>= 1024px) ── */
        @media (min-width: 1024px) {
          .desktop-top-header     { display: flex !important; }
          .merchant-bottom-nav    { display: none !important; }
          .merchant-mobile-header { display: none !important; }
          .mobile-only-title      { display: none !important; }

          .main-content {
            margin-left: 240px !important;
            padding: 82px 32px 32px !important;
            max-width: calc(100vw - 240px) !important;
            width: calc(100vw - 240px) !important;
            box-sizing: border-box !important;
          }

          /* Status Modal Centered on Desktop */
          .status-modal-overlay {
            align-items: center;
            padding: 20px;
          }
          .status-modal-sheet {
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 22px 24px;
          }
          .sheet-drag-handle {
            display: none;
          }
        }

        /* ── MOBILE / TABLETTE (<= 1023px) ── */
        @media (max-width: 1023px) {
          .sidebar              { display: none !important; }
          .desktop-top-header   { display: none !important; }
          .merchant-bottom-nav    { display: flex !important; }
          .merchant-mobile-header { display: flex !important; }
          .mobile-only-title      { display: flex !important; }

          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
            padding: 14px 14px 90px !important;
            box-sizing: border-box !important;
          }

          .btn-label-text {
            display: inline;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
