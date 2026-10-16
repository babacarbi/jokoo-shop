import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyOtp } from '@/lib/otp-store'

/**
 * POST /api/auth/register-phone
 *
 * Vérifie l'OTP côté serveur et crée/connecte l'utilisateur via l'Admin API
 * (bypasse la validation email de Supabase — sécurisé car service_role côté serveur)
 *
 * Body: { phone: string, code: string, role: 'merchant' | 'customer', pinCode: string }
 * Returns: { session: { access_token, refresh_token }, isNew: boolean }
 *
 * SÉCURITÉ : le rôle demandé par le client est restreint à 'merchant' | 'customer'
 * et stocké dans app_metadata (non modifiable par l'utilisateur). Le rôle
 * 'super_admin' ne peut JAMAIS être attribué par cette route.
 */

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>

// Recherche paginée d'un utilisateur par email (listUsers ne renvoie qu'une page)
async function findUserByEmail(admin: AdminClient, email: string) {
  const perPage = 1000
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return null
    const found = data.users.find(u => u.email === email)
    if (found) return found
    if (data.users.length < perPage) return null
  }
  return null
}

export async function POST(req: Request) {
  try {
    const { phone, code, role, pinCode } = await req.json()

    if (!phone || !code || !pinCode || !/^\d{4}$/.test(String(pinCode))) {
      return NextResponse.json({ error: 'Paramètres manquants ou code PIN invalide' }, { status: 400 })
    }

    // Rôle restreint : jamais de super_admin depuis le client. Par défaut : acheteur.
    const safeRole: 'merchant' | 'customer' = role === 'merchant' ? 'merchant' : 'customer'

    const normalized = String(phone).trim().replace(/\s+/g, '')

    // ── 1. Vérification OTP (consomme le code) ────────────────────────────
    const valid = await verifyOtp(normalized, String(code).trim())
    if (!valid) {
      return NextResponse.json(
        { error: 'Code invalide ou expiré. Vérifiez et réessayez.' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()

    // ── 2. Email synthétique + Mot de passe basé sur le PIN ─────────────────
    const syntheticEmail = `wa${normalized.replace(/^\+/, '')}@mkplace.io`
    const password = `${pinCode}-MkPlace24!`

    // ── 3. Créer l'utilisateur (Admin API — bypass email validation) ──────
    const { error: createError } = await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password: password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { phone: normalized },
      app_metadata: { role: safeRole },
    })

    const isNew = !createError
    const alreadyExists = !!createError && createError.message.toLowerCase().includes('already')

    if (createError && !alreadyExists) {
      console.error('[register-phone] Erreur création:', createError.message)
      return NextResponse.json({ error: 'Impossible de créer le compte.' }, { status: 500 })
    }

    // Utilisateur existant : nouveau PIN + rôle initialisé s'il n'existe pas encore
    if (alreadyExists) {
      const existingUser = await findUserByEmail(adminClient, syntheticEmail)
      if (existingUser) {
        const currentRole = existingUser.app_metadata?.role
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          ...(currentRole ? {} : { app_metadata: { ...existingUser.app_metadata, role: safeRole } }),
        })
      }
    }

    // ── 4. Connexion (fonctionne pour les nouveaux ET anciens utilisateurs) ─
    const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
      email: syntheticEmail,
      password: password,
    })

    if (signInError || !signInData.session) {
      console.error('[register-phone] Erreur sign-in:', signInError?.message)
      return NextResponse.json(
        { error: 'Impossible de créer la session. Réessayez.' },
        { status: 500 }
      )
    }

    // ── 5. Check if user already has a shop ─────────────────────────────────
    let hasShop = false
    if (signInData.user?.id) {
      const { data: shop } = await adminClient
        .from('shops')
        .select('id')
        .eq('owner_id', signInData.user.id)
        .maybeSingle()
      if (shop) hasShop = true
    }

    return NextResponse.json({
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      user: {
        id: signInData.user?.id,
        role: signInData.user?.app_metadata?.role ?? safeRole,
        phone: normalized,
      },
      isNew,
      hasShop,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[register-phone] Exception:', msg)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
