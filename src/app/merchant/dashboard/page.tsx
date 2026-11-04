'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, ShoppingBag, Store, Settings,
  LogOut, TrendingUp, TrendingDown, Plus, Eye, ChevronRight,
  Star, DollarSign, Clock, Bell, X, MapPin, Phone, Camera, Zap,
} from 'lucide-react'

/* ── Score de complétion boutique ────────────────────────────────── */
interface ShopData {
  name?: string | null
  phone?: string | null
  city?: string | null
  logo_url?: string | null
  description?: string | null
  slug?: string | null
}

function computeScore(shop: ShopData | null): number {
  if (!shop) return 0
  let score = 20 // compte créé = 20%
  if (shop.name)        score += 20
  if (shop.city)        score += 15
  if (shop.phone)       score += 20
  if (shop.logo_url)    score += 15
  if (shop.description) score += 10
  return Math.min(score, 100)
}

/* ── Nudge Card ──────────────────────────────────────────────────── */
function NudgeCard({ icon: Icon, color, bg, title, desc, cta, href, onDismiss }: {
  icon: React.ElementType; color: string; bg: string
  title: string; desc: string; cta: string; href: string
  onDismiss: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: bg, border: `1px solid ${color}22`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'hsl(222 47% 11%)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: 'hsl(215 16% 50%)', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <Link href={href} style={{ flexShrink: 0, background: color, color: 'white', border: 'none', borderRadius: 9, padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
        {cta} →
      </Link>
      <button onClick={onDismiss} style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215 16% 65%)', padding: 2, display: 'flex' }}>
        <X size={12} />
      </button>
    </div>
  )
}

const navItems = [
  { href: '/merchant/dashboard',    icon: LayoutDashboard, label: 'Dashboard',   active: true },
  { href: '/merchant/products',     icon: Package,         label: 'Produits' },
  { href: '/merchant/products/new', icon: Plus,            label: '+ Produit',   accent: true },
  { href: '/merchant/orders',       icon: ShoppingBag,     label: 'Commandes' },
  { href: '/merchant/shop',         icon: Store,           label: 'Ma Boutique' },
  { href: '/merchant/settings',     icon: Settings,        label: 'Paramètres' },
]

const stats = [
  { label: "Chiffre d'affaires", value: '840 000 F', change: '+18%', up: true,  icon: DollarSign,  color: 'hsl(158 64% 40%)', bg: 'hsl(158 64% 96%)' },
  { label: 'Commandes reçues',   value: '34',        change: '+5',   up: true,  icon: ShoppingBag, color: 'hsl(221 83% 53%)', bg: 'hsl(221 83% 96%)' },
  { label: 'Produits publiés',   value: '12',        change: '+2',   up: true,  icon: Package,     color: 'hsl(25 95% 53%)',  bg: 'hsl(25 95% 96%)' },
  { label: 'En attente envoi',   value: '3',         change: '',     up: false, icon: Clock,       color: 'hsl(38 92% 50%)',  bg: 'hsl(48 96% 95%)' },
]

const recentOrders = [
  { id: '#1042', customer: 'Moussa D.',   product: 'Robe Wax Premium',  amount: '45 000 F', status: 'new',        date: 'Il y a 12 min' },
  { id: '#1038', customer: 'Aïssatou B.', product: 'Boubou Brodé',      amount: '75 000 F', status: 'processing', date: 'Il y a 2h' },
  { id: '#1035', customer: 'Ibrahim K.',  product: 'Tissu Wax 6 yards', amount: '18 000 F', status: 'delivered',  date: 'Hier' },
  { id: '#1030', customer: 'Fatou S.',    product: 'Ensemble Pagne',    amount: '95 000 F', status: 'cancelled',  date: 'Hier' },
]

const topProducts = [
  { name: 'Robe Wax Premium',  sales: 34, revenue: '1 530 000 F', emoji: '👗', stock: 12 },
  { name: 'Boubou Brodé',      sales: 12, revenue: '900 000 F',   emoji: '🪡', stock: 5 },
  { name: 'Chemise Africaine', sales: 28, revenue: '896 000 F',   emoji: '👔', stock: 20 },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  new:        { label: 'Nouveau',  color: 'hsl(221 83% 45%)', bg: 'hsl(221 83% 96%)' },
  processing: { label: 'En cours', color: 'hsl(38 92% 38%)',  bg: 'hsl(48 96% 94%)' },
  delivered:  { label: 'Livré',    color: 'hsl(158 64% 35%)', bg: 'hsl(158 64% 95%)' },
  cancelled:  { label: 'Annulé',   color: 'hsl(0 72% 45%)',   bg: 'hsl(0 86% 97%)' },
}

export default function MerchantDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [shopName, setShopName]   = useState('Ma Boutique')
  const [shop, setShop]           = useState<ShopData | null>(null)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setShopName(user.user_metadata?.full_name ?? 'Ma Boutique')
    })
    // Charger les données réelles de la boutique
    fetch('/api/merchant/shop', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async d => { 
        if (d?.shop) {
          setShop(d.shop)
          if (d.shop.name) setShopName(d.shop.name)
          const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', d.shop.id)
          setProductCount(count || 0)
        }
      })
      .catch(() => {})
    // Charger les nudges déjà dismissés depuis localStorage
    const saved = localStorage.getItem('nudges_dismissed')
    if (saved) setDismissed(JSON.parse(saved))
  }, [])

  function dismissNudge(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem('nudges_dismissed', JSON.stringify(next))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const score = computeScore(shop)

  /* Nudges à afficher selon ce qui manque */
  const nudges = [
    !shop?.city && { id: 'city',  icon: MapPin,  color: '#3b82f6', bg: '#eff6ff', title: 'Ajoutez votre ville',       desc: 'Aidez vos clients à vous localiser facilement.',               cta: 'Ajouter', href: '/merchant/shop' },
    !shop?.phone && { id: 'phone', icon: Phone,   color: '#25d366', bg: '#f0fdf4', title: 'Ajoutez votre WhatsApp',    desc: 'Recevez les commandes directement sur WhatsApp.',             cta: 'Ajouter', href: '/merchant/shop' },
    !shop?.logo_url && { id: 'logo', icon: Camera, color: '#f97316', bg: '#fff7ed', title: 'Ajoutez votre logo',      desc: 'Les boutiques avec logo vendent 3× plus.',                    cta: 'Ajouter', href: '/merchant/shop' },
    productCount !== null && { 
      id: productCount === 0 ? 'product' : 'product_more', 
      icon: Zap, color: '#8b5cf6', bg: '#f5f3ff', 
      title: productCount === 0 ? 'Ajoutez votre 1er produit' : "Ajoutez d'autres produits",                  
      desc: productCount === 0 ? 'Votre boutique est vide — mettez des produits en vente !' : 'Plus de produits = plus de ventes !',    
      cta: 'Ajouter', href: '/merchant/products/new' 
    },
  ].filter(Boolean).filter(n => n && !dismissed.includes((n as any).id)) as { id: string; icon: React.ElementType; color: string; bg: string; title: string; desc: string; cta: string; href: string }[]

  return (
    <div className="merchant-page-wrapper">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar">
        {/* ── LOGO JOKKO ── */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid hsl(214 32% 91%)' }}>
          <Link href="/merchant/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img 
              src="/logos/logo-jokoo-cart.png" 
              alt="Jokko" 
              style={{ height: 40, width: 'auto', objectFit: 'contain' }} 
            />
            <div style={{ borderLeft: '1.5px solid hsl(214 32% 88%)', paddingLeft: 8 }}>
              <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1 }}>ESPACE</div>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, lineHeight: 1.2 }}>MARCHAND</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
              style={{ marginBottom: 2, ...(item.accent ? { color: 'hsl(221 83% 53%)', background: 'hsl(221 83% 96%)', fontWeight: 700 } : {}) }}>
              <item.icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.active && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid hsl(214 32% 91%)' }}>
          <Link href="/boutiques/my-shop" className="sidebar-nav-item" style={{ marginBottom: 4 }}>
            <Eye size={18} /> <span>Voir ma boutique</span>
          </Link>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ width: '100%', color: 'hsl(0 72% 51%)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="merchant-content-area">

        {/* Mobile header — visible on mobile only */}
        <div className="merchant-mobile-header">
          <div>
            <div className="merchant-mobile-header-title">Tableau de bord</div>
            <div className="merchant-mobile-header-sub">Bonjour 👋 · {shopName}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/merchant/products/new" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'hsl(221 83% 53%)', color: 'white', border: 'none', cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }} aria-label="Ajouter un produit">
              <Plus size={18} />
            </Link>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: 'hsl(210 20% 97%)', border: '1px solid hsl(214 32% 91%)', cursor: 'pointer', position: 'relative' }} aria-label="Notifications">
              <Bell size={17} color="hsl(222 47% 20%)" />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
            </button>
          </div>
        </div>

        {/* Desktop topbar */}
        <div className="merchant-desktop-topbar" style={{ background: 'white', borderBottom: '1px solid hsl(214 32% 91%)', padding: '0 28px', height: 66, alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'hsl(222 47% 11%)' }}>Mon tableau de bord</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)' }}>{today.charAt(0).toUpperCase() + today.slice(1)} · Bonjour 👋</p>
          </div>
          <Link href="/merchant/products/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> Nouveau produit
          </Link>
        </div>

        {/* Inner content */}
        <div className="merchant-inner animate-fade-in">

          {/* ── ONBOARDING NUDGES ── */}
          {(score < 100 || nudges.length > 0) && (
            <div style={{ marginBottom: 20 }}>
              {/* Barre de progression */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'hsl(222 47% 20%)' }}>
                  Profil boutique — {score}% complet
                </div>
                <Link href="/merchant/shop" style={{ fontSize: '0.72rem', color: 'hsl(221 83% 53%)', textDecoration: 'none', fontWeight: 600 }}>Compléter →</Link>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'hsl(214 32% 91%)', marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: score === 100 ? 'hsl(158 64% 40%)' : 'linear-gradient(90deg, hsl(25 95% 53%), hsl(38 92% 50%))', width: `${score}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              {/* Cards nudges */}
              {nudges.slice(0, 2).map(n => (
                <div key={n.id} style={{ marginBottom: 8 }}>
                  <NudgeCard {...n} onDismiss={() => dismissNudge(n.id)} />
                </div>
              ))}
            </div>
          )}

          {/* ── STATS ── */}
          <div className="merchant-stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-card" style={{ padding: '14px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="stat-label" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    <div className="stat-value" style={{ marginTop: 6, fontSize: 'clamp(1.1rem, 4vw, 1.6rem)', lineHeight: 1.1 }}>{s.value}</div>
                    {s.change && (
                      <div style={{ marginTop: 5, color: s.up ? 'hsl(158 64% 40%)' : 'hsl(215 16% 55%)', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', fontWeight: 600 }}>
                        {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {s.change} ce mois
                      </div>
                    )}
                  </div>
                  <div className="stat-icon" style={{ background: s.bg, width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── TWO-COL SECTION ── */}
          <div className="merchant-bottom-grid">

            {/* Commandes récentes */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'hsl(222 47% 11%)' }}>Commandes récentes</h3>
                <Link href="/merchant/orders" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'hsl(221 83% 53%)', minHeight: 'auto', padding: '4px 10px' }}>Voir tout</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentOrders.map(order => {
                  const sc = statusMap[order.status]
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'hsl(210 20% 98%)', border: '1px solid hsl(214 32% 91%)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: sc.color, flexShrink: 0 }}>{order.id}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.83rem', color: 'hsl(222 47% 11%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer}</div>
                        <div style={{ fontSize: '0.7rem', color: 'hsl(215 16% 55%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product} · {order.date}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.83rem', color: 'hsl(222 47% 11%)', whiteSpace: 'nowrap' }}>{order.amount}</div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 7px', borderRadius: 999 }}>{sc.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top produits + Quick actions */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'hsl(222 47% 11%)' }}>Top produits</h3>
                <Link href="/merchant/products" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'hsl(221 83% 53%)', minHeight: 'auto', padding: '4px 10px' }}>Gérer</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topProducts.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? 'hsl(38 92% 95%)' : 'hsl(210 17% 95%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: i === 0 ? 'hsl(38 92% 40%)' : 'hsl(215 16% 55%)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>{p.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'hsl(222 47% 11%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(215 16% 55%)' }}>{p.sales} ventes · stock: {p.stock}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid hsl(214 32% 91%)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(215 16% 50%)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions rapides</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/merchant/products/new" className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <Plus size={14} /> Ajouter un produit
                  </Link>
                  {shop?.slug && (
                    <a 
                      href={`/boutique/${shop.slug}`} 
                      className="btn btn-sm" 
                      style={{ justifyContent: 'flex-start', background: '#25d366', color: 'white', textDecoration: 'none', border: 'none' }}
                    >
                      <Store size={14} /> Voir ma boutique publique
                    </a>
                  )}
                  <Link href="/merchant/orders" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                    <ShoppingBag size={14} /> Gérer les commandes
                  </Link>
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', color: 'hsl(0 72% 51%)', border: '1px solid hsl(0 72% 51% / 0.2)' }}>
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
