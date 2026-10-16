import { NextResponse } from 'next/server'
import { generateOtp, OtpRateLimitError } from '@/lib/otp-store'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/otp/generate — génère un OTP et l'envoie via WhatsApp (Fonnte)
export async function POST(req: Request) {
  try {
    const { phone, dialCode } = await req.json()
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }

    const normalized = phone.trim().replace(/\s+/g, '')
    const code = await generateOtp(normalized)

    // Vérifier si ce numéro est déjà enregistré (possède une boutique ou compte)
    const adminClient = await createAdminClient()
    const { data: shop } = await adminClient.from('shops').select('id').eq('phone', normalized).maybeSingle()
    const userExists = !!shop

    const FONNTE_TOKEN = process.env.FONNTE_TOKEN ?? ''

    // ── Mode production : envoi réel via Fonnte ─────────────────────────
    if (FONNTE_TOKEN && FONNTE_TOKEN !== 'VOTRE_TOKEN_FONNTE_ICI') {

      // Extraire le numéro local (sans indicatif) + countryCode pour Fonnte
      // ex: dialCode="+221", phone="+221777368506" → localNum="777368506", countryCode="221"
      const dial = (dialCode ?? '').replace(/^\+/, '') // "221"
      const localNum = normalized.startsWith(dialCode)
        ? normalized.slice(dialCode.length)        // "+221777368506" → "777368506"
        : normalized.replace(/^\+/, '')             // fallback : juste le "+" supprimé

      console.log(`[Fonnte] Envoi → localNum: ${localNum}, countryCode: ${dial}`)

      const body = new URLSearchParams({
        target: localNum,       // ex: 777368506
        message: `🛒 *Jokoo*\n\nVotre code de vérification :\n\n*${code}*\n\nValide 5 minutes. Ne le partagez pas.`,
        countryCode: dial,      // ex: 221 → Fonnte envoie à 221777368506
      })

      const fonnteRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: FONNTE_TOKEN },
        body,
      })

      const fonnteData = await fonnteRes.json().catch(() => ({}))
      console.log('[Fonnte] status:', fonnteRes.status, 'data:', JSON.stringify(fonnteData))

      if (!fonnteRes.ok || fonnteData?.status === false) {
        const detail = fonnteData?.reason ?? fonnteData?.message ?? 'Erreur inconnue'
        console.error('[Fonnte] Échec envoi:', detail)
        return NextResponse.json(
          { error: `Impossible d'envoyer le code WhatsApp (${detail})` },
          { status: 502 }
        )
      }

      // ✅ En production : NE PAS retourner le code dans la réponse
      return NextResponse.json({
        success: true,
        message: `Code envoyé sur WhatsApp au ${normalized}`,
        expiresInMinutes: 5,
        userExists,
      })
    }

    // ── Mode développement uniquement : retourner le code dans la réponse ──
    if (process.env.NODE_ENV === 'production') {
      console.error('[OTP] FONNTE_TOKEN manquant en production — envoi impossible')
      return NextResponse.json({ error: 'Service de vérification indisponible' }, { status: 503 })
    }
    console.warn('[OTP] Mode DEV — code retourné dans la réponse (non sécurisé)')
    return NextResponse.json({
      success: true,
      code,
      message: `[DEV] Code généré pour ${normalized}`,
      expiresInMinutes: 5,
      dev: true,
      userExists,
    })
  } catch (err: unknown) {
    if (err instanceof OtpRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[OTP] Exception:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
