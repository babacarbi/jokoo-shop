import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://jokoo-shop.vercel.app')
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/merchant', '/admin', '/api', '/commande', '/panier', '/suivi', '/mes-commandes', '/compte', '/login', '/register'],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
