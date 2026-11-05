/** Aides client pour activer les notifications push (inscription marchand). */

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** À appeler DIRECTEMENT dans un clic (geste utilisateur requis par le navigateur). */
export function askPushPermission(): Promise<NotificationPermission | null> {
  if (!pushSupported()) return Promise.resolve(null)
  try { return Notification.requestPermission() } catch { return Promise.resolve(null) }
}

/** À appeler une fois la boutique créée (session marchand active). */
export async function subscribePush(): Promise<boolean> {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return false
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!key) return false
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ||
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
    const res = await fetch('/api/push/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(sub.toJSON()),
    })
    if (res.ok) localStorage.removeItem('jokoo_push_off')
    return res.ok
  } catch { return false }
}
