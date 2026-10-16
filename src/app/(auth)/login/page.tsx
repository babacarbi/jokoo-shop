'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ArrowRight, Lock, Mail, MessageCircle, RefreshCw, Store, ShoppingBag } from 'lucide-react'

const COUNTRIES = [
  { flag: '🇸🇳', dial: '+221' }, { flag: '🇨🇮', dial: '+225' },
  { flag: '🇲🇱', dial: '+223' }, { flag: '🇬🇳', dial: '+224' },
  { flag: '🇧🇫', dial: '+226' }, { flag: '🇨🇲', dial: '+237' },
]

// role = 'buyer' | 'merchant' | null
type Role = 'buyer' | 'merchant' | null
type Mode = 'choose' | 'whatsapp' | 'pin-login' | 'otp-reset' | 'pin-reset' | 'email'

const PHONE_IMGS = [
  { src: '/photos/iphone18_real.jpg', label: 'iPhone 18' },
  { src: '/photos/samsung_s25.jpg',   label: 'Samsung'   },
  { src: '/photos/tecno_phantom.jpg', label: 'Tecno'     },
]

const CATEGORIES = [
  { name: 'Électroménager',   img: '/photos/electromenager.jpg',       whiteBg: true,  phones: false },
  { name: 'Téléphones',      img: '',                                 whiteBg: true,  phones: true  },
  { name: 'Cosmétique',      img: '/photos/laroche_posay.jpg',        whiteBg: true,  phones: false },
  { name: 'Alimentation',   img: '/photos/alimentation_drinks.jpg',  whiteBg: false, phones: false },
  { name: 'Électronique',    img: '/photos/apple_watch.jpg',          whiteBg: true,  phones: false },
  { name: 'Habillement',    img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=250&h=250', whiteBg: false, phones: false },
  { name: 'Informatique',   img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=250&h=250', whiteBg: false, phones: false },
  { name: 'C. Alimentaire', img: '/photos/ensure_plus.jpg',          whiteBg: true,  phones: false },
  { name: 'Scolaire',       img: '/photos/scolaire.jpg',             whiteBg: false, phones: false },
  { name: 'Désinfection',    img: '/photos/desinfection.jpg',        whiteBg: false, phones: false },
  { name: 'Maison & Déco',  img: '/photos/maison_deco.jpg',          whiteBg: false, phones: false },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole]         = useState<Role>(null)
  const [mode, setMode]         = useState<Mode>('choose')
  const [dialCode, setDialCode] = useState('+221')
  const [localNum, setLocalNum] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpCode, setOtpCode]   = useState<string | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef             = useRef<ReturnType<typeof setInterval> | null>(null)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  // Page de retour après connexion acheteur (ex: /commande). Uniquement chemins internes.
  const [nextUrl, setNextUrl]   = useState('/')

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const next = sp.get('next')
    if (next && next.startsWith('/') && !next.startsWith('//')) setNextUrl(next)
    const r = sp.get('role')
    if (r === 'buyer' || r === 'merchant') {
      setRole(r)
      setMode('whatsapp')
    }
  }, [])

  function startCooldown() {
    setCooldown(30)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(p => { if (p <= 1) { clearInterval(cooldownRef.current!); return 0 } return p - 1 })
    }, 1000)
  }

  const fullPhone = `${dialCode}${localNum.replace(/\s+/g, '')}`
  const normalizedPhone = localNum.replace(/\s+/g, '')

  // Sélection du rôle → bascule vers l'écran de connexion approprié
  function selectRole(r: Role) {
    setRole(r)
    setError('')
    setLocalNum('')
    setMode('whatsapp')
  }

  async function handleCheckPhone() {
    if (normalizedPhone.length < 6) { setError('Numéro trop court'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/check-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Erreur de vérification"); return }

    if (data.userExists) {
      setMode('pin-login')
      setPinInput('')
    } else {
      if (role === 'merchant') {
        setError("Aucun compte marchand trouvé. Veuillez d'abord créer votre boutique.")
      } else {
        // Acheteur sans compte → envoyer OTP pour créer compte
        await sendOtp()
      }
    }
  }

  async function handlePinLogin() {
    if (pinInput.length !== 4) return
    setLoading(true); setError('')
    const cleanedPhone = fullPhone.replace(/\s+/g, '')
    const syntheticEmail = `wa${cleanedPhone.replace(/^\+/, '')}@mkplace.io`
    const pwd = `${pinInput}-MkPlace24!`

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: pwd,
    })

    setLoading(false)
    if (signInError) {
      setPinInput('')
      setError('Code Secret incorrect.')
    } else {
      if (role === 'merchant') {
        router.push('/merchant/dashboard')
      } else {
        router.push(nextUrl)
      }
    }
  }

  async function sendOtp() {
    if (localNum.trim().length < 6) { setError('Numéro trop court'); return }
    if (cooldown > 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/otp/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone, dialCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Erreur d'envoi"); return }
    setOtpCode(data.code ?? null)
    setMode('otp-reset'); setOtpInput(''); startCooldown()
  }

  function handleOtpNext() {
    if (otpInput.length !== 6) return
    setError('')
    setMode('pin-reset')
  }

  async function handlePinReset() {
    if (pinInput.length !== 4) return
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone, code: otpInput.trim(), pinCode: pinInput, role: role === 'merchant' ? 'merchant' : 'buyer' }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setOtpInput(''); setPinInput(''); setMode('otp-reset')
      setError(data.error ?? 'Code incorrect'); return
    }
    await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
    if (role === 'merchant') {
      router.push('/merchant/dashboard')
    } else {
      router.push(nextUrl)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }
    const r = data.user?.app_metadata?.role
    if (r === 'super_admin') router.push('/admin/dashboard')
    else if (r === 'merchant') router.push('/merchant/dashboard')
    else router.push('/')
  }

  // Titre et sous-titre dynamiques selon le rôle
  const whatsappTitle = role === 'merchant' ? 'Connexion marchand' : 'Connexion acheteur'
  const whatsappSub   = role === 'merchant'
    ? 'Accédez à votre espace vendeur'
    : 'Connectez-vous pour suivre vos commandes'
  const createLink    = role === 'merchant' ? '/register?role=merchant' : '/register?role=buyer'
  const createLabel   = role === 'merchant' ? 'Créer ma boutique' : 'Créer un compte acheteur'

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 24px) env(safe-area-inset-left, 16px)', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient background */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '150vw', height: '70vh', background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.1) 0%, rgba(249,115,22,0.09) 35%, rgba(10,19,34,0) 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(249,115,22,.04)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(45,107,228,.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          {/* Spotlight glow behind logo */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '380px', height: '180px', background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(249,115,22,0.6) 40%, rgba(45,107,228,0.25) 75%, transparent 100%)', filter: 'blur(32px)', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '90px', background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, transparent 100%)', filter: 'blur(16px)', zIndex: 0, pointerEvents: 'none' }} />

          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, position: 'relative' }}>
              <img
                src="/logos/logo-jokoo-cart.png"
                alt="Jokoo"
                style={{ height: '84px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))', transform: 'scale(1.05)', transition: 'transform 0.3s ease' }}
              />
            </div>
          </Link>
        </div>

        {/* ── CARROUSEL DES CATÉGORIES ── */}
        <div style={{ width: '100%', overflow: 'hidden', marginBottom: 20, position: 'relative', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 36, background: 'linear-gradient(to right, #0a0f1e, transparent)', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 36, background: 'linear-gradient(to left, #0a0f1e, transparent)', zIndex: 2 }} />

          <div className="scroll-track" style={{ display: 'flex', gap: 12, padding: '4px 0' }}>
            {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <div key={i} style={{ position: 'relative', width: 90, height: 90, borderRadius: 14, overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: cat.whiteBg ? 'white' : '#1a1a24' }}>
                {cat.phones ? (
                  PHONE_IMGS.map((p, pi) => (
                    <img
                      key={pi}
                      src={p.src}
                      alt={p.label}
                      className={`phone-cycle phone-cycle-${pi}`}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' }}
                    />
                  ))
                ) : (
                  <img
                    src={cat.img}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: cat.whiteBg ? 'scale(1.15)' : 'scale(1)' }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)', zIndex: 1 }} />
                <div style={{ position: 'absolute', bottom: 5, left: 4, right: 4, color: 'white', fontSize: '0.6rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,1)', zIndex: 2 }}>
                  {cat.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '28px 24px', backdropFilter: 'blur(12px)' }}>

          {/* ══════════════════════════════════════════
              MODE CHOOSE — Choix du rôle
          ══════════════════════════════════════════ */}
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* En-tête */}
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.3rem', color: 'white', letterSpacing: '-0.01em' }}>
                  Bienvenue sur Jokoo
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                  Achetez et vendez en toute simplicité
                </div>
              </div>

              {/* ── ACHETER SANS COMPTE (bien visible) ── */}
              <Link
                id="btn-guest-browse"
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px 20px', borderRadius: 16, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', fontWeight: 800, fontSize: '1rem',
                  boxShadow: '0 6px 20px rgba(22,163,74,0.35)',
                }}
              >
                <ShoppingBag size={20} /> Voir les produits — sans compte <ArrowRight size={18} />
              </Link>
              <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginTop: -6 }}>
                Aucune inscription nécessaire pour commander
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '.08em' }}>OU SE CONNECTER</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* ── Bouton ACHETEUR ── */}
              <button
                id="btn-role-buyer"
                onClick={() => selectRole('buyer')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(45,107,228,0.18), rgba(29,78,216,0.12))',
                  border: '2px solid rgba(45,107,228,0.40)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,107,228,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(45,107,228,0.40)')}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 15,
                  background: 'linear-gradient(135deg, #2D6BE4, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(45,107,228,0.4)',
                }}>
                  <ShoppingBag size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>Je suis acheteur</div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>Parcourir, commander et suivre mes achats</div>
                </div>
                <ArrowRight size={18} color="rgba(255,255,255,0.3)" />
              </button>

              {/* ── Bouton MARCHAND ── */}
              <button
                id="btn-role-merchant"
                onClick={() => selectRole('merchant')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.12))',
                  border: '2px solid rgba(249,115,22,0.40)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.40)')}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 15,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                }}>
                  <Store size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>Je suis marchand</div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>Créer ma boutique et vendre mes produits</div>
                </div>
                <ArrowRight size={18} color="rgba(255,255,255,0.3)" />
              </button>

              {/* Accès admin discret */}
              <div style={{ textAlign: 'center', paddingTop: 4 }}>
                <button
                  onClick={() => setMode('email')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: '.68rem', cursor: 'pointer', letterSpacing: '.04em' }}
                >
                  Accès administrateur
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              MODE WHATSAPP — Saisie numéro
          ══════════════════════════════════════════ */}
          {mode === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header avec retour */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button onClick={() => { setMode('choose'); setError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, fontSize: '1.2rem' }}>&#8592;</button>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>{whatsappTitle}</div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{whatsappSub}</div>
                </div>
              </div>

              {role === 'buyer' && (
                <Link
                  id="btn-guest-continue-top"
                  href={nextUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 18px', borderRadius: 14, textDecoration: 'none',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white',
                    fontWeight: 800, fontSize: '.95rem', boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
                  }}
                >
                  Continuer sans compte <ArrowRight size={16} />
                </Link>
              )}

              {/* Indicateur de rôle */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                background: role === 'merchant' ? 'rgba(249,115,22,0.12)' : 'rgba(45,107,228,0.12)',
                border: `1px solid ${role === 'merchant' ? 'rgba(249,115,22,0.3)' : 'rgba(45,107,228,0.3)'}`,
                borderRadius: 30, padding: '5px 12px',
              }}>
                {role === 'merchant'
                  ? <Store size={13} color="#f97316" />
                  : <ShoppingBag size={13} color="#2D6BE4" />}
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: role === 'merchant' ? '#fb923c' : '#60a5fa' }}>
                  {role === 'merchant' ? 'Espace marchand' : 'Espace acheteur'}
                </span>
              </div>

              {/* Champ numéro WhatsApp */}
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}>Numéro WhatsApp</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  <select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 11, color: 'white', padding: '0 8px', fontSize: '.85rem', cursor: 'pointer', minWidth: 68 }}>
                    {COUNTRIES.map(c => <option key={c.dial + c.flag} value={c.dial} style={{ background: '#1e293b' }}>{c.flag} {c.dial}</option>)}
                  </select>
                  <input
                    type="tel" placeholder="77 123 45 67" value={localNum} autoFocus
                    onChange={e => { setLocalNum(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter' && localNum.trim().length >= 6) handleCheckPhone() }}
                    style={{ flex: 1, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 11, color: 'white', padding: '11px 13px', fontSize: '1rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }}
                  />
                </div>
              </div>

              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '8px 12px', fontSize: '.78rem', color: '#fca5a5' }}>{error}</div>}

              {/* Bouton Recevoir code WhatsApp */}
              <button
                onClick={handleCheckPhone}
                disabled={loading || localNum.trim().length < 6}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 52, borderRadius: 14,
                  background: localNum.trim().length >= 6
                    ? 'linear-gradient(135deg,#25d366,#128c7e)'
                    : 'rgba(255,255,255,0.07)',
                  color: 'white', fontWeight: 700, fontSize: '.92rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  opacity: localNum.trim().length < 6 ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Vérification...</>
                  : <><MessageCircle size={18} /> Recevoir le code WhatsApp</>
                }
              </button>

              {/* Séparateur */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '.08em' }}>OU</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Continuer avec Google */}
              <button
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', height: 48, borderRadius: 14,
                  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </button>

              {/* Lien création compte */}
              <div style={{ textAlign: 'center', paddingTop: 4 }}>
                {role === 'merchant' ? (
                  <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)' }}>
                    Vous n&apos;avez pas de boutique ?{' '}
                    <Link href={createLink} style={{ color: '#fb923c', fontWeight: 700, textDecoration: 'none' }}>
                      Créer ma boutique
                    </Link>
                  </span>
                ) : (
                  <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)' }}>
                    Vous n&apos;avez pas de compte ?{' '}
                    <Link href={createLink} style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
                      Créer un compte acheteur
                    </Link>
                  </span>
                )}
              </div>

              {/* Acheteur : option sans compte — bien visible */}
              {role === 'buyer' && (
                <Link
                  href={nextUrl === '/' ? '/' : nextUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 18px', borderRadius: 14, textDecoration: 'none', marginTop: 4,
                    background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white',
                    fontWeight: 800, fontSize: '.92rem', boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
                  }}
                >
                  Continuer sans compte <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════
              MODE PIN-LOGIN — Code secret
          ══════════════════════════════════════════ */}
          {mode === 'pin-login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button onClick={() => { setMode('whatsapp'); setError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, fontSize: '1.2rem' }}>&#8592;</button>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Code Secret</div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{fullPhone}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.2)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🔐</div>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '.88rem' }}>Entrez votre Code à 4 chiffres</div>
              </div>
              <input
                type="password" inputMode="numeric" placeholder="● ● ● ●"
                value={pinInput} maxLength={4}
                onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter' && pinInput.length === 4) handlePinLogin() }}
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 13, color: 'white', textAlign: 'center' as const, fontSize: '2rem', letterSpacing: '.5em', fontFamily: 'monospace', padding: '13px', outline: 'none', boxSizing: 'border-box' as const }}
              />
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '8px 12px', fontSize: '.78rem', color: '#fca5a5' }}>{error}</div>}
              <button
                onClick={handlePinLogin}
                disabled={loading || pinInput.length !== 4}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, borderRadius: 13, background: pinInput.length === 4 ? 'linear-gradient(135deg,#25d366,#128c7e)' : '#64748b', color: 'white', fontWeight: 700, fontSize: '.9rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion...</> : <>Se connecter</>}
              </button>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button type="button" onClick={sendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: '.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Code secret oublié ?
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              MODE OTP-RESET — Vérification code
          ══════════════════════════════════════════ */}
          {mode === 'otp-reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <button onClick={() => { setMode('whatsapp'); setError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, fontSize: '1.2rem' }}>&#8592;</button>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Code de vérification</div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Envoyé au {fullPhone}</div>
                </div>
              </div>
              {otpCode ? (
                <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '.62rem', color: '#4ade80', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>Code DEV</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '.3em', fontFamily: 'monospace' }}>{otpCode}</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.2)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>💬</div>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '.88rem' }}>Code envoyé sur WhatsApp</div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: 6, lineHeight: 1.4 }}>
                    Un code vient de vous être envoyé pour vérifier votre numéro.
                  </div>
                </div>
              )}
              <input
                type="text" inputMode="numeric" placeholder="_ _ _ _ _ _"
                value={otpInput} maxLength={6}
                onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter' && otpInput.length === 6) handleOtpNext() }}
                autoComplete="one-time-code" autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 13, color: 'white', textAlign: 'center' as const, fontSize: '1.5rem', letterSpacing: '.3em', fontFamily: 'monospace', padding: '13px', outline: 'none', boxSizing: 'border-box' as const }}
              />
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '8px 12px', fontSize: '.78rem', color: '#fca5a5' }}>{error}</div>}
              <button
                onClick={handleOtpNext}
                disabled={loading || otpInput.length !== 6}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, borderRadius: 13, background: otpInput.length === 6 ? 'linear-gradient(135deg,#f97316,#ea6b0b)' : '#64748b', color: 'white', fontWeight: 700, fontSize: '.9rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Suivant
              </button>
              <button
                onClick={sendOtp}
                disabled={loading || cooldown > 0}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '.75rem', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 }}
              >
                <RefreshCw size={11} /> {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              MODE PIN-RESET — Nouveau code secret
          ══════════════════════════════════════════ */}
          {mode === 'pin-reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button onClick={() => { setMode('otp-reset'); setError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, fontSize: '1.2rem' }}>&#8592;</button>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                    {role === 'merchant' ? 'Créer votre accès marchand' : 'Créer votre code secret'}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{fullPhone}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.2)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🔒</div>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '.88rem' }}>Choisissez un code à 4 chiffres</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: 6, lineHeight: 1.4 }}>
                  Il vous servira pour vos prochaines connexions.
                </div>
              </div>
              <input
                type="password" inputMode="numeric" placeholder="● ● ● ●"
                value={pinInput} maxLength={4}
                onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter' && pinInput.length === 4) handlePinReset() }}
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 13, color: 'white', textAlign: 'center' as const, fontSize: '2rem', letterSpacing: '.5em', fontFamily: 'monospace', padding: '13px', outline: 'none', boxSizing: 'border-box' as const }}
              />
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '8px 12px', fontSize: '.78rem', color: '#fca5a5' }}>{error}</div>}
              <button
                onClick={handlePinReset}
                disabled={loading || pinInput.length !== 4}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, borderRadius: 13, background: pinInput.length === 4 ? 'linear-gradient(135deg,#25d366,#128c7e)' : '#64748b', color: 'white', fontWeight: 700, fontSize: '.9rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...</> : <>Valider le code</>}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              MODE EMAIL — Admin seulement
          ══════════════════════════════════════════ */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <button type="button" onClick={() => { setMode('choose'); setError('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, fontSize: '1.2rem' }}>&#8592;</button>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Connexion Admin</div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Email et mot de passe</div>
                </div>
              </div>
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '8px 12px', fontSize: '.78rem', color: '#fca5a5' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)' }} />
                  <input type="email" placeholder="admin@jokoo.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 11, color: 'white', padding: '11px 13px 11px 38px', fontSize: '.92rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', marginBottom: 7, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.25)' }} />
                  <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 11, color: 'white', padding: '11px 42px 11px 38px', fontSize: '.92rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)', padding: 4, display: 'flex' }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, borderRadius: 13, background: 'linear-gradient(135deg,#2D6BE4,#1d4ed8)', color: 'white', fontWeight: 700, fontSize: '.9rem', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion...</> : <>Se connecter <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* ── PHRASE DE CONFIANCE ── */}
          <div style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 'env(safe-area-inset-bottom, 0px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(37,211,102,0.65)" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.03em', fontWeight: 500 }}>
              Connexion sécurisée · Vos données protégées
            </span>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-1122px); }
        }
        .scroll-track {
          animation: scroll 20s linear infinite;
        }
        .scroll-track:hover {
          animation-play-state: paused;
        }
        @keyframes phoneCycle {
          0%    { opacity: 0; }
          8%    { opacity: 1; }
          25%   { opacity: 1; }
          33%   { opacity: 0; }
          100%  { opacity: 0; }
        }
        .phone-cycle   { opacity: 0; animation: phoneCycle 4.5s infinite; }
        .phone-cycle-0 { animation-delay: 0s;   }
        .phone-cycle-1 { animation-delay: 1.5s; }
        .phone-cycle-2 { animation-delay: 3s;   }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.25s ease forwards; }
      `}</style>
    </div>
  )
}
