import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import { CartProvider } from '@/lib/cart-context'
import SWUpdater from '@/components/SWUpdater'
import ShopPromoPopup from '@/components/ShopPromoPopup'

export const viewport: Viewport = {
  themeColor: '#3B6FE8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
  ),
  title: {
    default: 'Jokoo — La marketplace africaine',
    template: '%s | Jokoo',
  },
  description: 'Découvrez des milliers de boutiques africaines. Achetez en ligne facilement avec Wave et Orange Money.',
  keywords: ['marketplace', 'afrique', 'ecommerce', 'boutique', 'wave', 'orange money', 'sénégal', 'côte d\'ivoire', 'mali'],
  authors: [{ name: 'Jokoo' }],
  creator: 'Jokoo',
  publisher: 'Jokoo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jokoo',
    startupImage: [
      {
        url: '/icon-512.jpg',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: true,
    url: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Jokoo',
    title: 'Jokoo — La marketplace africaine',
    description: 'Des milliers de boutiques africaines. Payez avec Wave ou Orange Money.',
    images: [{ url: '/icon-512.jpg', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jokoo',
    description: 'La marketplace africaine de référence',
    images: ['/icon-512.jpg'],
  },
  icons: {
    icon: [
      { url: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
      { url: '/icon-512.jpg', sizes: '192x192', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/icon-512.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
    shortcut: '/icon-512.jpg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* PWA iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jokoo" />
        <link rel="apple-touch-icon" href="/icon-512.jpg" />
        {/* PWA Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Jokoo" />
        {/* Windows Phone */}
        <meta name="msapplication-TileColor" content="#3B6FE8" />
        <meta name="msapplication-TileImage" content="/icon-512.jpg" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=yes" />
      </head>
      <body style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
        <CartProvider>
          <SWUpdater />
          {children}
          <BottomNav />
          <PWAInstallBanner />
          <ShopPromoPopup />
        </CartProvider>
      </body>
    </html>
  )
}
