import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth si Supabase pas encore configuré (dev local sans .env)
  if (
    !supabaseUrl || supabaseUrl === 'your_supabase_project_url' ||
    !supabaseKey || supabaseKey === 'your_supabase_anon_key'
  ) {
    return NextResponse.next()
  }

  // ── Pattern officiel Supabase SSR ────────────────────────────────────────
  // Une seule réponse partagée. On ne la recrée JAMAIS dans setAll.
  // Recréer NextResponse.next() dans setAll causait "stream is closing or closed".
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Écrire d'abord sur la requête (pour que les Route Handlers en aval voient les cookies)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        // Écrire ensuite sur la réponse existante — NE PAS recréer NextResponse.next() ici
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT : appeler getUser() est obligatoire pour que Supabase
  // rafraîchisse le token de session et écrive les cookies mis à jour.
  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute    = pathname.startsWith('/admin')
  const isMerchantRoute = pathname.startsWith('/merchant')
  const isAuthRoute     = pathname === '/login' || pathname === '/register'
  const isSuiviRoute    = pathname.startsWith('/suivi') // page de suivi publique

  // Routes publiques : pas de redirection
  if (isSuiviRoute) {
    return supabaseResponse
  }

  if (!user && (isAdminRoute || isMerchantRoute)) {
    const redirectUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Transférer les cookies de session sur la réponse de redirection
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie as any)
    )
    return redirectResponse
  }

  if (user && isAuthRoute) {
    const role = user.app_metadata?.role
    let dest = '/'
    if (role === 'super_admin') dest = '/admin/dashboard'
    else if (role === 'merchant') dest = '/merchant/dashboard'
    const redirectResponse = NextResponse.redirect(new URL(dest, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie as any)
    )
    return redirectResponse
  }

  if (user && isAdminRoute && user.app_metadata?.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  if (user && isMerchantRoute) {
    const role = user.app_metadata?.role
    if (role !== 'merchant' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
