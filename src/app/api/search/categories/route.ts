import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createAdminClient()
  const { data } = await supabase.from('categories').select('id, name').order('name').limit(50)
  return NextResponse.json({ categories: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
