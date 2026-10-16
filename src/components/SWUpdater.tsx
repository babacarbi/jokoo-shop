'use client'

import { useEffect } from 'react'

/**
 * Force le Service Worker à se mettre à jour immédiatement
 * Résout le problème de cache agressif (aggressiveFrontEndNavCaching)
 * qui sert l'ancien JavaScript sur mobile après un rebuild.
 */
export default function SWUpdater() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // 1. Forcer la mise à jour de tous les SW enregistrés
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => {
        reg.update()
      })
    })

    // 2. Écouter les nouveaux SW et les activer immédiatement
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Recharger silencieusement si un nouveau SW prend le contrôle
      // (uniquement si la page n'est pas en train d'être saisie)
      if (!document.querySelector('input:focus, textarea:focus')) {
        window.location.reload()
      }
    })
  }, [])

  return null
}
