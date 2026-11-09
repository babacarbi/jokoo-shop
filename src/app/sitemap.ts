import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600 // régénéré au plus 1x/heure (économie d'egress)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://jokoo-shop.vercel.app')

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/categories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/boutiques`, changeFrequency: 'daily', priority: 0.7 },
  ]

  try {
    const supabase = await createAdminClient()
    const [{ data: products }, { data: shops }] = await Promise.all([
      supabase.from('products').select('id, updated_at').eq('status', 'active').limit(5000),
      supabase.from('shops').select('slug, updated_at').eq('status', 'active').limit(2000),
    ])
    for (const p of products ?? []) {
      entries.push({ url: `${base}/produit/${p.id}`, lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.8 })
    }
    for (const s of shops ?? []) {
      if (s.slug) entries.push({ url: `${base}/boutique/${s.slug}`, lastModified: s.updated_at, changeFrequency: 'daily', priority: 0.6 })
    }
  } catch {}

  return entries
}
