import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    }

    const normalized = phone.trim().replace(/\s+/g, '')
    const adminClient = await createAdminClient()
    
    const { data: shop } = await adminClient
      .from('shops')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      userExists: !!shop,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
