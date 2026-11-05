import type { Metadata } from 'next'
import MerchantBottomNav from '@/components/MerchantBottomNav'
import MerchantOrderAlert from '@/components/MerchantOrderAlert'

export const metadata: Metadata = {
  title: 'Espace Marchand — Jokoo',
  description: 'Gérez votre boutique, produits et commandes',
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      minHeight: '100vh',
      background: 'hsl(210 20% 98%)',
    }}>
      <MerchantOrderAlert />
      {children}
      <MerchantBottomNav />
    </div>
  )
}
