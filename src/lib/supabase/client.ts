import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const isConfigured =
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY.length > 10

export function createClient() {
  if (!isConfigured) {
    // Retourne un client factice en dev sans .env configuré
    // Les appels auth échoueront silencieusement
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key-for-local-dev-only'
    )
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export { isConfigured as isSupabaseConfigured }
