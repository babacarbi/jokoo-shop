'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Phone, User, Globe, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

const ORANGE = '#f97316'
const BLUE = '#2D6BE4'

function fmt(p: number) { return p.toLocaleString('fr-FR') + ' FCFA' }

// Pays avec indicatifs téléphoniques
const COUNTRIES = [
  // Afrique de l'Ouest (prioritaires)
  { code: 'SN', name: 'Sénégal',             dial: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Côte d\'Ivoire',       dial: '+225', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali',                 dial: '+223', flag: '🇲🇱' },
  { code: 'GN', name: 'Guinée',               dial: '+224', flag: '🇬🇳' },
  { code: 'BF', name: 'Burkina Faso',         dial: '+226', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo',                 dial: '+228', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin',                dial: '+229', flag: '🇧🇯' },
  { code: 'NE', name: 'Niger',                dial: '+227', flag: '🇳🇪' },
  { code: 'MR', name: 'Mauritanie',           dial: '+222', flag: '🇲🇷' },
  { code: 'GM', name: 'Gambie',               dial: '+220', flag: '🇬🇲' },
  { code: 'GW', name: 'Guinée-Bissau',        dial: '+245', flag: '🇬🇼' },
  { code: 'CV', name: 'Cap-Vert',             dial: '+238', flag: '🇨🇻' },
  { code: 'SL', name: 'Sierra Leone',         dial: '+232', flag: '🇸🇱' },
  { code: 'LR', name: 'Liberia',              dial: '+231', flag: '🇱🇷' },
  { code: 'GH', name: 'Ghana',                dial: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria',              dial: '+234', flag: '🇳🇬' },
  // Afrique Centrale
  { code: 'CM', name: 'Cameroun',             dial: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon',                dial: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo',                dial: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'RD Congo',             dial: '+243', flag: '🇨🇩' },
  { code: 'CF', name: 'Centrafrique',         dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Tchad',                dial: '+235', flag: '🇹🇩' },
  { code: 'GQ', name: 'Guinée Équatoriale',   dial: '+240', flag: '🇬🇶' },
  // Afrique de l'Est
  { code: 'ET', name: 'Éthiopie',             dial: '+251', flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya',                dial: '+254', flag: '🇰🇪' },
  { code: 'TZ', name: 'Tanzanie',             dial: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda',               dial: '+250', flag: '🇷🇼' },
  { code: 'UG', name: 'Ouganda',              dial: '+256', flag: '🇺🇬' },
  // Afrique du Nord
  { code: 'MA', name: 'Maroc',                dial: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie',              dial: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie',              dial: '+216', flag: '🇹🇳' },
  { code: 'LY', name: 'Libye',                dial: '+218', flag: '🇱🇾' },
  { code: 'EG', name: 'Égypte',               dial: '+20',  flag: '🇪🇬' },
  // Afrique du Sud
  { code: 'ZA', name: 'Afrique du Sud',       dial: '+27',  flag: '🇿🇦' },
  // Europe
  { code: 'FR', name: 'France',               dial: '+33',  flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique',             dial: '+32',  flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse',               dial: '+41',  flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne',            dial: '+49',  flag: '🇩🇪' },
  { code: 'GB', name: 'Royaume-Uni',          dial: '+44',  flag: '🇬🇧' },
  { code: 'ES', name: 'Espagne',              dial: '+34',  flag: '🇪🇸' },
  { code: 'IT', name: 'Italie',               dial: '+39',  flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal',             dial: '+351', flag: '🇵🇹' },
  // Amérique
  { code: 'US', name: 'États-Unis',           dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',               dial: '+1',   flag: '🇨🇦' },
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function CommandePage() {
  const router = useRouter()
  const { items, totalPrice, totalItems, clearCart } = useCart()

  const [fullName, setFullName] = useState('')
  const [country, setCountry]   = useState('SN')
  const [phoneNum, setPhoneNum] = useState('')
  const [isWhatsapp, setIsWhatsapp] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [orderId, setOrderId] = useState('')
  const [merchantGroups, setMerchantGroups] = useState<Record<string, any>>({})

  const selectedCountry = COUNTRIES.find(c => c.code === country) ?? COUNTRIES[0]

  if (items.length === 0 && status !== 'success') {
    router.replace('/panier')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !phoneNum.trim()) {
      setErrMsg('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setErrMsg('')
    setStatus('loading')

    try {
      // Envoyer chaque article comme commande séparée (ou en lot)
      const promises = items.map(item =>
        fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: String(item.id),
            product_name: item.name,
            product_img: item.img,
            price: item.price * item.quantity,
            buyer_prenom: fullName.trim().split(' ')[0] ?? fullName.trim(),
            buyer_nom: fullName.trim().split(' ').slice(1).join(' ') || fullName.trim(),
            buyer_phone: `${selectedCountry.dial} ${phoneNum.trim()}${isWhatsapp ? ' (WhatsApp)' : ''}`,
            buyer_country: selectedCountry.name,
            buyer_whatsapp: isWhatsapp,
            buyer_fullname: fullName.trim(),
            quantity: item.quantity,
            shop_name: item.shop,
          }),
        })
      )
      const results = await Promise.all(promises)
      const allOk = results.every(r => r.ok)
      if (allOk) {
        const firstData = await results[0].json()
        setOrderId(firstData.order_id ?? 'OK')
        
        // Grouper par marchand
        const groups: Record<string, { shopName: string, items: any[], total: number }> = {}
        items.forEach(item => {
          const phone = item.merchantPhone || 'Inconnu'
          if (!groups[phone]) groups[phone] = { shopName: item.shop, items: [], total: 0 }
          groups[phone].items.push(item)
          groups[phone].total += (item.price * item.quantity)
        })
        
        setMerchantGroups(groups)
        setStatus('success')
        clearCart()

        // Si un seul marchand, on peut tenter une redirection automatique (ou laisser le client cliquer)
        const phones = Object.keys(groups)
        if (phones.length === 1 && phones[0] !== 'Inconnu') {
          const phone = phones[0]
          const g = groups[phone]
          
          let text = `*Nouvelle commande depuis Jokoo* 🛍️\n\n`
          text += `👤 *Client* : ${fullName.trim()}\n`
          text += `📞 *Tél* : ${selectedCountry.dial} ${phoneNum.trim()}\n`
          text += `🌍 *Pays* : ${selectedCountry.name}\n\n`
          text += `*Produits* :\n`
          g.items.forEach(i => {
            text += `- ${i.quantity}x ${i.name} (${fmt(i.price)})\n`
          })
          text += `\n💰 *Total* : ${fmt(g.total)}\n`

          const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`
          
          // Redirection directe pour éviter le blocage des pop-ups
          setTimeout(() => {
            window.location.href = waUrl
          }, 600)
        }

      } else {
        const failed = results.find(r => !r.ok)
        const body = failed ? await failed.json().catch(() => null) : null
        setErrMsg(body?.error ?? 'Erreur lors de l\'envoi. Veuillez réessayer.')
        setStatus('error')
      }
    } catch {
      setErrMsg('Erreur réseau. Vérifiez votre connexion.')
      setStatus('error')
    }
  }

  // ── CONFIRMATION ──
  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 380, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 72, height: 72, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: '#111827', marginBottom: 10 }}>
            Commande confirmée ! 🎉
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 20 }}>
            Merci <strong>{fullName}</strong> !<br />
            Votre commande a bien été enregistrée.
          </p>
          
          {Object.keys(merchantGroups).map(phone => {
            if (phone === 'Inconnu') return null
            const g = merchantGroups[phone]
            let text = `*Nouvelle commande depuis Jokoo* 🛍️\n\n`
            text += `👤 *Client* : ${fullName.trim()}\n`
            text += `📞 *Tél* : ${selectedCountry.dial} ${phoneNum.trim()}\n`
            text += `🌍 *Pays* : ${selectedCountry.name}\n\n`
            text += `*Produits* :\n`
            g.items.forEach((i: any) => {
              text += `- ${i.quantity}x ${i.name} (${fmt(i.price)})\n`
            })
            text += `\n💰 *Total* : ${fmt(g.total)}\n`
            const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`

            return (
              <a key={phone} href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25d366', color: 'white', padding: '14px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem', marginBottom: 12 }}>
                <MessageCircle size={20} />
                Envoyer à {g.shopName} sur WhatsApp
              </a>
            )
          })}

          <Link href="/" style={{ display: 'block', background: '#f3f4f6', color: '#374151', padding: '14px', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem', marginTop: 12 }}>
            Continuer mes achats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', minHeight: 'auto' }}>
          <ArrowLeft size={20} color="#374151" />
        </button>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
          Finaliser ma commande
        </span>
      </nav>

      {/* ── RÉCAP COMMANDE ── */}
      <div style={{ margin: '10px 12px', background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>
          🛒 Votre commande ({totalItems} article{totalItems > 1 ? 's' : ''})
        </div>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <img src={item.img} alt={item.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#f9fafb', padding: 3, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{item.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Qté: {item.quantity}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: BLUE, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</div>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem' }}>Total</span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', fontFamily: 'Outfit, sans-serif' }}>{fmt(totalPrice)}</span>
        </div>
      </div>

      {/* ── FORMULAIRE ── */}
      <form onSubmit={handleSubmit} style={{ margin: '0 12px' }}>
        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          {/* Header formulaire */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2D6BE4)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <User size={16} color="white" />
              <span style={{ color: 'white', fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem' }}>
                Vos coordonnées
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: 0 }}>
              Le vendeur vous appellera pour livrer votre commande
            </p>
          </div>

          <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Nom complet */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Nom complet *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Ex: Moussa Diallo"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '11px 12px 11px 34px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = BLUE}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Pays *
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', zIndex: 1 }} />
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 34px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer', minHeight: 'auto' }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Téléphone avec indicatif */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Numéro de téléphone *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Indicatif pays */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 12px', flexShrink: 0, fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>
                  <span>{selectedCountry.flag}</span>
                  <span style={{ color: '#6b7280' }}>{selectedCountry.dial}</span>
                </div>
                {/* Numéro */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="tel"
                    placeholder="77 000 00 00"
                    value={phoneNum}
                    onChange={e => setPhoneNum(e.target.value)}
                    required
                    style={{ width: '100%', padding: '11px 12px 11px 32px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp checkbox */}
            <div
              onClick={() => setIsWhatsapp(w => !w)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isWhatsapp ? '#f0fdf4' : '#f9fafb', borderRadius: 10, border: `1.5px solid ${isWhatsapp ? '#86efac' : '#e5e7eb'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 6, background: isWhatsapp ? '#16a34a' : 'white', border: `2px solid ${isWhatsapp ? '#16a34a' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                {isWhatsapp && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>
                  <MessageCircle size={14} color={isWhatsapp ? '#16a34a' : '#9ca3af'} />
                  Ce numéro est sur WhatsApp
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>
                  Le vendeur pourra vous contacter par WhatsApp
                </div>
              </div>
            </div>

            {/* Erreur */}
            {errMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#dc2626', fontWeight: 500 }}>
                ⚠️ {errMsg}
              </div>
            )}
          </div>
        </div>

        {/* ── NOTE RASSURANTE ── */}
        <div style={{ margin: '10px 0', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', lineHeight: 1.6 }}>
            <strong>Gratuit & sans risque</strong> — Le vendeur vous appelle pour confirmer avant tout paiement. Vous restez libre d'accepter ou de refuser la livraison.
          </p>
        </div>

        {/* ── BOUTON COMMANDER ── */}
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%', background: status === 'loading' ? '#9ca3af' : `linear-gradient(135deg, ${ORANGE}, #ea580c)`,
            color: 'white', border: 'none', borderRadius: 14, padding: '16px 0',
            fontSize: '1rem', fontWeight: 900, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            minHeight: 'auto', boxShadow: '0 4px 20px rgba(234,88,12,0.35)',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {status === 'loading' ? '⏳ Envoi en cours…' : <><ShoppingBag size={20} /> Confirmer ma commande — {fmt(totalPrice)}</>}
        </button>
      </form>
    </div>
  )
}
