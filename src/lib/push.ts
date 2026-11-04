import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export async function sendPushToShop(
  shopId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:listekhare@gmail.com', pub, priv)

  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('shop_id', shopId)
  if (!subs?.length) return

  await Promise.all(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { urgency: 'high', TTL: 86400 }
        )
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )
}
