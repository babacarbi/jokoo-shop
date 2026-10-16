'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingBag, Store, Settings,
  LogOut, Phone, CheckCircle, Clock, XCircle, Plus, RefreshCw,
  Truck, ClipboardList, ChevronDown,
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

/** Normalise un statut venant de la BDD, même si la migration n'a pas encore tourné */
function normalizeStatus(raw: string): GuestOrderStatus {
  if (STATUS_CONFIG_KEYS.has(raw)) return raw as GuestOrderStatus   // ✅ .has() pour les Sets
  return LEGACY_STATUS_MAP[raw] ?? 'new'
}

const STATUS_CONFIG_KEYS = new Set<string>([
  'new', 'processing', 'out_for_delivery', 'delivered_paid', 'delivered_unpaid', 'cancelled'
])

// ─── Configuration des 6 statuts ──────────────────────────────────────────────
const STATUS_CONFIG: Record<GuestOrderStatus, {
  label: string
  color: string
  bg: string
  border: string
  icon: React.ElementType
  emoji: string
}> = {
  new: {
    label:  'Commande reçue',
    color:  BLUE,
    bg:     '#eff6ff',
    border: '#bfdbfe',
    icon:   ClipboardList,
    emoji:  '📋',
  },
  processing: {
    label:  'En préparation',
    color:  '#d97706',
    bg:     '#fffbeb',
    border: '#fde68a',
    icon:   Package,
    emoji:  '⚙️',
  },
  out_for_delivery: {
    label:  'En cours de livraison',
    color:  '#7c3aed',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
    icon:   Truck,
    emoji:  '🚚',
  },
  delivered_paid: {
    label:  'Livré · Payé',
    color:  '#16a34a',
    bg:     '#f0fdf4',
    border: '#bbf7d0',
    icon:   CheckCircle,
    emoji:  '✅',
  },
  delivered_unpaid: {
    label:  'Livré · Non payé',
    color:  '#ea580c',
    bg:     '#fff7ed',
    border: '#fed7aa',
    icon:   CheckCircle,
    emoji:  '📦',
  },
  cancelled: {
    label:  'Annulée',
    color:  '#dc2626',
    bg:     '#fef2f2',
    border: '#fecaca',
    icon:   XCircle,
    emoji:  '❌',
  },
}

// Ordre de progression pour le sélecteur marchand
const STATUS_ORDER: GuestOrderStatus[] = [
  'new',
  'processing',
  'out_for_delivery',
  'delivered_paid',
  'delivered_unpaid',
  'cancelled',
]

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
  status: string          // raw string from DB — normalized via normalizeStatus()
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

// ─── Bouton de changement de statut (mini stepper) ───────────────────────────
function StatusStepper({
  order,
  updating,
  onUpdate,
}: {
  order: GuestOrder
  updating: boolean
  onUpdate: (id: string, status: GuestOrderStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const safeStatus = normalizeStatus(order.status)
  const cfg = STATUS_CONFIG[safeStatus]
  const Icon = cfg.icon

  // Prochaine étape naturelle (hors annulation)
  const currentIdx = STATUS_ORDER.indexOf(safeStatus)
  const nextNatural = STATUS_ORDER.find((s, i) =>
    i > currentIdx && s !== 'cancelled'
  )

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Étape "En cours de livraison" : choix entre Livré Payé / Livré Non payé ── */}
      {safeStatus === 'out_for_delivery' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onUpdate(order.id, 'delivered_paid')}
            disabled={updating}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: `linear-gradient(135deg, ${STATUS_CONFIG.delivered_paid.color}, ${STATUS_CONFIG.delivered_paid.color}cc)`,
              color: 'white', border: 'none', borderRadius: 9,
              padding: '8px 8px', fontSize: '0.68rem', fontWeight: 800,
              cursor: updating ? 'wait' : 'pointer',
              boxShadow: `0 2px 8px ${STATUS_CONFIG.delivered_paid.color}40`,
              opacity: updating ? 0.7 : 1, minHeight: 'auto',
            }}
          >
            Livré · Payé
          </button>
          <button
            onClick={() => onUpdate(order.id, 'delivered_unpaid')}
            disabled={updating}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: `linear-gradient(135deg, ${STATUS_CONFIG.delivered_unpaid.color}, ${STATUS_CONFIG.delivered_unpaid.color}cc)`,
              color: 'white', border: 'none', borderRadius: 9,
              padding: '8px 8px', fontSize: '0.68rem', fontWeight: 800,
              cursor: updating ? 'wait' : 'pointer',
              boxShadow: `0 2px 8px ${STATUS_CONFIG.delivered_unpaid.color}40`,
              opacity: updating ? 0.7 : 1, minHeight: 'auto',
            }}
          >
            Livré · Non payé
          </button>
        </div>
      )}

      {/* ── Bouton "Passer à l'étape suivante" (autres statuts) ── */}
      {nextNatural
        && safeStatus !== 'out_for_delivery'   // géré ci-dessus avec 2 boutons
        && safeStatus !== 'delivered_paid'
        && safeStatus !== 'delivered_unpaid'
        && safeStatus !== 'cancelled'
        && (
        <button
          onClick={() => onUpdate(order.id, nextNatural!)}
          disabled={updating}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `linear-gradient(135deg, ${STATUS_CONFIG[nextNatural!].color}, ${STATUS_CONFIG[nextNatural!].color}cc)`,
            color: 'white', border: 'none', borderRadius: 9,
            padding: '8px 12px', fontSize: '0.72rem', fontWeight: 800,
            cursor: updating ? 'wait' : 'pointer',
            marginBottom: 0, whiteSpace: 'nowrap' as const,
            boxShadow: `0 2px 8px ${STATUS_CONFIG[nextNatural!].color}40`,
            opacity: updating ? 0.7 : 1, minHeight: 'auto',
          }}
        >
          {STATUS_CONFIG[nextNatural!].label}
        </button>
      )}

      {/* Sélecteur complet */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: cfg.bg, color: cfg.color,
            border: `1.5px solid ${cfg.border}`,
            borderRadius: 9, padding: '6px 10px',
            fontSize: '0.72rem', fontWeight: 700,
            cursor: 'pointer', minHeight: 'auto',
            width: '100%', justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon size={12} /> Modifier le statut
          </span>
          <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            zIndex: 100, width: 220, overflow: 'hidden',
          }}>
            {STATUS_ORDER.map(s => {
              const c = STATUS_CONFIG[s]
              const C = c.icon
              const isCurrent = s === order.status
              return (
                <button
                  key={s}
                  onClick={() => { onUpdate(order.id, s); setOpen(false) }}
                  disabled={updating || (s === safeStatus)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: s === safeStatus ? c.bg : 'transparent',
                    border: 'none', cursor: s === safeStatus ? 'default' : 'pointer',
                    textAlign: 'left' as const,
                    borderBottom: s !== 'cancelled' ? '1px solid #f3f4f6' : 'none',
                    minHeight: 'auto',
                  }}
                >
                  <C size={14} color={c.color} />
                  <span style={{ fontSize: '0.78rem', fontWeight: s === safeStatus ? 700 : 500, color: s === safeStatus ? c.color : '#374151' }}>
                    {c.emoji} {c.label}
                  </span>
                  {s === safeStatus && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: c.color, fontWeight: 800 }}>ACTUEL</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MerchantOrdersPage() {
  const router  = useRouter()
  const supabase = createClient()
  const [orders,   setOrders]   = useState<GuestOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | GuestOrderStatus>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    const data = await getMyOrdersAction()
    setOrders(data as GuestOrder[])
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
      else loadOrders()
    })
  }, [])

  async function updateStatus(id: string, status: GuestOrderStatus) {
    setUpdating(id)
    setUpdateError(null)
    setSuccessMsg(null)
    try {
      await updateGuestOrderStatusAction(id, status)
      // Mise à jour optimiste immédiate
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as string } : o))
      // Rechargement depuis le serveur pour confirmer
      await loadOrders(true)
      const label = STATUS_CONFIG[status]?.label ?? status
      setSuccessMsg(`✅ Statut mis à jour : ${label}`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e: any) {
      console.error(e)
      setUpdateError(e?.message ?? 'Erreur lors de la mise à jour du statut.')
      setTimeout(() => setUpdateError(null), 8000)
    }
    setUpdating(null)
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

  // Nombre de "nouvelles" commandes urgentes
  const urgentCount = orders.filter(o => normalizeStatus(o.status) === 'new').length

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}
      onClick={() => {
        // Fermer les dropdowns en cliquant ailleurs — géré au niveau global
      }}
    >

      {/* ── NAV MOBILE ── */}
      <nav className="merchant-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', zIndex: 100, padding: '6px 0 8px' }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', flex: 1, position: 'relative' }}>
            <item.icon size={18} color={item.active ? BLUE : '#9ca3af'} />
            <span style={{ fontSize: '0.6rem', color: item.active ? BLUE : '#9ca3af', fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
            {item.active && orders.length > 0 && (
              <span style={{ position: 'absolute', top: -2, right: '20%', background: '#ef4444', color: 'white', fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', borderRadius: 10, minWidth: 16, textAlign: 'center' }}>{orders.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* ── HEADER MOBILE ── */}
      <div className="merchant-mobile-header" style={{ display: 'none', background: 'white', borderBottom: '1px solid #e5e7eb', padding: '10px 16px', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/logos/logo-jokoo-cart.png" alt="Jokoo" style={{ height: 32, objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {orders.length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: 12 }}>{orders.length} commande{orders.length > 1 ? 's' : ''}</span>}
          <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.88rem' }}>📦 Commandes</span>
        </div>
      </div>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sidebar" style={{
        position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        background: 'white', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logos/logo-jokoo-cart.png" alt="Jokoo" style={{ height: 40, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.04em' }}>ESPACE MARCHAND</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              textDecoration: 'none',
              background: item.active ? '#eff6ff' : item.accent ? '#fff7ed' : 'transparent',
              color: item.active ? BLUE : item.accent ? '#ea580c' : '#374151',
              fontWeight: item.active || item.accent ? 700 : 400,
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
        <div style={{ padding: '14px 10px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', fontSize: '0.85rem', minHeight: 'auto',
          }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── DESKTOP TOP HEADER ── */}
      <header className="desktop-top-header" style={{
        position: 'fixed', top: 0, left: 240, right: 0, height: 60,
        background: 'white', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', zIndex: 40,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.15rem', color: '#111827' }}>📦 Commandes reçues</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>Gérez et suivez l'avancement de chaque commande</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {urgentCount > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '5px 12px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
              🔴 {urgentCount} nouvelle{urgentCount > 1 ? 's' : ''}
            </div>
          )}
          <button onClick={() => { loadOrders() }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 9,
            padding: '8px 14px', fontSize: '0.8rem', color: '#374151',
            cursor: 'pointer', fontWeight: 600, minHeight: 'auto',
          }}>
            <RefreshCw size={13} /> Actualiser
          </button>
          <img src="/logos/logo-jokoo-cart.png" alt="Jokoo" style={{ height: 36, objectFit: 'contain', opacity: 0.85 }} />
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content merchant-inner" style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Toast succès ── */}
        {successMsg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
            padding: '12px 16px', marginBottom: 12,
            display: 'flex', gap: 12, alignItems: 'center',
            animation: 'slideIn 0.3s ease',
          }}>
            <span style={{ fontSize: '1.1rem' }}>✅</span>
            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.88rem' }}>{successMsg}</span>
          </div>
        )}

        {/* ── Bandeau d'erreur de mise à jour ── */}

        {updateError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem', marginBottom: 4 }}>
                Erreur lors de la mise à jour du statut
              </div>
              <div style={{ fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.6 }}>
                {updateError.includes('23514') || updateError.includes('migration')
                  ? <>La base de données n&apos;accepte pas encore les nouveaux statuts. Exécutez <strong>supabase/production_hardening.sql</strong> dans le SQL Editor de Supabase.</>
                  : updateError
                }
              </div>
            </div>
            <button
              onClick={() => setUpdateError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', padding: 0, flexShrink: 0 }}
            >✕</button>
          </div>
        )}

        {/* Titre + actions (visible mobile uniquement, masqué en desktop car déjà dans le header fixe) */}
        <div className="mobile-only-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#111827', marginBottom: 2 }}>
              📦 Commandes reçues
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
              Gérez et suivez l'avancement de chaque commande
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {urgentCount > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                🔴 {urgentCount} nouvelle{urgentCount > 1 ? 's' : ''}
              </div>
            )}
            <button onClick={() => { loadOrders() }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e5e7eb', borderRadius: 9, padding: '8px 14px', fontSize: '0.8rem', color: '#374151', cursor: 'pointer', fontWeight: 600, minHeight: 'auto' }}>
              <RefreshCw size={13} /> Actualiser
            </button>
          </div>
        </div>

        {/* Parcours des commandes — avec compteurs en temps réel */}
        <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Parcours des commandes
          </div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 2, maxWidth: '100%' }}>
            {([
              'new', 'processing', 'out_for_delivery', 'delivered_paid', 'delivered_unpaid'
            ] as GuestOrderStatus[]).map((s, i, arr) => {
              const c     = STATUS_CONFIG[s]
              const C     = c.icon
              const count = orders.filter(o => normalizeStatus(o.status) === s).length
              const isLast = i === arr.length - 1
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => setFilter(s)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: count > 0 ? c.bg : '#f9fafb',
                      border: `2px solid ${count > 0 ? c.color : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 0.3s',
                    }}>
                      <C size={15} color={count > 0 ? c.color : '#d1d5db'} />
                      {count > 0 && (
                        <span style={{
                          position: 'absolute', top: -6, right: -6,
                          background: c.color, color: 'white',
                          fontSize: '0.55rem', fontWeight: 900,
                          padding: '1px 5px', borderRadius: 10, minWidth: 16, textAlign: 'center',
                          boxShadow: `0 1px 4px ${c.color}60`,
                        }}>{count}</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: count > 0 ? 700 : 500,
                      color: count > 0 ? c.color : '#9ca3af',
                      textAlign: 'center', lineHeight: 1.3,
                    }}>{c.label}</span>
                  </div>
                  {!isLast && <div style={{ width: 16, height: 2, background: '#e5e7eb', flexShrink: 0, marginBottom: 18 }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Filtres */}
        <div className="filter-chips" style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', borderColor: filter === 'all' ? BLUE : '#e5e7eb', background: filter === 'all' ? '#eff6ff' : 'white', color: filter === 'all' ? BLUE : '#6b7280', fontWeight: filter === 'all' ? 700 : 500, fontSize: '0.75rem', cursor: 'pointer', minHeight: 'auto' }}
          >
            Toutes ({counts.all})
          </button>
          {(Object.keys(STATUS_CONFIG) as GuestOrderStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', borderColor: filter === s ? c.color : '#e5e7eb', background: filter === s ? c.bg : 'white', color: filter === s ? c.color : '#6b7280', fontWeight: filter === s ? 700 : 500, fontSize: '0.72rem', cursor: 'pointer', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {c.emoji} {c.label} ({counts[s] ?? 0})
              </button>
            )
          })}
        </div>

        {/* Liste commandes */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
            Chargement des commandes…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>Aucune commande</div>
            <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Les nouvelles commandes apparaîtront ici</div>
          </div>
        ) : (
          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(order => {
              const safeStatus = normalizeStatus(order.status)
              const cfg     = STATUS_CONFIG[safeStatus]
              const isUrgent    = safeStatus === 'new'
              const justUpdated = updating === null && successMsg !== null

              return (
                <div
                  key={order.id}
                  className="order-card"
                  style={{
                    background: 'white', borderRadius: 14,
                    border: `1px solid ${isUrgent ? cfg.color + '55' : '#e5e7eb'}`,
                    borderLeft: `4px solid ${cfg.color}`,
                    padding: '12px 14px',
                    boxShadow: isUrgent ? `0 0 0 3px ${BLUE}14` : '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.4s, box-shadow 0.4s',
                    position: 'relative' as const,
                  }}
                >
                  <div className="order-card-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

                    {/* Photo produit */}
                    {order.product_img && (
                      <img
                        src={order.product_img}
                        alt={order.product_name}
                        style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', padding: 3, flexShrink: 0 }}
                      />
                    )}

                    {/* Infos commande */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Ligne 1 : client + prix */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.buyer_prenom} {order.buyer_nom}
                        </span>
                        <span style={{ color: '#111827', fontWeight: 800, fontSize: '0.88rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {fmt(order.price)}
                        </span>
                      </div>

                      {/* Ligne 2 : produit · date */}
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.quantity > 1 && <strong style={{ color: '#374151' }}>{order.quantity}× </strong>}
                        {order.product_name} · {timeAgo(order.created_at)}
                      </div>

                      {/* Ligne 3 : statut + tags */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: cfg.bg, color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          fontSize: '0.68rem', fontWeight: 700,
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          <cfg.icon size={11} />
                          {cfg.label}
                        </span>
                        {order.buyer_whatsapp && (
                          <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 20 }}>
                            WhatsApp
                          </span>
                        )}
                        {isUrgent && (
                          <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 10, animation: 'pulse 1.5s infinite' }}>
                            NOUVELLE
                          </span>
                        )}
                        {updating === order.id && (
                          <span style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 600 }}>mise à jour…</span>
                        )}
                      </div>
                    </div>

                    {/* ── ACTIONS ── */}
                    <div className="order-actions-col" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, width: 240 }}>
                      <div className="order-contact-row" style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={order.buyer_whatsapp
                            ? `https://wa.me/${order.buyer_phone.replace(/[^0-9+]/g, '')}`
                            : `tel:${order.buyer_phone}`
                          }
                          target={order.buyer_whatsapp ? '_blank' : undefined}
                          rel={order.buyer_whatsapp ? 'noopener noreferrer' : undefined}
                          style={{
                            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: '#f0fdf4', color: '#15803d',
                            border: '1px solid #bbf7d0', borderRadius: 9,
                            padding: '8px 10px', fontSize: '0.75rem',
                            fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const,
                          }}
                          onClick={() => normalizeStatus(order.status) === 'new' && updateStatus(order.id, 'processing')}
                        >
                          <Phone size={13} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.buyer_phone}</span>
                        </a>
                        {order.tracking_token && (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/suivi/${order.tracking_token}`
                              if (order.buyer_whatsapp) {
                                const msg = `Bonjour ${order.buyer_prenom}, voici le lien pour suivre votre commande Jokoo en temps réel :\n${url}`
                                window.open(`https://wa.me/${order.buyer_phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                              } else {
                                navigator.clipboard?.writeText(url)
                              }
                            }}
                            style={{ flexShrink: 0, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 9, padding: '8px 12px', fontSize: '0.75rem', color: '#374151', cursor: 'pointer', fontWeight: 600, minHeight: 'auto', whiteSpace: 'nowrap' }}
                          >
                            {order.buyer_whatsapp ? 'Envoyer le suivi' : 'Copier le suivi'}
                          </button>
                        )}
                      </div>

                      {/* Stepper statut */}
                      <StatusStepper
                        order={order}
                        updating={updating === order.id}
                        onUpdate={updateStatus}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style>{`
        /* ── DESKTOP (>= 1024px) ── */
        @media (min-width: 1024px) {
          .desktop-top-header     { display: flex !important; }
          .merchant-bottom-nav    { display: none !important; }
          .merchant-mobile-header { display: none !important; }

          /* Masquer le titre dans le main (déjà dans le header fixe) */
          .mobile-only-title      { display: none !important; }

          .main-content {
            margin-left: 240px !important;
            padding: 80px 28px 28px !important;
            max-width: calc(100vw - 240px) !important;
            width: calc(100vw - 240px) !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }

          .orders-list {
            width: 100% !important;
            max-width: 100% !important;
          }

          .order-actions-col {
            width: 240px !important;
            min-width: 0 !important;
            flex-shrink: 0 !important;
          }
        }

        /* Desktop moyen (1024-1280px) */
        @media (min-width: 1024px) and (max-width: 1280px) {
          .order-actions-col { width: 200px !important; }
        }

        /* ── MOBILE / TABLETTE (<= 1023px) ── */
        @media (max-width: 1023px) {
          .sidebar              { display: none !important; }
          .desktop-top-header   { display: none !important; }
          .main-content {
            margin-left: 0 !important;
            max-width: 100vw !important;
            width: 100% !important;
            padding: 16px !important;
            padding-top: 68px !important;
            padding-bottom: 90px !important;
            box-sizing: border-box !important;
          }
          .merchant-bottom-nav    { display: flex !important; }
          .merchant-mobile-header { display: flex !important; }
          .mobile-only-title      { display: flex !important; }

          /* Carte commande : infos en haut, actions pleine largeur en bas */
          .order-card-row {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .order-actions-col {
            width: 100% !important;
            flex: 1 1 100% !important;
            flex-direction: column !important;
            gap: 6px !important;
            padding-top: 10px;
            border-top: 1px solid #f1f5f9;
          }
          .order-actions-col > * { width: 100% !important; box-sizing: border-box; }
          .order-actions-col a, .order-actions-col button { min-height: 38px !important; }
          .orders-list { gap: 8px !important; }

          /* Filtres : une seule ligne défilable */
          .filter-chips {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            margin-left: -16px; margin-right: -16px;
            padding: 2px 16px 6px;
            scrollbar-width: none;
          }
          .filter-chips::-webkit-scrollbar { display: none; }
          .filter-chips button { white-space: nowrap; flex-shrink: 0; }
        }

        /* ── GLOBAL OVERFLOW FIX ── */
        html, body { overflow-x: hidden; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes highlight {
          0%   { box-shadow: 0 0 0 4px rgba(22,163,74,0.5); }
          100% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        }

        .sidebar nav a:hover { background: #f8fafc !important; }
      `}</style>
    </div>
  )
}
