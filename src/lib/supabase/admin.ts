import { createClient } from '@supabase/supabase-js'

// Client avec les droits SERVICE_ROLE (admin) — uniquement côté serveur
// createClient (pas createServerClient) + service_role = bypass RLS complet
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
