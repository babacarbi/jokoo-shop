'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getOrderByTrackingToken } from '@/app/actions'
import { Package, CheckCircle, Truck, ClipboardList, XCircle, Clock, Home } from 'lucide-react'

type GuestOrderStatus =
  | 'new'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered_paid'
  | 'delivered_unpaid'
  | 'cancelled'

interface OrderData {
  id: string
  product_name: string
  product_img: string | null
  price: number
  quantity: number
  shop_name: string
  buyer_fullname: string | null
  buyer_prenom: string | null
  status: GuestOrderStatus
  created_at: string
  read_at: string | null
}

function fmt(p: number) {
  return p.toLocaleString('fr-FR') + ' FCFA'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Définition des étapes ───────────────────────────────────────────────────
const STEPS: {
  key: GuestOrderStatus
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  bg: string
}[] = [
  {
    key:      'new',
    label:    'Commande reçue',
    sublabel: 'Le marchand a bien reçu votre commande',
    icon:     ClipboardList,
    color:    '#2D6BE4',
    bg:       '#eff6ff',
  },
  {
    key:      'processing',
    label:    'En préparation',
    sublabel: 'Votre colis est en cours de préparation',
    icon:     Package,
    color:    '#d97706',
    bg:       '#fffbeb',
  },
  {
    key:      'out_for_delivery',
    label:    'En cours de livraison',
    sublabel: 'Votre colis est en route vers vous',
    icon:     Truck,
    color:    '#7c3aed',
    bg:       '#f5f3ff',
  },
  {
    key:      'delivered_paid',
    label:    'Livré · Payé',
    sublabel: 'Commande livrée et réglée — Merci !',
    icon:     CheckCircle,
    color:    '#16a34a',
    bg:       '#f0fdf4',
  },
  {
    key:      'delivered_unpaid',
    label:    'Livré · Non payé',
    sublabel: 'Livraison effectuée — paiement en attente',
    icon:     CheckCircle,
    color:    '#ea580c',
    bg:       '#fff7ed',
  },
]

function getStepIndex(status: GuestOrderStatus): number {
  if (status === 'cancelled') return -1
  if (status === 'delivered_paid' || status === 'delivered_unpaid') return 3
  return ['new', 'processing', 'out_for_delivery'].indexOf(status)
}

// ─── Étape visuelle ──────────────────────────────────────────────────────────
function StepRow({
  step,
  index,
  currentIndex,
  isCancelled,
  isLast,
}: {
  step: typeof STEPS[number]
  index: number
  currentIndex: number
  isCancelled: boolean
  isLast: boolean
}) {
  const isDone    = !isCancelled && index < currentIndex
  const isActive  = !isCancelled && index === currentIndex
  const isPending = isCancelled  || index > currentIndex

  const Icon = step.icon
  const circleColor = isDone
    ? '#16a34a'
    : isActive
      ? step.color
      : '#d1d5db'

  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      {/* Ligne verticale */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 19, top: 40, bottom: 0,
          width: 2,
          background: isDone ? '#16a34a' : '#e5e7eb',
          zIndex: 0,
        }} />
      )}

      {/* Cercle / icône */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDone ? '#f0fdf4' : isActive ? step.bg : '#f9fafb',
        border: `2px solid ${circleColor}`,
        zIndex: 1,
        transition: 'all 0.3s',
        boxShadow: isActive ? `0 0 0 4px ${step.color}22` : 'none',
      }}>
        {isDone
          ? <CheckCircle size={18} color="#16a34a" />
          : <Icon size={18} color={circleColor} />
        }
      </div>

      {/* Texte */}
      <div style={{ paddingTop: 8, paddingBottom: isLast ? 0 : 24, flex: 1 }}>
        <div style={{
          fontWeight: isActive ? 800 : isDone ? 600 : 400,
          color: isPending ? '#9ca3af' : isDone ? '#374151' : step.color,
          fontSize: isActive ? '1rem' : '0.88rem',
          transition: 'all 0.3s',
        }}>
          {step.label}
        </div>
        {isActive && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3, lineHeight: 1.5 }}>
            {step.sublabel}
          </div>
        )}
      </div>

      {/* Badge "En cours" */}
      {isActive && (
        <div style={{
          alignSelf: 'center', flexShrink: 0,
          background: step.bg, color: step.color,
          fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px',
          borderRadius: 20, border: `1px solid ${step.color}44`,
          letterSpacing: '0.04em',
        }}>
          EN COURS
        </div>
      )}
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function SuiviPage() {
  const { token } = useParams<{ token: string }>()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    getOrderByTrackingToken(token as string).then(data => {
      if (!data) setNotFound(true)
      else setOrder(data as OrderData)
      setLoading(false)
    })
  }, [token])

  // ── Chargement ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600 }}>Chargement de votre suivi…</div>
        </div>
      </div>
    )
  }

  // ── Non trouvé ──
  if (notFound || !order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 36, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#111827', marginBottom: 8 }}>
            Commande introuvable
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>
            Ce lien de suivi n&apos;existe pas ou a expiré. Vérifiez le lien reçu par WhatsApp.
          </p>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2D6BE4', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>
            <Home size={16} /> Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  // ── Annulée ──
  if (order.status === 'cancelled') {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 36, textAlign: 'center', maxWidth: 380, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <XCircle size={32} color="#dc2626" />
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.2rem', color: '#111827', marginBottom: 8 }}>
            Commande annulée
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 8 }}>
            {order.buyer_prenom ?? order.buyer_fullname}, votre commande <strong>{order.product_name}</strong> auprès de <strong>{order.shop_name}</strong> a été annulée.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: 20 }}>
            Contactez le marchand pour plus d&apos;informations.
          </p>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f3f4f6', color: '#374151', padding: '12px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '0.88rem' }}>
            <Home size={16} /> Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const currentIndex = getStepIndex(order.status)
  const currentStep  = STEPS[currentIndex] ?? STEPS[0]

  // Pour les statuts de livraison, on affiche les 3 premières étapes + l'étape finale choisie
  const visibleSteps = order.status === 'delivered_paid' || order.status === 'delivered_unpaid'
    ? [...STEPS.slice(0, 3), STEPS.find(s => s.key === order.status)!]
    : STEPS.slice(0, 3)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0f1e 0%, #1e293b 40%, #f1f5f9 40%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '0 0 40px',
    }}>

      {/* ── Header ── */}
      <div style={{ padding: '24px 20px 40px', position: 'relative' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.8rem', marginBottom: 20 }}>
          <Home size={14} /> Jokoo
        </Link>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Suivi de commande
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.5rem', color: 'white', marginBottom: 4 }}>
            {order.buyer_prenom ?? order.buyer_fullname ?? 'Votre commande'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
            Boutique : {order.shop_name}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Carte statut actuel ── */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          marginBottom: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          border: `2px solid ${currentStep.color}22`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 15,
              background: currentStep.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 16px ${currentStep.color}30`,
            }}>
              <currentStep.icon size={26} color={currentStep.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#111827' }}>
                {currentStep.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                {currentStep.sublabel}
              </div>
            </div>
          </div>

          {/* Produit */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f9fafb', borderRadius: 12, padding: '12px' }}>
            {order.product_img && (
              <img
                src={order.product_img}
                alt={order.product_name}
                style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10, background: 'white', padding: 4, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem', marginBottom: 2 }}>{order.product_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Qté : {order.quantity}</div>
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1rem', color: '#2D6BE4', flexShrink: 0 }}>
              {fmt(order.price)}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
              Commandé le {fmtDate(order.created_at)}
            </div>
            {order.read_at && (
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                Lu le {fmtDate(order.read_at)}
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline des étapes ── */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          marginBottom: 16,
        }}>
          <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', marginBottom: 20 }}>
            Progression de votre commande
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visibleSteps.map((step, i) => (
              <StepRow
                key={step.key}
                step={step}
                index={i}
                currentIndex={
                  order.status === 'delivered_paid' || order.status === 'delivered_unpaid'
                    ? visibleSteps.length - 1
                    : currentIndex
                }
                isCancelled={order.status === 'cancelled'}
                isLast={i === visibleSteps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ── Message livré non payé ── */}
        {order.status === 'delivered_unpaid' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>💳</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem', marginBottom: 3 }}>Paiement en attente</div>
              <p style={{ margin: 0, color: '#78350f', fontSize: '0.75rem', lineHeight: 1.6 }}>
                Votre colis a été livré. Le marchand attend votre règlement. Contactez-le pour finaliser le paiement.
              </p>
            </div>
          </div>
        )}

        {/* ── Message livré payé ── */}
        {order.status === 'delivered_paid' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.85rem', marginBottom: 3 }}>Commande complète !</div>
              <p style={{ margin: 0, color: '#166534', fontSize: '0.75rem', lineHeight: 1.6 }}>
                Votre commande a été livrée et réglée. Merci de votre confiance et bonne utilisation !
              </p>
            </div>
          </div>
        )}

        {/* ── Note informative ── */}
        <div style={{ background: 'rgba(45,107,228,0.06)', border: '1px solid rgba(45,107,228,0.12)', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <Clock size={16} color="#2D6BE4" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, color: '#1e40af', fontSize: '0.75rem', lineHeight: 1.6 }}>
            Cette page se met à jour automatiquement. Gardez ce lien pour suivre l&apos;avancement de votre commande.
          </p>
        </div>

        {/* ── Bouton retour ── */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#2D6BE4', color: 'white', padding: '14px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: '0.92rem' }}>
          <Home size={17} /> Retour à l&apos;accueil
        </Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  )
}
