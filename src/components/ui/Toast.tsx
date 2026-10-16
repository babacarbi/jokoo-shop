'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 350)
    }, duration)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [duration, onClose])

  const colors = {
    success: { bg: 'hsl(158 64% 97%)', border: 'hsl(158 64% 40%)', icon: 'hsl(158 64% 35%)', text: 'hsl(158 64% 28%)' },
    error:   { bg: 'hsl(0 84% 97%)',   border: 'hsl(0 84% 55%)',   icon: 'hsl(0 84% 45%)',   text: 'hsl(0 84% 38%)'   },
    info:    { bg: 'hsl(221 83% 97%)', border: 'hsl(221 83% 53%)', icon: 'hsl(221 83% 45%)', text: 'hsl(221 83% 35%)' },
  }
  const c = colors[type]
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info

  return (
    <div role="alert" style={{
      position: 'fixed',
      top: 24,
      left: '50%',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      borderRadius: 14,
      padding: '14px 16px',
      width: 'max-content',
      maxWidth: '90vw',
      boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
      transform: visible ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -120%) scale(0.95)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
    }}>
      <Icon size={20} color={c.icon} style={{flexShrink:0, marginTop:1}} />
      <span style={{flex:1, fontSize:'0.875rem', fontWeight:600, color:c.text, lineHeight:1.45}}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 350) }}
        style={{background:'none', border:'none', cursor:'pointer', padding:0, color:c.icon, flexShrink:0}}>
        <X size={16} />
      </button>
    </div>
  )
}
