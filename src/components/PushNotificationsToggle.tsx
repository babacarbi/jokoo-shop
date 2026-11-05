'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type State = 'loading' | 'unsupported' | 'ios-install' | 'off' | 'on' | 'denied'

export default function PushNotificationsToggle({ silent = false }: { silent?: boolean }) {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    if (isIOS && !standalone) return setState('ios-install')
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState('unsupported')
    if (Notification.permission === 'denied') return setState('denied')
    const userOff = localStorage.getItem('jokoo_push_off') === '1'
    let cleanup: (() => void) | undefined
    navigator.serviceWorker.register('/sw.js').then(reg => reg.pushManager.getSubscription()).then(async sub => {
      const granted = Notification.permission === 'granted'
      setState(sub && granted ? 'on' : 'off')
      if (userOff || !silent) return
      if (granted) {
        // Déjà autorisé : on (ré)enregistre l'abonnement automatiquement
        enable(true)
      } else {
        // Activation par défaut : le navigateur exige un geste -> au premier toucher
        const once = () => { enable(true) }
        document.addEventListener('click', once, { once: true })
        document.addEventListener('touchend', once, { once: true })
        cleanup = () => {
          document.removeEventListener('click', once)
          document.removeEventListener('touchend', once)
        }
      }
    }).catch(() => setState('off'))
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    const h = () => setState('on')
    window.addEventListener('jokoo:push-on', h)
    return () => window.removeEventListener('jokoo:push-on', h)
  }, [])

  async function enable(auto = false) {
    setBusy(true); setErr('')
    try {
      localStorage.removeItem('jokoo_push_off')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState('denied'); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) throw new Error('Clé VAPID manquante')
      const sub = (await reg.pushManager.getSubscription()) ||
        await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur serveur')
      setState('on')
      window.dispatchEvent(new CustomEvent('jokoo:push-on'))
    } catch (e: any) {
      setErr(e?.message || 'Activation impossible')
    } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      localStorage.setItem('jokoo_push_off', '1')
      setState('off')
    } finally { setBusy(false) }
  }

  if (silent || state === 'loading') return null

  const box: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
    background: state === 'on' ? '#ecfdf5' : '#fff7ed', border: `1px solid ${state === 'on' ? '#a7f3d0' : '#fed7aa'}`,
    marginBottom: 16, flexWrap: 'wrap', fontSize: 14,
  }
  const btn: React.CSSProperties = {
    marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontWeight: 700, background: '#f97316', color: '#fff',
  }

  return (
    <div style={box}>
      <span style={{ fontSize: 22 }}>{state === 'on' ? '🔔' : '🔕'}</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        {state === 'on' && <strong>Notifications activées ✓ — vous serez alerté à chaque commande, même écran verrouillé.</strong>}
        {state === 'off' && <><strong>Soyez alerté à chaque commande</strong><br />Recevez une notification sur ce téléphone, même verrouillé.</>}
        {state === 'denied' && <>Notifications bloquées. Autorisez-les dans les réglages du navigateur pour ce site.</>}
        {state === 'unsupported' && <>Ce navigateur ne supporte pas les notifications.</>}
        {state === 'ios-install' && <>Sur iPhone : touchez <strong>Partager</strong> puis <strong>« Sur l’écran d’accueil »</strong>, ouvrez Jokoo depuis l’icône, puis activez les notifications.</>}
        {err && <div style={{ color: '#dc2626', marginTop: 4 }}>{err}</div>}
      </div>
      {state === 'off' && <button style={btn} onClick={() => enable()} disabled={busy}>{busy ? '…' : 'Activer'}</button>}
      {state === 'on' && <button style={{ ...btn, background: '#fff', color: '#6b7280', border: '1px solid #d1d5db' }} onClick={disable} disabled={busy}>Désactiver</button>}
    </div>
  )
}
