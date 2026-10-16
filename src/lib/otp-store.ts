/**
 * OTP Store — persistant (table Supabase `otp_codes`), compatible serverless.
 * - Code stocké haché (SHA-256 + sel serveur), jamais en clair.
 * - Délai minimum entre deux envois (anti-spam WhatsApp).
 * - 5 tentatives maximum par code.
 * Clé: numéro de téléphone normalisé.
 */
import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const OTP_TTL_MS      = 5 * 60 * 1000 // 5 minutes
const RESEND_DELAY_MS = 30 * 1000     // 30 secondes entre deux envois
const MAX_ATTEMPTS    = 5

export class OtpRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Veuillez patienter ${retryAfterSeconds}s avant de redemander un code.`)
  }
}

function hash(phone: string, code: string) {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'jokoo'
  return createHash('sha256').update(`${salt}:${phone}:${code}`).digest('hex')
}

export async function generateOtp(phone: string): Promise<string> {
  const db = await createAdminClient()

  const { data: existing } = await db
    .from('otp_codes').select('created_at').eq('phone', phone).maybeSingle()
  if (existing) {
    const elapsed = Date.now() - new Date(existing.created_at).getTime()
    if (elapsed < RESEND_DELAY_MS) {
      throw new OtpRateLimitError(Math.ceil((RESEND_DELAY_MS - elapsed) / 1000))
    }
  }

  const code = randomInt(100000, 1000000).toString()
  const { error } = await db.from('otp_codes').upsert({
    phone,
    code_hash: hash(phone, code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    created_at: new Date().toISOString(),
  })
  if (error) throw new Error('Impossible de générer le code. Réessayez.')
  return code
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const db = await createAdminClient()
  const { data: entry } = await db
    .from('otp_codes').select('code_hash, expires_at, attempts').eq('phone', phone).maybeSingle()
  if (!entry) return false

  if (Date.now() > new Date(entry.expires_at).getTime() || entry.attempts >= MAX_ATTEMPTS) {
    await db.from('otp_codes').delete().eq('phone', phone)
    return false
  }

  const a = Buffer.from(hash(phone, code))
  const b = Buffer.from(entry.code_hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.from('otp_codes').update({ attempts: entry.attempts + 1 }).eq('phone', phone)
    return false
  }

  await db.from('otp_codes').delete().eq('phone', phone) // Invalider après usage
  return true
}
