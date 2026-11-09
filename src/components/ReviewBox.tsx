'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2, CheckCircle } from 'lucide-react'

/** Formulaire d'avis affiché sur la page de suivi quand la commande est livrée. */
export default function ReviewBox({ token }: { token: string }) {
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState<{ rating: number; comment: string | null } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/reviews?token=${encodeURIComponent(token)}`)
      .then(r => r.json()).then(d => { if (d.review) setDone(d.review) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [token])

  async function submit() {
    if (!rating) { setErr('Choisissez une note de 1 à 5 étoiles.'); return }
    setSending(true); setErr('')
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment.trim() || undefined }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok || r.status === 409) setDone({ rating, comment: comment.trim() || null })
      else setErr(d.error || 'Erreur, réessayez.')
    } catch { setErr('Erreur réseau.') }
    setSending(false)
  }

  if (loading) return null

  const box: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px', marginBottom: 16 }

  if (done) {
    return (
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#15803d', fontSize: '0.9rem', marginBottom: 6 }}>
          <CheckCircle size={18} /> Merci pour votre avis !
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= done.rating ? '#f59e0b' : 'none'} color={i <= done.rating ? '#f59e0b' : '#d1d5db'} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={box}>
      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', marginBottom: 4 }}>⭐ Donnez votre avis</div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Votre note aide les autres clients à choisir.</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', minHeight: 'auto', touchAction: 'manipulation' }}>
            <Star size={34} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : '#d1d5db'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={500} rows={3}
        placeholder="Votre commentaire (facultatif)…"
        style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 10, fontSize: '0.85rem', resize: 'none', marginBottom: 10, fontFamily: 'inherit' }} />
      {err && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginBottom: 8 }}>⚠️ {err}</div>}
      <button type="button" onClick={submit} disabled={sending}
        style={{ width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 'auto' }}>
        {sending ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : 'Envoyer mon avis'}
      </button>
    </div>
  )
}
