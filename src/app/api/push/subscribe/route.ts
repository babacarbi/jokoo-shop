import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const sub = await req.json().catch(() => null)
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 })
  }
  const admin = await createAdminClient()
  const { data: shop } = await admin.from('shops').select('id').eq('owner_id', user.id).single()
  if (!shop) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  const { error } = await admin.from('push_subscriptions').upsert(
    { user_id: user.id, shop_id: shop.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: 'endpoint' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { endpoint } = await req.json().catch(() => ({}))
  if (!endpoint) return NextResponse.json({ error: 'endpoint requis' }, { status: 400 })
  const admin = await createAdminClient()
  await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
