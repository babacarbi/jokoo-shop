'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Store, X, ArrowRight, Loader2, CheckCircle, RefreshCw, Sparkles,
} from 'lucide-react'

const COUNTRIES = [
  { flag: '🇸🇳', dial: '+221' },
  { flag: '🇨🇮', dial: '+225' },
  { flag: '🇲🇱', dial: '+223' },
  { flag: '🇬🇳', dial: '+224' },
  { flag: '🇧🇫', dial: '+226' },
  { flag: '🇨🇲', dial: '+237' },
]

const CATEGORIES = [
  { slug: 'mode-vetements',   label: 'Mode',        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=200&auto=format&fit=crop', color: '#ec4899' },
  { slug: 'electronique',     label: 'Électroménager', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&auto=format&fit=crop', color: '#3b82f6' },
  { slug: 'alimentation',     label: 'Alimentation',image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=200&auto=format&fit=crop', color: '#22c55e' },
  { slug: 'beaute-sante',     label: 'Beauté',      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=200&auto=format&fit=crop', color: '#a855f7' },
  { slug: 'maison-deco',      label: 'Maison',      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=200&auto=format&fit=crop', color: '#f59e0b' },
  { slug: 'informatique',     label: 'Informatique', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=200&auto=format&fit=crop', color: '#06b6d4' },
  { slug: 'sport-loisirs',    label: 'Sport',       image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=200&auto=format&fit=crop', color: '#10b981' },
  { slug: 'services',         label: 'Services',    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop', color: '#f97316' },
  { slug: 'livres-education', label: 'Éduc',        image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=200&auto=format&fit=crop', color: '#8b5cf6' },
  { slug: 'bebe-enfant',      label: 'Enfant',      image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=200&auto=format&fit=crop', color: '#f43f5e' },
]

const SUGGESTIONS: Record<string, string[]> = {
  'mode-vetements':   ['Mode Dakar', 'Wax & Style', 'Élégance Africa'],
  'electronique':     ['Electro Maison', 'Frigo Store', 'Climatisation Pro'],
  'alimentation':     ['Shop Nutrition', 'Bio Africa', 'Saveurs du Sahel'],
  'beaute-sante':     ['Beauty Bar', 'Glam Africa', 'Soin & Beauté'],
  'maison-deco':      ['Casa Africa', 'Déco Bamako', 'Maison & Style'],
  'informatique':     ['Digital Store', 'PC Gamer', 'Tech Shop'],
  'sport-loisirs':    ['Sport Zone', 'Fitness Africa', 'Play Store'],
  'services':         ['Pro Services', 'Africa Services', 'Expert Zone'],
  'livres-education': ['Librairie Africa', 'Savoir+', 'Édu Store'],
  'bebe-enfant':      ['BébéShop', 'Kids Africa', 'Petits Bonheurs'],
}

const POPUP_INTERVAL_MS = 5 * 60 * 1000
const STORAGE_KEY = 'shop_promo_last_shown'
type Step = 'promo' | 'phone' | 'otp' | 'pin' | 'shop' | 'success'

export default function ShopPromoPopup() {
  const router = useRouter()
  const supabase = createClient()

  const [visible, setVisible]       = useState(false)
  const [animating, setAnimating]   = useState(false)
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [step, setStep]             = useState<Step>('promo')
  const [dialCode, setDialCode]     = useState('+221')
  const [localNum, setLocalNum]     = useState('')
  const [otpInput, setOtpInput]     = useState('')
  const [pinInput, setPinInput]     = useState('')
  const [otpCode, setOtpCode]       = useState<string | null>(null)
  const [shopName, setShopName]     = useState('')
  const [shopCategory, setShopCategory] = useState('')
  const [shopSlug, setShopSlug]     = useState('')
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [copied, setCopied]         = useState(false)
  const [cooldown, setCooldown]     = useState(0)
  const cooldownRef                 = useRef<ReturnType<typeof setInterval> | null>(null)

  const showPopup = useCallback(() => {
    setVisible(true); setAnimating(true)
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  }, [])

  const scheduleNext = useCallback(() => {
    // Disabled as per user request to decrease insistence
  }, [])

  useEffect(() => {
    async function checkUserAndShow() {
      // Si l'utilisateur a déjà créé sa boutique ou est connecté, on bloque définitivement
      if (localStorage.getItem('shop_promo_disabled') === 'true') return
      
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        localStorage.setItem('shop_promo_disabled', 'true')
        return
      }
      
      // Diminuer l'insistance : une fois toutes les 24h max
      const lastShown = localStorage.getItem(STORAGE_KEY)
      if (lastShown && Date.now() - parseInt(lastShown) < 24 * 60 * 60 * 1000) return
      
      const t = setTimeout(showPopup, 3000)
      timerRef.current = t
    }
    checkUserAndShow()
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [showPopup, supabase.auth])

  function close() {
    setAnimating(false)
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch {}
    setTimeout(() => { 
      setVisible(false)
      setStep('promo')
    }, 250)
  }

  function startCooldown() {
    setCooldown(30)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(p => { if (p <= 1) { clearInterval(cooldownRef.current!); return 0 } return p - 1 })
    }, 1000)
  }

  async function sendOtp() {
    const cleaned = `${dialCode}${localNum.replace(/\s+/g, '')}`
    if (localNum.trim().length < 6) { setError('Numéro trop court'); return }
    if (cooldown > 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/otp/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, dialCode }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur envoi'); return }
    setOtpCode(data.code ?? null)
    setIsReturningUser(!!data.userExists)
    setStep('otp'); setOtpInput(''); startCooldown()
  }

  function handleOtpNext() {
    if (otpInput.length !== 6) return
    setError('')
    setStep('pin')
  }

  async function registerAccount() {
    if (pinInput.length !== 4) return
    const cleaned = `${dialCode}${localNum.replace(/\s+/g, '')}`
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleaned, code: otpInput.trim(), pinCode: pinInput, role: 'merchant' }),
    })
    const data = await res.json()
    if (!res.ok) { 
      setOtpInput('')
      setPinInput('')
      setStep('otp') // Back to OTP if error
      setError(data.error ?? 'Code incorrect')
      setLoading(false)
      return 
    }
    await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
    setLoading(false)
    if (data.hasShop) {
      close()
      router.push('/merchant/dashboard')
    } else {
      setStep('shop')
    }
  }

  async function createShop() {
    if (!shopName.trim()) { setError('Donnez un nom à votre boutique'); return }
    setLoading(true); setError('')
    const cleaned = `${dialCode}${localNum.replace(/\s+/g, '')}`
    const res = await fetch('/api/merchant/shop', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ name: shopName.trim(), phone: cleaned, city: '', country: 'Afrique', category: shopCategory }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error ?? 'Erreur création'); return }
    setShopSlug(d.slug ?? shopName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))
    setStep('success')
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (!visible) return null

  const fullPhone = `${dialCode}${localNum.replace(/\s+/g, '')}`
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marketplace-africa.com'
  const shopUrl = `${APP_URL}/boutique/${shopSlug}`
  const STEPS: Step[] = ['phone','otp','pin','shop','success']
  const stepIdx = STEPS.indexOf(step)

  const TITLES: Record<Step,string> = {
    promo: 'Lancez votre boutique',
    phone: 'Votre numéro WhatsApp',
    otp:   'Code de vérification',
    pin:   'Code Secret',
    shop:  'Nommez votre boutique',
    success: '🎉 Boutique créée !',
  }
  const SUBTITLES: Record<Step,string> = {
    promo: 'en 2 minutes · Lien unique · Commandes WhatsApp',
    phone: 'Un code vous sera envoyé sur WhatsApp',
    otp:   `Code envoyé au ${fullPhone}`,
    pin:   'Sécurisez votre compte marchand',
    shop:  'Dernière étape · 10 secondes',
    success: 'Partagez votre lien avec vos clients',
  }

  return (
    <>
      <div 
        onClick={close} 
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)', zIndex:9998, cursor:'pointer', animation: animating ? 'fadeInBackdrop .3s ease forwards' : 'fadeOutBackdrop .3s ease forwards' }} 
      />

      <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', pointerEvents:'none' }}>
        <div style={{ background:'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', borderRadius:24, width:'100%', maxWidth:420, maxHeight:'90dvh', overflowY:'auto', boxShadow:'0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.2)', pointerEvents:'auto', animation: animating ? 'popupSlideIn .4s cubic-bezier(.34,1.56,.64,1) forwards' : 'popupSlideOut .3s ease forwards' }}>

          {/* ── HEADER ── */}
          <div style={{ background:'linear-gradient(135deg,#f97316,#ea6b0b)', padding:'20px 20px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                <div style={{ width:42, height:42, borderRadius:13, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.25)', flexShrink:0 }}>
                  <Store size={20} color="white" />
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'Outfit, sans-serif', fontWeight:900, fontSize:'1rem', color:'white', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{TITLES[step]}</div>
                  <div style={{ fontSize:'.65rem', color:'rgba(255,255,255,.75)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{SUBTITLES[step]}</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  close()
                }} 
                aria-label="Fermer"
                style={{ 
                  background:'rgba(255,255,255,.25)', 
                  border:'1px solid rgba(255,255,255,.3)', 
                  borderRadius:10, 
                  width:36,
                  height:36,
                  minWidth:36,
                  minHeight:36,
                  cursor:'pointer', 
                  display:'flex', 
                  alignItems:'center',
                  justifyContent:'center',
                  flexShrink:0,
                  position:'relative',
                  zIndex:10,
                  pointerEvents:'auto',
                  touchAction:'manipulation',
                  padding:0
                }}
              >
                <X size={18} color="white" strokeWidth={2.5} />
              </button>
            </div>
            {step !== 'promo' && (
              <div style={{ display:'flex', gap:4, marginTop:12 }}>
                {STEPS.map((s,i) => (
                  <div key={s} style={{ height:4, borderRadius:2, flex: i === stepIdx ? 2 : 1, background: i < stepIdx ? '#22c55e' : i === stepIdx ? 'white' : 'rgba(255,255,255,.25)', transition:'all .3s' }} />
                ))}
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div style={{ padding:'20px 20px 22px' }}>

            {/* PROMO */}
            {step === 'promo' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <p style={{ color:'#94a3b8', fontSize:'.85rem', lineHeight:1.6, margin:0 }}>
                  Rejoignez des milliers de marchands africains. Votre boutique en ligne en <strong style={{ color:'white' }}>2 minutes</strong>.
                </p>
                {[['⚡','Boutique en ligne en 2 min'],['💬','Commandes reçues sur WhatsApp'],['📱','Wave & Orange Money intégrés']].map(([e,l]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.04)', borderRadius:11, padding:'10px 13px', border:'1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ fontSize:'1.1rem' }}>{e}</span>
                    <span style={{ color:'#e2e8f0', fontSize:'.82rem', fontWeight:500 }}>{l}</span>
                  </div>
                ))}
                <button onClick={() => setStep('phone')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:52, borderRadius:14, background:'linear-gradient(135deg,#f97316,#ea6b0b)', color:'white', fontWeight:800, fontSize:'.92rem', border:'none', cursor:'pointer', marginTop:4, boxShadow:'0 6px 20px rgba(249,115,22,.4)', fontFamily:'Outfit, sans-serif' }}>
                  🏪 Ouvrir ma boutique maintenant <ArrowRight size={16} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    close()
                  }} 
                  style={{ background:'none', border:'none', color:'rgba(255,255,255,.6)', fontSize:'.82rem', cursor:'pointer', fontFamily:'Inter, sans-serif', padding:8, textDecoration:'underline', touchAction:'manipulation' }}
                >
                  OK, je verrai plus tard
                </button>
              </div>
            )}

            {/* PHONE */}
            {step === 'phone' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:'.68rem', fontWeight:600, color:'rgba(255,255,255,.4)', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>Numéro WhatsApp</label>
                  <div style={{ display:'flex', gap:7 }}>
                    <select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:11, color:'white', padding:'0 8px', fontSize:'.85rem', cursor:'pointer', minWidth:68 }}>
                      {COUNTRIES.map(c => <option key={c.dial+c.flag} value={c.dial} style={{ background:'#1e293b' }}>{c.flag} {c.dial}</option>)}
                    </select>
                    <input type="tel" placeholder="77 123 45 67" value={localNum} autoFocus suppressHydrationWarning
                      onChange={e => { setLocalNum(e.target.value); setError('') }}
                      onKeyDown={e => { if (e.key === 'Enter' && localNum.trim().length >= 6) sendOtp() }}
                      style={{ flex:1, background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:11, color:'white', padding:'11px 13px', fontSize:'1rem', outline:'none', fontFamily:'Inter, sans-serif', boxSizing:'border-box' }} />
                  </div>
                </div>
                {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'7px 11px', fontSize:'.78rem', color:'#fca5a5' }}>{error}</div>}
                <button onClick={sendOtp} disabled={loading || localNum.trim().length < 6 || cooldown > 0} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:50, borderRadius:13, background: localNum.trim().length >= 6 ? 'linear-gradient(135deg,#f97316,#ea6b0b)' : 'rgba(255,255,255,.08)', color:'white', fontWeight:700, fontSize:'.9rem', border:'none', cursor:'pointer', boxShadow: localNum.trim().length >= 6 ? '0 6px 20px rgba(249,115,22,.35)' : 'none', fontFamily:'Inter, sans-serif' }}>
                  {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Envoi...</> : <>💬 Recevoir mon code WhatsApp</>}
                </button>
              </div>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {otpCode ? (
                  <div style={{ background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.25)', borderRadius:13, padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'.62rem', color:'#4ade80', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:'.1em' }}>Code DEV</div>
                    <div style={{ fontSize:'2rem', fontWeight:900, color:'white', letterSpacing:'.3em', fontFamily:'monospace' }}>{otpCode}</div>
                  </div>
                ) : (
                  <div style={{ background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)', borderRadius:13, padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'1.7rem', marginBottom:5 }}>{isReturningUser ? '🔐' : '💬'}</div>
                    <div style={{ fontWeight:700, color:'white', fontSize:'.88rem' }}>
                      {isReturningUser ? 'Numéro déjà enregistré' : 'Code envoyé sur WhatsApp'}
                    </div>
                    <div style={{ fontSize:'.75rem', color: isReturningUser ? '#f97316' : 'rgba(255,255,255,.4)', marginTop:6, lineHeight: 1.4 }}>
                      {isReturningUser 
                        ? 'Vérifiez votre WhatsApp. Un nouveau code de connexion vient de vous être envoyé pour accéder à votre compte.'
                        : fullPhone}
                    </div>
                  </div>
                )}
                <input type="text" inputMode="numeric" placeholder="● ● ● ● ● ●" value={otpInput} maxLength={6}
                  onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter' && otpInput.length === 6) handleOtpNext() }}
                  autoComplete="one-time-code" autoFocus suppressHydrationWarning
                  style={{ width:'100%', background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:13, color:'white', textAlign:'center', fontSize:'1.5rem', letterSpacing:'.3em', fontFamily:'monospace', padding:'13px', outline:'none', boxSizing:'border-box' }} />
                {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'7px 11px', fontSize:'.78rem', color:'#fca5a5' }}>{error}</div>}
                <button type="button" onClick={handleOtpNext} disabled={otpInput.length !== 6 || loading} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:50, borderRadius:13, background: otpInput.length === 6 ? 'linear-gradient(135deg,#f97316,#ea6b0b)' : 'rgba(255,255,255,.08)', color:'white', fontWeight:700, fontSize:'.9rem', border:'none', cursor: otpInput.length === 6 ? 'pointer' : 'not-allowed', boxShadow: otpInput.length === 6 ? '0 6px 20px rgba(249,115,22,.35)' : 'none', fontFamily:'Inter, sans-serif' }}>
                  Suivant
                </button>
                <button type="button" onClick={sendOtp} disabled={loading || cooldown > 0} style={{ background:'none', border:'none', color: cooldown > 0 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.35)', cursor: cooldown > 0 ? 'not-allowed' : 'pointer', fontSize:'.75rem', fontFamily:'Inter, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <RefreshCw size={11} /> {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : 'Renvoyer le code'}
                </button>
              </div>
            )}
            {/* PIN */}
            {step === 'pin' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-fade-in">
                <div style={{ background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)', borderRadius:13, padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:'1.7rem', marginBottom:5 }}>🔒</div>
                  <div style={{ fontWeight:700, color:'white', fontSize:'.88rem' }}>Créer un Code Secret</div>
                  <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.6)', marginTop:6, lineHeight: 1.4 }}>
                    Ce code à 4 chiffres vous permettra de vous reconnecter sans attendre de SMS/WhatsApp.
                  </div>
                </div>
                <input type="password" inputMode="numeric" placeholder="● ● ● ●" value={pinInput} maxLength={4}
                  onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter' && pinInput.length === 4) registerAccount() }}
                  autoFocus
                  style={{ width:'100%', background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:13, color:'white', textAlign:'center', fontSize:'2rem', letterSpacing:'.5em', fontFamily:'monospace', padding:'13px', outline:'none', boxSizing:'border-box' }}
                />
                {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'7px 11px', fontSize:'.78rem', color:'#fca5a5' }}>{error}</div>}
                <button type="button" onClick={registerAccount} disabled={pinInput.length !== 4 || loading}
                  style={{ width:'100%', padding:'15px', borderRadius:14, border:'none', background: (pinInput.length===4 && !loading) ? '#f97316' : 'rgba(255,255,255,.1)', color:(pinInput.length===4 && !loading) ? 'white' : 'rgba(255,255,255,.4)', fontWeight:700, cursor:(pinInput.length===4 && !loading) ? 'pointer' : 'not-allowed' }}>
                  {loading ? 'Validation...' : 'Valider'}
                </button>
              </div>
            )}

            {/* SHOP */}
            {step === 'shop' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <input type="text" placeholder="Ex: Shop Nutrition, Shop..." value={shopName} maxLength={50} autoFocus suppressHydrationWarning
                    onChange={e => { setShopName(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter' && shopName.trim()) createShop() }}
                    style={{ width:'100%', background:'transparent', border:'none', borderBottom:`2px solid ${shopName ? '#f97316' : 'rgba(255,255,255,.15)'}`, color:'white', fontSize:'clamp(1.2rem,5vw,1.5rem)', fontWeight:800, fontFamily:'Outfit, sans-serif', padding:'8px 0', outline:'none', caretColor:'#f97316', transition:'border-color .2s', boxSizing:'border-box' }} />
                  {shopName.trim() && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:7, padding:'6px 10px', borderRadius:8, background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.2)' }}>
                      <Sparkles size={10} color="#f97316" />
                      <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.4)' }}>Votre lien :</span>
                      <span style={{ fontSize:'.65rem', color:'#f97316', fontWeight:700, fontFamily:'monospace' }}>
                        mkplace.io/{shopName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,22)}
                      </span>
                    </div>
                  )}
                </div>
                {shopCategory && !shopName && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {(SUGGESTIONS[shopCategory] ?? []).map(s => (
                      <button key={s} onClick={() => setShopName(s)} style={{ padding:'5px 11px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:'.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>{s}</button>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize:'.65rem', fontWeight:600, color:'rgba(255,255,255,.3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Catégorie <span style={{ fontWeight:400, textTransform:'none' }}>(optionnel)</span></div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                    {CATEGORIES.map(cat => {
                      const active = shopCategory === cat.slug
                      return (
                        <button key={cat.slug} type="button" onClick={() => setShopCategory(active ? '' : cat.slug)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'6px', borderRadius:14, background: active ? `${cat.color}15` : 'rgba(255,255,255,.02)', border:`2px solid ${active ? cat.color : 'rgba(255,255,255,.05)'}`, boxShadow: active ? `0 0 16px ${cat.color}44` : 'none', cursor:'pointer', transition:'all .2s ease', touchAction:'manipulation', position:'relative', overflow:'hidden' }}>
                          <div style={{ width:'100%', aspectRatio:'1/1', borderRadius:10, overflow:'hidden', position:'relative', background: 'rgba(255,255,255,.05)' }}>
                            <div style={{ position:'absolute', inset:0, background: active ? 'transparent' : 'rgba(0,0,0,0.4)', transition:'background .3s', zIndex:1 }} />
                            <img src={cat.image} alt={cat.label} style={{ width:'100%', height:'100%', objectFit:'cover', transform: active ? 'scale(1.1)' : 'scale(1)', transition:'transform .4s ease', display: 'block' }} />
                          </div>
                          <span style={{ fontSize: cat.label.length > 10 ? '.52rem' : '.6rem', letterSpacing: cat.label.length > 10 ? '-0.4px' : 'normal', fontWeight:800, color: active ? cat.color : 'rgba(255,255,255,.6)', textAlign:'center', lineHeight:1.2, transition:'color .2s', zIndex:2, marginBottom: 2, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'clip' }}>{cat.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {error && <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'7px 11px', fontSize:'.78rem', color:'#fca5a5' }}>{error}</div>}
                <button onClick={createShop} disabled={loading || !shopName.trim()} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:50, borderRadius:13, background: shopName.trim() ? 'linear-gradient(135deg,#f97316,#ea6b0b)' : 'rgba(255,255,255,.08)', color:'white', fontWeight:800, fontSize:'.9rem', border:'none', cursor:'pointer', boxShadow: shopName.trim() ? '0 6px 20px rgba(249,115,22,.4)' : 'none', fontFamily:'Outfit, sans-serif' }}>
                  {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Création...</> : <><Store size={15} /> Lancer ma boutique ! <ArrowRight size={13} /></>}
                </button>
                <button onClick={() => router.push('/merchant/dashboard')} style={{ background:'none', border:'none', color:'rgba(255,255,255,.2)', fontSize:'.72rem', cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
                  Configurer plus tard →
                </button>
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14, textAlign:'center' }}>
                <div>
                  <div style={{ fontSize:'2.5rem', marginBottom:6 }}>🎉</div>
                  <div style={{ fontFamily:'Outfit, sans-serif', fontWeight:900, fontSize:'1.15rem', color:'white', marginBottom:3 }}>{shopName} est en ligne !</div>
                  <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)' }}>Partagez votre lien avec vos clients dès maintenant.</div>
                </div>
                <button onClick={() => copyLink(shopUrl)} style={{ width:'100%', background:'rgba(249,115,22,.08)', border:'1.5px solid rgba(249,115,22,.3)', borderRadius:12, padding:'11px 13px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:7, textAlign:'left' }}>
                  <span style={{ fontSize:'.75rem', color:'#f97316', fontWeight:700, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{shopUrl.replace('https://','')}</span>
                  <span style={{ flexShrink:0, fontSize:'.68rem', fontWeight:700, color: copied ? '#22c55e' : 'rgba(255,255,255,.5)', background: copied ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.07)', padding:'4px 9px', borderRadius:7, transition:'all .2s' }}>{copied ? '✓ Copié !' : 'Copier'}</span>
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Découvrez ma boutique "${shopName}" sur Jokoo !\n👉 ${shopUrl}`)}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, height:50, borderRadius:13, background:'linear-gradient(135deg,#25d366,#128c7e)', color:'white', fontWeight:700, fontSize:'.88rem', textDecoration:'none', boxShadow:'0 4px 16px rgba(37,211,102,.3)' }}>
                  <span style={{ fontSize:'.95rem' }}>💬</span> Partager sur WhatsApp
                </a>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, height:42, borderRadius:11, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)', fontSize:'.75rem', fontWeight:600, textDecoration:'none' }}>👁 Voir ma boutique</a>
                  <button onClick={() => { close(); router.push('/merchant/dashboard') }} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, height:42, borderRadius:11, background:'rgba(249,115,22,.15)', border:'1.5px solid rgba(249,115,22,.35)', color:'#f97316', fontSize:'.75rem', fontWeight:700, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>Dashboard →</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBackdrop  { from{opacity:0} to{opacity:1} }
        @keyframes fadeOutBackdrop { from{opacity:1} to{opacity:0} }
        @keyframes popupSlideIn    { from{opacity:0;transform:scale(.85) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes popupSlideOut   { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(.9) translateY(20px)} }
        @keyframes spin            { to{transform:rotate(360deg)} }
      `}</style>
    </>
  )
}
