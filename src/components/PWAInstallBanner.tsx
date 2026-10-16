'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Montrer le banner après 30 secondes
      setTimeout(() => setShowBanner(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div className="pwa-install-banner" role="dialog" aria-label="Installer l'application">
      <img 
        src="/logos/logo-jokoo-cart.png" 
        alt="Jokoo" 
        style={{ width: 70, height: 'auto', objectFit: 'contain', flexShrink: 0 }} 
      />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2 }}>Installer Jokoo</p>
        <p style={{ fontSize: '0.75rem', color: 'hsl(220 15% 60%)' }}>Accédez à l'app comme sur mobile natif</p>
      </div>
      <button
        onClick={handleInstall}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'hsl(220 90% 56%)', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 }}
      >
        <Download size={14} /> Installer
      </button>
      <button
        onClick={() => setShowBanner(false)}
        style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(220 15% 55%)', flexShrink: 0 }}
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  )
}
