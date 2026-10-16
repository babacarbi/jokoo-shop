import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp-store'

// POST /api/otp/verify — vérifie un OTP pour un numéro de téléphone
export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      return NextResponse.json({ error: 'Numéro et code requis' }, { status: 400 })
    }

    const normalized = phone.trim().replace(/\s+/g, '')
    const valid = await verifyOtp(normalized, String(code).trim())

    if (!valid) {
      return NextResponse.json({ error: 'Code invalide ou expiré. Réessayez.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Numéro vérifié avec succès ✓' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
