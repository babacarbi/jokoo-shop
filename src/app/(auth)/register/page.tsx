'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { askPushPermission, subscribePush } from '@/lib/pushClient'
import { ShoppingBag, Store, Loader2, CheckCircle, ArrowLeft, RefreshCw, ArrowRight, Sparkles } from 'lucide-react'

/* ── Catégories boutique ─────────────────────────────────────────── */
const SHOP_CATEGORIES = [
  { slug: 'mode-vetements',   label: 'Mode & Vêtements',   emoji: '👗', color: '#ec4899' },
  { slug: 'electronique',     label: 'Électronique',       emoji: '📱', color: '#3b82f6' },
  { slug: 'alimentation',     label: 'Alimentation',       emoji: '🛒', color: '#22c55e' },
  { slug: 'beaute-sante',     label: 'Beauté & Santé',    emoji: '💄', color: '#a855f7' },
  { slug: 'maison-deco',      label: 'Maison & Déco',     emoji: '🏠', color: '#f59e0b' },
  { slug: 'informatique',     label: 'Informatique',       emoji: '💻', color: '#06b6d4' },
  { slug: 'sport-loisirs',    label: 'Sport & Loisirs',    emoji: '⚽', color: '#10b981' },
  { slug: 'services',         label: 'Services',           emoji: '🔧', color: '#f97316' },
  { slug: 'livres-education', label: 'Livres & Éducation', emoji: '📚', color: '#8b5cf6' },
  { slug: 'bebe-enfant',      label: 'Bébé & Enfant',     emoji: '👶', color: '#f43f5e' },
  { slug: 'electromenager',   label: 'Électroménager',      emoji: '🧊', color: '#0ea5e9' },
  { slug: 'phytosanitaire',   label: 'Phytosanitaire & Agriculture', emoji: '🌱', color: '#16a34a' },
  { slug: 'nettoyage',        label: 'Produits de nettoyage', emoji: '🧽', color: '#eab308' },
]

/* Photos défilantes par catégorie (sinon : une seule photo /images/categories/<slug>.webp) */
const CATEGORY_SLIDES: Record<string, string[]> = {
  'beaute-sante': [
    '/images/categories/beaute-sante-2.webp',
    '/images/categories/beaute-sante-3.webp',
    '/images/categories/beaute-sante-4.webp',
    '/images/categories/beaute-sante-1.webp',
  ],
}

function CategoryPhoto({ slug, label }: { slug: string; label: string }) {
  const slides = CATEGORY_SLIDES[slug] ?? [`/images/categories/${slug}.webp`]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 1800)
    return () => clearInterval(t)
  }, [slides.length])
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#ffffff' }}>
      {slides.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={label} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity .6s ease' }} />
      ))}
    </div>
  )
}
const SHOP_SUGGESTIONS: Record<string, string[]> = {
  'mode-vetements':   ['Mode Dakar', 'Wax & Style', 'Élégance Africa'],
  'electronique':     ['Tech Abidjan', 'Gadgets Africa', 'Electro Store'],
  'alimentation':     ['Fresh Market', 'Bio Africa', 'Saveurs du Sahel'],
  'beaute-sante':     ['Beauty Bar', 'Glam Africa', 'Soin & Beauté'],
  'maison-deco':      ['Casa Africa', 'Déco Bamako', 'Maison & Style'],
  'informatique':     ['Digital Store', 'Info Tech', 'PC Africa'],
  'sport-loisirs':    ['Sport Zone', 'Fitness Africa', 'Play Store'],
  'services':         ['Pro Services', 'Africa Services', 'Expert Zone'],
  'livres-education': ['Librairie Africa', 'Savoir+', 'Édu Store'],
  'bebe-enfant':      ['BébéShop', 'Kids Africa', 'Petits Bonheurs'],
  'electromenager':   ['Electro Dakar', 'Maison Confort', 'Froid & Clim'],
  'phytosanitaire':   ['Agro Sahel', 'Phyto Africa', 'Champ Vert'],
  'nettoyage':        ['Clean Express', 'Brillance Pro', 'Maison Nette'],
}

/* ── Photos hero mobile : carousel produits 100% locaux ─────────── */
const HERO_PHOTOS = [
  '/images/register/african_woman.jpg',   // Femme africaine + cosmétiques marché
  '/images/register/cosmetics.jpg',       // CeraVe, Mixa, crèmes soins
  '/images/register/appliances.jpg',      // Frigo, TV, machine à laver, clim
  '/images/register/african_man.jpg',     // Homme africain + smartphone
  '/images/register/supplements.jpg',     // Whey, Mass Gainer, BCAA
  '/images/register/cosmetics.jpg',       // Cosmétiques beauté (repeat)
]

/* ── Indicatifs pays ─────────────────────────────────────────────── */
const COUNTRIES = [
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',            dial: '+221' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",      dial: '+225' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',                dial: '+223' },
  { code: 'GN', flag: '🇬🇳', name: 'Guinée',              dial: '+224' },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso',        dial: '+226' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo',                dial: '+228' },
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin',               dial: '+229' },
  { code: 'NE', flag: '🇳🇪', name: 'Niger',               dial: '+227' },
  { code: 'MR', flag: '🇲🇷', name: 'Mauritanie',          dial: '+222' },
  { code: 'GW', flag: '🇬🇼', name: 'Guinée-Bissau',       dial: '+245' },
  { code: 'CV', flag: '🇨🇻', name: 'Cap-Vert',            dial: '+238' },
  { code: 'GM', flag: '🇬🇲', name: 'Gambie',              dial: '+220' },
  { code: 'SL', flag: '🇸🇱', name: 'Sierra Leone',        dial: '+232' },
  { code: 'LR', flag: '🇱🇷', name: 'Liberia',             dial: '+231' },
  { code: 'GH', flag: '🇬🇭', name: 'Ghana',               dial: '+233' },
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria',             dial: '+234' },
  { code: 'CM', flag: '🇨🇲', name: 'Cameroun',            dial: '+237' },
  { code: 'CD', flag: '🇨🇩', name: 'Congo (RDC)',          dial: '+243' },
  { code: 'CG', flag: '🇨🇬', name: 'Congo-Brazzaville',   dial: '+242' },
  { code: 'GA', flag: '🇬🇦', name: 'Gabon',               dial: '+241' },
  { code: 'KE', flag: '🇰🇪', name: 'Kenya',               dial: '+254' },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzanie',            dial: '+255' },
  { code: 'ET', flag: '🇪🇹', name: 'Éthiopie',            dial: '+251' },
  { code: 'MG', flag: '🇲🇬', name: 'Madagascar',          dial: '+261' },
  { code: 'MA', flag: '🇲🇦', name: 'Maroc',               dial: '+212' },
  { code: 'DZ', flag: '🇩🇿', name: 'Algérie',             dial: '+213' },
  { code: 'TN', flag: '🇹🇳', name: 'Tunisie',             dial: '+216' },
  { code: 'EG', flag: '🇪🇬', name: 'Égypte',              dial: '+20'  },
  { code: 'FR', flag: '🇫🇷', name: 'France',              dial: '+33'  },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique',            dial: '+32'  },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse',              dial: '+41'  },
  { code: 'ES', flag: '🇪🇸', name: 'Espagne',             dial: '+34'  },
  { code: 'IT', flag: '🇮🇹', name: 'Italie',              dial: '+39'  },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal',            dial: '+351' },
  { code: 'DE', flag: '🇩🇪', name: 'Allemagne',           dial: '+49'  },
  { code: 'GB', flag: '🇬🇧', name: 'Royaume-Uni',         dial: '+44'  },
  { code: 'US', flag: '🇺🇸', name: 'États-Unis',          dial: '+1'   },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',              dial: '+1'   },
  { code: 'AE', flag: '🇦🇪', name: 'Émirats Arabes',      dial: '+971' },
  { code: 'SA', flag: '🇸🇦', name: 'Arabie Saoudite',     dial: '+966' },
]

/* ── Colonnes desktop animées : 18 images uniques (6 × 3) ─────────── */
const COL_A = [
  '/images/register/african_woman.jpg',   // Femme africaine + cosmétiques marché
  '/images/register/food.jpg',            // Produits alimentaires marché africain
  '/images/register/cosmetics.jpg',       // CeraVe, Mixa, crèmes soins
  '/images/register/african_man.jpg',     // Homme africain + smartphone
  '/images/register/appliances.jpg',      // Électroménager
  '/images/register/supplements.jpg',     // Whey, Mass Gainer
]
const COL_B = [
  '/images/register/supplements.jpg',     // Protéines
  '/images/register/african_woman.jpg',   // Femme africaine
  '/images/register/appliances.jpg',      // Électroménager
  '/images/register/food.jpg',            // Alimentaire
  '/images/register/cosmetics.jpg',       // Cosmétiques
  '/images/register/african_man.jpg',     // Homme africain
]
const COL_C = [
  '/images/register/cosmetics.jpg',       // Cosmétiques
  '/images/register/appliances.jpg',      // Électroménager
  '/images/register/african_man.jpg',     // Homme africain
  '/images/register/supplements.jpg',     // Protéines
  '/images/register/food.jpg',            // Alimentaire
  '/images/register/african_woman.jpg',   // Femme africaine
]

function PhotoColumn({ photos, duration, reverse = false }: { photos: string[]; duration: number; reverse?: boolean }) {
  const doubled = [...photos, ...photos]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', flex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: `${reverse ? 'scrollDown' : 'scrollUp'} ${duration}s linear infinite` }}>
        {doubled.map((src, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Page principale ─────────────────────────────────────────────── */
function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const defaultRole = searchParams.get('role') === 'merchant' ? 'merchant' : 'customer'
  const [role, setRole]           = useState<'merchant' | 'customer'>(defaultRole)
  const [dialCode, setDialCode]   = useState(searchParams.get('dial') ?? '+221')
  const [localNum, setLocalNum]   = useState((searchParams.get('phone') ?? '').replace(/[^\d\s]/g, ''))
  const [step, setStep]           = useState<'phone' | 'otp' | 'pin' | 'shop' | 'success'>('phone')
  const [otpInput, setOtpInput]   = useState('')
  const [pinInput, setPinInput]   = useState('')
  const [otpCode, setOtpCode]     = useState<string | null>(null)
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null)
  const [loading, setLoading]     = useState(false)
  const [otpChecking, setOtpChecking] = useState(false)
  const [error, setError]         = useState('')
  const [heroIdx, setHeroIdx]     = useState(0)
  const [heroFading, setHeroFading] = useState(false)
  // Cooldown anti-spam entre envois OTP
  const [cooldown, setCooldown]   = useState(0)
  const cooldownRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  // Étape boutique (marchands uniquement)
  const [shopName, setShopName]         = useState('')
  const [shopCategory, setShopCategory] = useState('')
  const [shopCreating, setShopCreating] = useState(false)
  const [shopSlug, setShopSlug]         = useState('')   // slug généré après création

  // Validation automatique du code à 6 chiffres (sans consommer le code)
  async function checkOtpAuto(code: string) {
    setOtpChecking(true); setError('')
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone.replace(/\s+/g, ''), code, peek: true }),
      })
      if (res.ok) {
        setPinInput('')
        setStep('pin')
      } else {
        setError('Code non valide')
        setOtpInput('')
      }
    } catch {
      setError('Connexion impossible — réessayez.')
    }
    setOtpChecking(false)
  }

  // Reprend le numéro déjà saisi (connexion) pour éviter de le retaper
  useEffect(() => {
    if (localNum) return
    try {
      const saved = sessionStorage.getItem('jokoo_phone')
      if (saved) {
        const { localNum: n, dialCode: d } = JSON.parse(saved)
        if (n) setLocalNum(n)
        if (d && !searchParams.get('dial')) setDialCode(d)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (localNum.trim()) {
      try { sessionStorage.setItem('jokoo_phone', JSON.stringify({ localNum, dialCode })) } catch {}
    }
  }, [localNum, dialCode])

  // Auto-défilement photos toutes les 4 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroFading(true)
      setTimeout(() => {
        setHeroIdx(i => (i + 1) % HERO_PHOTOS.length)
        setHeroFading(false)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const fullPhone = `${dialCode}${localNum.replace(/\s+/g, '')}`
  const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]

  // Démarre le cooldown anti-spam (30 secondes entre chaque envoi)
  function startCooldown() {
    setCooldown(30)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function sendOtp() {
    const cleaned = fullPhone.replace(/\s+/g, '')
    if (localNum.trim().length < 6) { setError('Numéro trop court'); return }
    if (cooldown > 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/otp/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, dialCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur envoi WhatsApp'); return }
    setOtpCode(data.code ?? null)
    setOtpExpiry(new Date(Date.now() + 5 * 60 * 1000))
    setStep('otp')
    setOtpInput('')
    startCooldown()
    setHeroIdx(i => (i + 1) % HERO_PHOTOS.length)
  }

  // Retour à la saisie du numéro (permet de changer de numéro ou ressaisir)
  function backToPhone() {
    setStep('phone')
    setOtpInput('')
    setError('')
  }

  async function verifyAndCreate() {
    const cleaned = fullPhone.replace(/\s+/g, '')
    setLoading(true); setError('')

    // ── Vérification OTP + création de compte côté serveur (Admin API) ──
    const res = await fetch('/api/auth/register-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code: otpInput.trim(), role, pinCode: pinInput }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setPinInput('')
      // Code WhatsApp invalide/expiré → retour à l'étape du code
      if (String(data.error ?? '').startsWith('Code invalide')) {
        setOtpInput('')
        setStep('otp')
      }
      setError(data.error ?? 'Code incorrect — réessayez.')
      return
    }

    // ── Établissement de la session côté client ──────────────────────────
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    setLoading(false)

    if (sessionError) {
      setError('Erreur de session — réessayez.')
      return
    }

    // ── Redirection automatique ───────────────────────────────────────────
    if (role === 'merchant') {
      // Marchand → étape 3 : nommer la boutique (même écran, pas de navigation)
      setStep('shop')
    } else {
      router.push('/boutiques')
    }
  }

  // ── Création boutique + affichage lien de partage ─────────────────────
  async function createShopAndGo() {
    if (!shopName.trim()) { setError('Donnez un nom à votre boutique'); return }
    // Notifications push activées par défaut à l'inscription (demande lancée dans le clic)
    const permissionAsk = askPushPermission()
    setShopCreating(true); setError('')
    const cleaned = fullPhone.replace(/\s+/g, '')
    const res = await fetch('/api/merchant/shop', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: shopName.trim(), phone: cleaned, city: '', country: 'Afrique', category: shopCategory }),
    })
    const d = await res.json()
    setShopCreating(false)
    if (!res.ok) { setError(d.error ?? 'Erreur création boutique'); return }
    await permissionAsk
    await subscribePush()
    // Stocker le slug et afficher l'écran de succès avec le lien
    setShopSlug(d.slug ?? shopName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))
    setStep('success')
  }

  // ── Copier le lien dans le presse-papier ─────────────────────────────
  const [copied, setCopied] = useState(false)
  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }



  const isMerchant = role === 'merchant'
  const accent = isMerchant ? '#f97316' : '#2D6BE4'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes scrollUp   { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
        @keyframes scrollDown { 0%{transform:translateY(-50%)} 100%{transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroFade   { 0%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes pulseOtp   { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.4)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} }

        html, body { margin: 0; padding: 0; height: 100%; background: #111827; }

        .reg-wrap {
          display: flex;
          min-height: 100dvh;
          font-family: 'Inter', system-ui, sans-serif;
          background: #111827;
        }

        /* ── DESKTOP : deux colonnes ── */
        .reg-left  { display: none; }
        .reg-right { width: 100%; display: flex; flex-direction: column; }

        @media (min-width: 900px) {
          .reg-left  {
            display: flex; flex: 1; position: relative; overflow: hidden;
            flex-direction: column; gap: 8; padding: 8;
          }
          .reg-right {
            width: 420px; flex-shrink: 0;
            background: #1e293b;
            box-shadow: -1px 0 0 #64748b;
            overflow-y: auto;
            padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
          }
          .reg-hero-mobile { display: none !important; }
        }

        /* ── MOBILE : full-screen app ── */
        @media (max-width: 899px) {
          .reg-right {
            background: #111827;
            min-height: 100dvh;
          }
        }

        /* Input style */
        .reg-input {
          width: 100%; height: 56px; padding: 0 16px;
          background: #64748b;
          border: 1.5px solid #64748b;
          border-radius: 14px;
          font-size: 1rem; color: white;
          font-family: 'Inter', sans-serif;
          outline: none; transition: border-color .2s;
          -webkit-appearance: none;
        }
        .reg-input:focus { border-color: rgba(249,115,22,.6); }
        .reg-input::placeholder { color: #64748b; }

        .reg-select {
          height: 56px; padding: 0 32px 0 14px;
          background: #64748b;
          border: 1.5px solid #64748b;
          border-radius: 14px;
          font-size: .9rem; color: white;
          font-family: 'Inter', sans-serif;
          outline: none; cursor: pointer;
          -webkit-appearance: none; appearance: none;
          flex-shrink: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#64748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: border-color .2s;
        }
        .reg-select:focus { border-color: rgba(249,115,22,.6); }
        .reg-select option { background: #1f1f2e; color: white; }

        .reg-btn {
          width: 100%; height: 56px;
          border: none; border-radius: 16px;
          font-size: 1rem; font-weight: 800; color: white;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all .2s; touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          letter-spacing: .01em;
        }
        .reg-btn:active:not(:disabled) { transform: scale(.97); }
        .reg-btn:disabled { opacity: .45; cursor: not-allowed; }

        .reg-tab-btn {
          flex: 1; padding: 12px; border: none; border-radius: 10px;
          font-size: .9rem; font-weight: 700;
          cursor: pointer; transition: all .2s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .otp-digit-input {
          width: 100%; height: 64px;
          background: #64748b;
          border: 1.5px solid #64748b;
          border-radius: 16px;
          font-size: 2rem; font-weight: 900;
          color: white; text-align: center;
          font-family: 'SF Mono', 'Courier New', monospace;
          letter-spacing: .3em;
          outline: none; -webkit-appearance: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .otp-digit-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,.2);
        }
      `}</style>

      <div className="reg-wrap">

        {/* ── GAUCHE desktop : colonnes photos animées ── */}
        <div className="reg-left">
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', gap: 8, padding: 8,
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}>
            <PhotoColumn photos={COL_A} duration={22} />
            <PhotoColumn photos={COL_B} duration={28} reverse />
            <PhotoColumn photos={COL_C} duration={25} />
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg,rgba(15,15,24,.8) 0%,rgba(15,15,24,.5) 50%,rgba(15,15,24,.85) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 100, padding: '6px 14px', width: 'fit-content' }}>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '.08em' }}>N°1 Afrique de l&apos;Ouest</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 900, color: 'white', lineHeight: 1.15, fontFamily: 'Outfit, sans-serif', marginBottom: 16 }}>
              Vendez à toute<br />
              <span style={{ background: 'linear-gradient(90deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>l&apos;Afrique</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 340 }}>
              Boutique en ligne · Lien unique · Commandes WhatsApp
            </p>
          </div>
        </div>

        {/* ── DROITE : formulaire app ── */}
        <div className="reg-right">

          {/* Hero photo mobile */}
          <div className="reg-hero-mobile" style={{
            position: 'relative', width: '100%', height: '38vh', overflow: 'hidden', flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_PHOTOS[heroIdx]}
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'opacity .4s ease',
                opacity: heroFading ? 0 : 1,
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(17,24,39,.3) 0%, rgba(17,24,39,.0) 40%, rgba(17,24,39,.85) 85%, #111827 100%)',
            }} />
            {/* Spotlight Effect for Mobile Logo */}
            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '180px', background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.95) 0%, rgba(249,115,22,0.6) 50%, rgba(17,24,39,0) 80%)', filter: 'blur(32px)', pointerEvents: 'none', zIndex: 0 }} />
            {/* Logo flottant sur la photo */}
            <div style={{ position: 'absolute', top: 'max(20px, env(safe-area-inset-top, 20px))', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '240px', height: '100px', background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)', filter: 'blur(16px)', pointerEvents: 'none', zIndex: 0 }} />
                <img 
                  src="/logos/logo-jokoo-cart.png" 
                  alt="Jokoo" 
                  style={{ height: '56px', width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))' }} 
                />
              </div>
            </div>
            {/* Dots indicateurs */}
            <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {HERO_PHOTOS.map((_, i) => (
                <div key={i} onClick={() => setHeroIdx(i)}
                  style={{
                    width: i === heroIdx ? 20 : 6, height: 6,
                    borderRadius: 3, cursor: 'pointer',
                    background: i === heroIdx ? '#f97316' : '#64748b',
                    transition: 'all .3s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div style={{ padding: '28px 24px', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))', animation: 'fadeIn .4s ease', maxWidth: 420, margin: '0 auto', width: '100%' }}>

            {/* Logo desktop */}
            <div style={{ display: 'none', textAlign: 'center', marginBottom: 32, paddingTop: 32, position: 'relative' }} className="reg-logo-desktop">
              {/* Spotlight Effect for Desktop Logo */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '380px', height: '180px', background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(249,115,22,0.6) 40%, rgba(45,107,228,0.25) 75%, transparent 100%)', filter: 'blur(32px)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '90px', background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)', filter: 'blur(16px)', pointerEvents: 'none', zIndex: 0 }} />
              
              <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <img 
                  src="/logos/logo-jokoo-cart.png" 
                  alt="Jokoo" 
                  style={{ height: '84px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))', transform: 'scale(1.05)', transition: 'transform 0.3s ease' }} 
                />
              </div>
            </div>

            {/* Retour */}
            {(step === 'phone' || step === 'pin') && (
              step === 'phone' ? (
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.55)', fontSize: '.82rem', fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}>
                  <ArrowLeft size={15} /> Retour
                </Link>
              ) : (
                <button onClick={() => { setStep('otp'); setError('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,.55)', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
                  <ArrowLeft size={15} /> Retour
                </button>
              )
            )}

            {/* Titre selon étape */}
            <div style={{ marginBottom: step === 'shop' ? 20 : 28 }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'white', fontFamily: 'Outfit, sans-serif', marginBottom: 6, lineHeight: 1.2 }}>
                {step === 'phone' ? (isMerchant ? 'Ouvrir ma boutique 🏷️' : 'Créer mon compte 🛍️')
                  : step === 'otp' ? 'Vérification 📲'
                  : step === 'pin' ? 'Créez votre code secret 🔐'
                  : 'Votre boutique 🏦'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.88rem', lineHeight: 1.5 }}>
                {step === 'phone' ? (isMerchant ? '2 minutes · Lien boutique unique · Commandes WhatsApp' : 'Inscription par numéro WhatsApp')
                  : step === 'otp' ? `Code envoyé au ${fullPhone}`
                  : step === 'pin' ? 'Dernière étape avant de créer votre compte'
                  : 'Dernière étape — donnez un nom à votre boutique'}
              </p>
            </div>

            {/* Toggle Je vends / J'achète */}
            {step === 'phone' && defaultRole !== 'merchant' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28, background: '#64748b', borderRadius: 14, padding: 4 }}>
                {[
                  { value: 'merchant', emoji: '🏪', label: 'Je vends' },
                  { value: 'customer', emoji: '🛒', label: "J'achète" },
                ].map(r => (
                  <button key={r.value} className="reg-tab-btn"
                    onClick={() => setRole(r.value as 'merchant' | 'customer')}
                    style={{
                      background: role === r.value ? accent : 'transparent',
                      color: role === r.value ? 'white' : '#64748b',
                      boxShadow: role === r.value ? `0 4px 12px ${accent}40` : 'none',
                    }}>
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '12px 14px', fontSize: '.85rem', color: '#fca5a5', marginBottom: 20 }}>
                {error}
              </div>
            )}

            {/* ── ÉTAPE 1 : numéro ── */}
            {step === 'phone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Numéro WhatsApp
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Sélecteur compact : affiche uniquement flag + indicatif */}
                    <div style={{ position: 'relative', flexShrink: 0, width: 88 }}>
                      <select
                        value={dialCode}
                        onChange={e => { setDialCode(e.target.value); setError('') }}
                        suppressHydrationWarning
                        style={{
                          width: '100%', height: 56,
                          background: 'rgba(255,255,255,.08)',
                          border: '1.5px solid rgba(255,255,255,.12)',
                          borderRadius: 14,
                          color: 'white', fontSize: '.82rem',
                          fontFamily: 'Inter, sans-serif',
                          outline: 'none', cursor: 'pointer',
                          WebkitAppearance: 'none', appearance: 'none',
                          paddingLeft: 8, paddingRight: 20,
                          opacity: 0, position: 'absolute', inset: 0, zIndex: 2,
                        }}>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.dial}>{c.flag} {c.dial} {c.name}</option>
                        ))}
                      </select>
                      {/* Affichage visuel compact */}
                      <div style={{
                        height: 56, borderRadius: 14, padding: '0 8px',
                        background: 'rgba(255,255,255,.08)',
                        border: '1.5px solid rgba(255,255,255,.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                        fontSize: '.82rem', color: 'white', fontWeight: 600,
                        pointerEvents: 'none',
                      }}>
                        <span style={{ fontSize: '1.15rem' }}>{selectedCountry.flag}</span>
                        <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>{dialCode}</span>
                        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.65rem' }}>▾</span>
                      </div>
                    </div>
                    <input className="reg-input" type="tel"
                      placeholder="77 123 45 67"
                      value={localNum}
                      onChange={e => { setLocalNum(e.target.value); setError('') }}
                      autoComplete="tel-national"
                      suppressHydrationWarning
                      style={{ flex: 1 }}
                    />
                  </div>
                  {localNum && (
                    <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginTop: 6 }}>
                      {selectedCountry.flag} {fullPhone}
                    </p>
                  )}
                </div>

                <button className="reg-btn"
                  disabled={loading || localNum.trim().length < 6}
                  onClick={sendOtp}
                  style={{ background: `linear-gradient(135deg, ${accent}, ${isMerchant ? '#ea6b0b' : '#1d55c4'})`, boxShadow: `0 8px 24px ${accent}40`, marginTop: 4 }}>
                  {loading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...</>
                    : <><Store size={18} /> Recevoir mon code WhatsApp</>
                  }
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.25)' }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
                </div>

                <Link href={isMerchant ? '/login?role=merchant' : '/login?role=buyer'} style={{ textDecoration: 'none' }}>
                  <button className="reg-btn"
                    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid #64748b', color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
                    Déjà un compte ? Se connecter
                  </button>
                </Link>

                <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,.55)', fontSize: '.82rem', fontWeight: 600, textDecoration: 'none', padding: '4px 0' }}>
                  Voir les produits sans connexion
                </Link>

                <p style={{ textAlign: 'center', fontSize: '.72rem', color: 'rgba(255,255,255,.25)', lineHeight: 1.6 }}>
                  En continuant, vous acceptez nos{' '}
                  <Link href="/cgu" style={{ color: 'rgba(249,115,22,.7)', fontWeight: 600 }}>CGU</Link>.
                </p>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 8 }}>
                  {[['2 min', 'pour ouvrir'], ['Simple', 'à utiliser'], ['100%', 'africain']].map(([num, label]) => (
                    <div key={label} style={{ background: '#64748b', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '.95rem', fontWeight: 900, color: 'white' }}>{num}</div>
                      <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 : OTP ── */}
            {step === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {otpCode ? (
                  /* Mode DEV */
                  <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#4ade80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Code DEV</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', letterSpacing: '.3em', fontFamily: 'monospace' }}>{otpCode}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', marginTop: 6 }}>
                      Expire à {otpExpiry?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  /* Mode PROD */
                  <div style={{ background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: '.95rem', fontWeight: 800, color: 'white', marginBottom: 4 }}>Code WhatsApp envoyé !</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>
                      Vérifiez votre WhatsApp<br />
                      <strong style={{ color: 'rgba(255,255,255,.7)' }}>{fullPhone}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {otpCode ? 'Code affiché ci-dessus' : 'Code reçu sur WhatsApp'}
                  </label>
                  <input className="otp-digit-input"
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    placeholder="● ● ● ● ● ●"
                    value={otpInput} maxLength={6}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtpInput(v); setError('')
                      if (v.length === 6) checkOtpAuto(v)
                    }}
                    disabled={otpChecking}
                    autoComplete="one-time-code"
                    suppressHydrationWarning
                  />
                </div>

                {otpChecking && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,.6)', fontSize: '.85rem' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Vérification du code...
                  </div>
                )}

                {/* Changer de numéro / Renvoyer le code */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={sendOtp}
                    disabled={loading || cooldown > 0}
                    style={{
                      background: 'none', border: 'none',
                      color: cooldown > 0 ? '#64748b' : '#64748b',
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '.82rem', fontFamily: 'Inter, sans-serif', padding: '8px',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <RefreshCw size={13} />
                    {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
                  </button>
                  <button
                    onClick={backToPhone}
                    disabled={loading}
                    style={{
                      background: '#64748b',
                      border: '1px solid #64748b',
                      borderRadius: 10, padding: '10px 20px',
                      color: 'rgba(255,255,255,.4)',
                      cursor: 'pointer', fontSize: '.82rem',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <ArrowLeft size={13} /> Changer de numéro
                  </button>
                </div>
              </div>
            )}

            {/* ══ ÉTAPE : CODE SECRET (PIN) ══ */}
            {step === 'pin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn .35s ease' }}>
                <div style={{ background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ fontSize: '.95rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
                    🔑 À quoi sert ce code ?
                  </div>
                  <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
                    Choisissez <strong style={{ color: 'white' }}>4 chiffres</strong> de votre choix.
                    Ce sera <strong style={{ color: 'white' }}>votre code personnel</strong> pour vous connecter
                    la prochaine fois, avec votre numéro WhatsApp. Facile à retenir, et ne le partagez avec personne.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Votre code secret (4 chiffres)
                  </label>
                  <input className="otp-digit-input"
                    type="password" inputMode="numeric" pattern="[0-9]*"
                    placeholder="● ● ● ●"
                    value={pinInput} maxLength={4} autoFocus
                    onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                    autoComplete="new-password"
                    suppressHydrationWarning
                  />
                </div>

                <button className="reg-btn"
                  disabled={loading || pinInput.length < 4}
                  onClick={verifyAndCreate}
                  style={{ background: `linear-gradient(135deg, ${accent}, ${isMerchant ? '#ea6b0b' : '#1d55c4'})`, boxShadow: `0 8px 24px ${accent}40` }}>
                  {loading
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Création...</>
                    : <><CheckCircle size={18} /> {isMerchant ? 'Créer ma boutique' : 'Créer mon compte'}</>
                  }
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 3 : NOM DE LA BOUTIQUE (marchands) ══ */}
            {step === 'shop' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn .35s ease' }}>

                {/* Indicateur de progression */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  {['Numéro', 'Vérification', 'Boutique'].map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: i < 2 ? 8 : 24, height: 8, borderRadius: 4, background: i < 2 ? '#22c55e' : '#f97316', transition: 'all .3s' }} />
                      {i < 2 && <div style={{ flex: 1, height: 1, width: 16, background: 'rgba(255,255,255,.1)' }} />}
                    </div>
                  ))}
                  <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)', marginLeft: 4 }}>Étape 3/3</span>
                </div>

                {/* Grand input nom boutique */}
                <div>
                  <input
                    type="text"
                    placeholder="Ex: Mode Dakar, Tech Abidjan..."
                    value={shopName}
                    onChange={e => { setShopName(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter' && shopName.trim()) createShopAndGo() }}
                    maxLength={50}
                    autoFocus
                    suppressHydrationWarning
                    style={{
                      width: '100%', background: 'transparent',
                      border: 'none', borderBottom: `2px solid ${shopName ? '#f97316' : '#64748b'}`,
                      color: 'white', fontSize: 'clamp(1.4rem,6vw,1.8rem)',
                      fontWeight: 800, fontFamily: 'Outfit, sans-serif',
                      padding: '10px 0', outline: 'none', caretColor: '#f97316',
                      transition: 'border-color .2s',
                    }}
                  />
                  {shopName.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.2)' }}>
                      <Sparkles size={12} color="#f97316" />
                      <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>Votre lien :</span>
                      <span style={{ fontSize: '.72rem', color: '#f97316', fontWeight: 700, fontFamily: 'monospace' }}>
                        mkplace.io/{shopName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,25)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Suggestions intelligentes (si catégorie choisie et nom vide) */}
                {shopCategory && !shopName && (
                  <div>
                    <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.25)', marginBottom: 8 }}>💡 Suggestions</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(SHOP_SUGGESTIONS[shopCategory] ?? []).map(s => (
                        <button key={s} onClick={() => setShopName(s)}
                          style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid #64748b', background: '#64748b', color: 'rgba(255,255,255,.4)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catégories */}
                <div>
                  <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Catégorie <span style={{ fontWeight: 400, textTransform: 'none' }}>(optionnel)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                    {SHOP_CATEGORIES.map(cat => {
                      const active = shopCategory === cat.slug
                      return (
                        <button key={cat.slug} type="button"
                          onClick={() => setShopCategory(active ? '' : cat.slug)}
                          style={{
                            position: 'relative', display: 'flex', flexDirection: 'column',
                            padding: 0, overflow: 'hidden', borderRadius: 16,
                            background: '#ffffff',
                            border: `3px solid ${active ? cat.color : 'transparent'}`,
                            boxShadow: active ? `0 0 0 2px ${cat.color}55, 0 8px 22px ${cat.color}55` : '0 2px 10px rgba(0,0,0,.25)',
                            cursor: 'pointer', transition: 'all .18s', touchAction: 'manipulation',
                            transform: active ? 'scale(1.02)' : 'scale(1)',
                          }}>
                          <CategoryPhoto slug={cat.slug} label={cat.label} />
                          <span style={{
                            padding: '9px 6px', fontSize: '.82rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.2,
                            color: active ? '#ffffff' : '#0f172a',
                            background: active ? cat.color : '#ffffff',
                            transition: 'all .18s',
                          }}>{cat.label}</span>
                          {active && (
                            <span style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: cat.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.9rem', boxShadow: '0 2px 8px rgba(0,0,0,.35)' }}>✓</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Erreur */}
                {error && (
                  <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '10px 14px', fontSize: '.82rem', color: '#fca5a5' }}>
                    {error}
                  </div>
                )}

                {/* CTA principal */}
                <button className="reg-btn"
                  disabled={shopCreating || !shopName.trim()}
                  onClick={createShopAndGo}
                  style={{
                    background: shopName.trim() ? 'linear-gradient(135deg,#f97316,#ea6b0b)' : '#64748b',
                    boxShadow: shopName.trim() ? '0 8px 28px rgba(249,115,22,.4)' : 'none',
                    animation: shopName.trim() ? 'pulseOtp .8s ease' : 'none',
                  }}>
                  {shopCreating
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Création en cours...</>
                    : <><Store size={18} /> Lancer ma boutique ! <ArrowRight size={16} /></>}
                </button>

                {/* Passer cette étape */}
                <button
                  onClick={() => router.push('/merchant/dashboard')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.25)', fontSize: '.78rem', fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                  Configurer plus tard →
                </button>

              </div>
            )}

            {/* ══ ÉTAPE SUCCESS : BOUTIQUE CRÉÉE + LIEN DE PARTAGE ══ */}
            {step === 'success' && (() => {
              const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''
              const shopUrl = `${APP_URL}/boutique/${shopSlug}`
              const waText = encodeURIComponent(`🛍️ Découvrez ma boutique "${shopName}" sur Jokoo !\n👉 ${shopUrl}`)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn .4s ease' }}>

                  {/* Succès header */}
                  <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: 'white', marginBottom: 4 }}>
                      {shopName} est en ligne !
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)' }}>
                      Votre boutique est prête. Partagez le lien avec vos clients.
                    </div>
                  </div>

                  {/* Lien boutique — tap to copy */}
                  <div>
                    <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      🔗 Votre lien boutique
                    </div>
                    <button
                      onClick={() => copyLink(shopUrl)}
                      style={{
                        width: '100%', background: 'rgba(249,115,22,.08)', border: '1.5px solid rgba(249,115,22,.3)',
                        borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        transition: 'all .2s', touchAction: 'manipulation',
                      }}>
                      <span style={{ fontSize: '.82rem', color: '#f97316', fontWeight: 700, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shopUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: '.72rem', fontWeight: 700, color: copied ? '#22c55e' : '#64748b', background: copied ? 'rgba(34,197,94,.12)' : '#64748b', padding: '4px 10px', borderRadius: 8, transition: 'all .2s' }}>
                        {copied ? '✓ Copié !' : 'Copier'}
                      </span>
                    </button>
                  </div>

                  {/* Partage WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${waText}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      width: '100%', height: 52, borderRadius: 14,
                      background: 'linear-gradient(135deg,#25d366,#128c7e)',
                      color: 'white', fontWeight: 700, fontSize: '.92rem',
                      textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,211,102,.3)',
                      touchAction: 'manipulation',
                    }}>
                    <span style={{ fontSize: '1.1rem' }}>💬</span>
                    Partager sur WhatsApp
                  </a>

                  {/* Actions secondaires */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Link
                      href={`/boutique/${shopSlug}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, background: '#64748b', border: '1px solid #64748b', color: 'rgba(255,255,255,.85)', fontSize: '.8rem', fontWeight: 600, textDecoration: 'none', touchAction: 'manipulation' }}>
                      👁 Voir ma boutique
                    </Link>
                    <button
                      onClick={() => router.push('/merchant/dashboard')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, background: 'rgba(249,115,22,.15)', border: '1.5px solid rgba(249,115,22,.35)', color: '#f97316', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', touchAction: 'manipulation' }}>
                      Dashboard →
                    </button>
                  </div>

                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Style desktop logo */}
      <style>{`@media (min-width: 900px) { .reg-logo-desktop { display: block !important; } .reg-hero-mobile { display: none !important; } }`}</style>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f18' }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Chargement...</div>
      </div>
    }>
      <RegisterInner />
    </Suspense>
  )
}
