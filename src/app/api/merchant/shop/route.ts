import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper: get authenticated user
async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// GET /api/merchant/shop — retourne la boutique du marchand connecté
export async function GET() {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminClient = await createAdminClient()
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .select('id, name, slug, status, description, city, country, address, phone, email, whatsapp, website, logo_url, banner_url')
      .eq('owner_id', user.id)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    return NextResponse.json({ shop })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/merchant/shop — crée ou met à jour la boutique (admin client = bypass RLS)
export async function PUT(request: Request) {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, city, country, address, phone, email, logo_url, banner_url } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom de la boutique est requis' }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Check if user already has a shop
    const { data: existing, error: selectError } = await adminClient
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()  // maybeSingle ne throw pas si aucun résultat

    if (selectError) {
      console.error('[shop PUT] select error:', selectError)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    const slugBase = name.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Champs communs (colonnes garanties dans le schéma de base)
    const commonFields = {
      name,
      description: description || null,
      city,
      country: country || 'Sénégal',
      address: address || null,
      phone: phone || null,
      email: email || null,
      logo_url: logo_url !== undefined ? logo_url : null,
      banner_url: banner_url !== undefined ? banner_url : null,
    }

    let dbError = null

    if (existing?.id) {
      // UPDATE boutique existante (on ne met pas à jour le slug pour ne pas casser les liens et éviter les conflits)
      const { error: updateError } = await adminClient
        .from('shops')
        .update({ ...commonFields })
        .eq('id', existing.id)

      if (updateError) {
        console.error('[shop PUT] update error:', updateError)
        dbError = updateError
      }
    } else {
      // INSERT nouvelle boutique
      const slug = slugBase + '-' + Date.now().toString(36)
      const { error: insertError } = await adminClient
        .from('shops')
        .insert({
          owner_id: user.id,
          slug,
          status: 'pending',
          plan: 'free',
          ...commonFields,
        })

      if (insertError) {
        console.error('[shop PUT] insert error:', insertError)
        dbError = insertError
      }
    }

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Récupérer le slug généré pour retourner l'URL de partage
    const { data: shopRow } = await adminClient
      .from('shops')
      .select('slug')
      .eq('owner_id', user.id)
      .single()

    return NextResponse.json({ success: true, slug: shopRow?.slug ?? slugBase })
  } catch (err: any) {
    console.error('[shop PUT] unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}

