'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Link2 } from 'lucide-react'

export default function ShareShopCard({ url, shopName }: { url: string; shopName: string }) {
  const [copied, setCopied] = useState(false)
  const text = `Découvrez ${shopName} sur Jokoo : ${url}`

  async function copy() {
    try { await navigator.clipboard.writeText(url) }
    catch {
      const t = document.createElement('textarea')
      t.value = url; document.body.appendChild(t); t.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(t)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title: shopName, text: `Découvrez ${shopName} sur Jokoo`, url }) } catch {}
    } else copy()
  }

  return (
    <div style={{ background: 'white', margin: '12px 16px 0', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.85rem', color: '#111827', marginBottom: 8 }}>
        <Link2 size={15} color="#2563eb" /> Lien de la boutique
      </div>
      <div style={{ background: '#eff6ff', border: '1.5px dashed #93c5fd', borderRadius: 10, padding: '10px 12px', fontSize: '0.86rem', fontWeight: 700, color: '#1d4ed8', wordBreak: 'break-all', lineHeight: 1.35, marginBottom: 10 }}>
        {url}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copy} style={{ flex: 1, minHeight: 46, borderRadius: 12, border: '2px solid #2563eb', background: copied ? '#2563eb' : 'white', color: copied ? 'white' : '#2563eb', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {copied ? <><Check size={16} /> Copié !</> : <><Copy size={16} /> Copier</>}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minHeight: 46, borderRadius: 12, background: '#25d366', color: 'white', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
          WhatsApp
        </a>
        <button onClick={nativeShare} aria-label="Partager" style={{ width: 46, minHeight: 46, borderRadius: 12, border: 'none', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={17} />
        </button>
      </div>
    </div>
  )
}
