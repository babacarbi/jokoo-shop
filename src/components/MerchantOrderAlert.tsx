'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyOrdersAction } from '@/app/actions'

/**
 * Alerte visuelle clignotante dans l'app quand une nouvelle commande arrive
 * (vérification toutes les 12 s tant que l'espace marchand est ouvert).
 */
export default function MerchantOrderAlert() {
  const router = useRouter()
  const known = useRef<Set<string> | null>(null)
  const [alert, setAlert] = useState<{ count: number; text: string } | null>(null)

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new Ctx()
      ;[0, 0.25, 0.5].forEach(t => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination)
        g.gain.setValueAtTime(0.25, ctx.currentTime + t)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2)
      })
    } catch {}
    try { navigator.vibrate?.([300, 150, 300, 150, 300]) } catch {}
  }

  useEffect(() => {
    let stop = false
    async function check() {
      try {
        const orders: any[] = (await getMyOrdersAction()) as any[]
        if (stop) return
        const ids = new Set(orders.map(o => o.id as string))
        if (known.current === null) { known.current = ids; return }
        const fresh = orders.filter(o => !known.current!.has(o.id) && o.status === 'new')
        known.current = ids
        if (fresh.length > 0) {
          const f = fresh[0]
          setAlert({
            count: fresh.length,
            text: `${f.product_name} × ${f.quantity} — ${Number(f.price).toLocaleString('fr-FR')} FCFA`,
          })
          beep()
          window.dispatchEvent(new CustomEvent('jokoo:new-order'))
        }
      } catch {}
    }
    check()
    const t = setInterval(check, 12000)
    return () => { stop = true; clearInterval(t) }
  }, [])

  if (!alert) return null

  return (
    <>
      <style>{`@keyframes jokooBlink{0%,100%{background:#dc2626;transform:scale(1)}50%{background:#f97316;transform:scale(1.02)}}`}</style>
      <div
        role="alert"
        onClick={() => { setAlert(null); router.push('/merchant/orders') }}
        style={{
          position: 'fixed', top: 'calc(8px + env(safe-area-inset-top, 0px))', left: 8, right: 8, zIndex: 1000,
          color: '#fff', borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(220,38,38,.5)', animation: 'jokooBlink 0.9s infinite',
          display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <span style={{ fontSize: 28 }}>🔔</span>
        <div style={{ flex: 1, lineHeight: 1.3 }}>
          <div style={{ fontWeight: 900, fontSize: '1rem' }}>
            {alert.count > 1 ? `${alert.count} nouvelles commandes !` : 'Nouvelle commande !'}
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>{alert.text} · Touchez pour voir</div>
        </div>
        <button
          aria-label="Fermer"
          onClick={e => { e.stopPropagation(); setAlert(null) }}
          style={{ background: 'rgba(255,255,255,.25)', border: 'none', color: '#fff', borderRadius: 10, width: 32, height: 32, fontSize: 16, cursor: 'pointer' }}
        >✕</button>
      </div>
    </>
  )
}
