'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Store, CheckCircle, AlertCircle, Loader2, ArrowLeft, Camera, MapPin, Phone, Mail, Copy, ExternalLink } from 'lucide-react'

export default function MerchantShopPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [shopSlug, setShopSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    fetch('/api/merchant/shop', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.shop) {
          const s = data.shop
          setShopSlug(s.slug ?? null)
          setForm(prev => ({
            ...prev,
            name: s.name ?? '',
            description: s.description ?? '',
            city: s.city ?? '',
            address: s.address ?? '',
            country: s.country ?? 'Sénégal',
            phone: s.phone ?? '',
            email: s.email ?? '',
            website: s.website ?? '',
            logo_url: s.logo_url ?? '',
            banner_url: s.banner_url ?? '',
          }))
          if (s.logo_url) setLogoPreview(s.logo_url)
          if (s.banner_url) setBannerPreview(s.banner_url)
        }
      })
      .catch(() => {})

    setOrigin(window.location.origin)
  }, [])

  function copyLink() {
    const url = `${window.location.origin}/boutique/${shopSlug}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const [form, setForm] = useState({
    name: '', description: '', city: '', address: '', country: 'Sénégal', phone: '', email: '', website: '', logo_url: '', banner_url: ''
  })

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleImagePreview(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'logo') { setLogoPreview(url); setLogoFile(file) }
    else { setBannerPreview(url); setBannerFile(file) }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async function uploadImage(file: File, _type: string) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) return await fileToBase64(file)
      const data = await res.json()
      return data.url || (await fileToBase64(file))
    } catch {
      return await fileToBase64(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { setError('Nom de boutique requis'); return }
    setLoading(true); setError('')

    let finalLogoUrl = form.logo_url
    let finalBannerUrl = form.banner_url

    if (logoFile) finalLogoUrl = await uploadImage(logoFile, 'logo')
    if (bannerFile) finalBannerUrl = await uploadImage(bannerFile, 'banner')

    // Appel à l'API server-side qui utilise le client admin (bypass RLS)
    const res = await fetch('/api/merchant/shop', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, logo_url: finalLogoUrl, banner_url: finalBannerUrl }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError('Erreur: ' + (data.error ?? 'Impossible de sauvegarder'))
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/merchant/dashboard'), 2000)
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <aside className="sidebar">
        {/* ── LOGO JOKKO ── */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid hsl(214 32% 91%)' }}>
          <Link href="/merchant/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img 
              src="/logos/logo-jokoo-cart.png" 
              alt="Jokko" 
              style={{ height: 40, width: 'auto', objectFit: 'contain' }} 
            />
            <div style={{ borderLeft: '1.5px solid hsl(214 32% 88%)', paddingLeft: 8 }}>
              <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.1 }}>ESPACE</div>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800, lineHeight: 1.2 }}>MARCHAND</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: 12, flex: 1 }}>
          {[
            { href: '/merchant/dashboard', label: 'Dashboard' },
            { href: '/merchant/products', label: 'Mes Produits' },
            { href: '/merchant/orders', label: 'Commandes' },
            { href: '/merchant/shop', label: 'Ma Boutique', active: true },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${item.active ? 'active' : ''}`} style={{ marginBottom: 2 }}>{item.label}</Link>
          ))}
        </nav>
      </aside>

      <main className="main-content" style={{ flex: 1 }}>
        <div style={{ background: 'hsl(222 40% 12%)', borderBottom: '1px solid hsl(222 25% 22%)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 30 }}>
          <Link href="/merchant/dashboard" className="btn btn-ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem' }}>Configurer ma boutique</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(220 15% 55%)' }}>Informations visibles par vos clients</p>
          </div>
        </div>

        <div style={{ padding: '28px 28px 100px 28px', maxWidth: 800, margin: '0 auto' }}>

          {/* ── LIEN UNIQUE BOUTIQUE ── */}
          {shopSlug && (
            <div style={{ marginBottom: 24, background: 'linear-gradient(135deg, hsl(221 83% 18%), hsl(158 64% 14%))', borderRadius: 16, padding: '20px 24px', border: '1px solid hsl(221 83% 30%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ExternalLink size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Votre lien boutique unique</div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(220 15% 65%)' }}>Partagez ce lien à vos clients</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, background: 'hsl(222 40% 10%)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'hsl(221 83% 70%)', wordBreak: 'break-all', minWidth: 0 }}>
                   {origin}/boutique/{shopSlug}
                </div>
                <button type="button" onClick={copyLink} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#16a34a' : 'hsl(221 83% 53%)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', touchAction: 'manipulation', whiteSpace: 'nowrap' }}>
                  <Copy size={14} /> {copied ? 'Copié !' : 'Copier'}
                </button>
                 <Link href={`/boutique/${shopSlug}`} target="_blank" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: '#f97316', color: 'white', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  <ExternalLink size={14} /> Voir
                </Link>
              </div>
               <a href={`https://wa.me/?text=${encodeURIComponent(`🏪 Decouvrez "${form.name}" sur Jokoo !
👉 ${origin}/boutique/${shopSlug}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, background: '#25d366', color: 'white', borderRadius: 8, padding: '7px 14px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                📱 Partager sur WhatsApp
              </a>
            </div>
          )}

          {success && <div className="alert alert-success animate-fade-in" style={{ marginBottom: 24 }}><CheckCircle size={16} /> Boutique enregistrée ! En attente de validation par l'admin.</div>}
          {error && <div className="alert alert-error animate-fade-in" style={{ marginBottom: 24 }}><AlertCircle size={16} /> {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Bannière & Logo */}
            <div className="card">
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Identité visuelle</h3>

              {/* Bannière */}
              <div style={{ marginBottom: 20 }}>
                <label className="label">Bannière de boutique</label>
                <label htmlFor="banner-upload" style={{ display: 'block', cursor: 'pointer' }}>
                  <div style={{
                    height: 160, borderRadius: 12, border: '2px dashed hsl(222 25% 30%)',
                    backgroundColor: bannerPreview ? 'transparent' : 'hsl(222 35% 14%)',
                    backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                  }}>
                    {!bannerPreview && (
                      <div style={{ textAlign: 'center', color: 'hsl(220 15% 55%)' }}>
                        <Camera size={24} style={{ marginBottom: 6 }} />
                        <p style={{ fontSize: '0.82rem' }}>Ajouter une bannière (1200×300px recommandé)</p>
                      </div>
                    )}
                    {bannerPreview && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} color="white" />
                      </div>
                    )}
                  </div>
                </label>
                <input id="banner-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImagePreview(e, 'banner')} />
              </div>

              {/* Logo */}
              <div>
                <label className="label">Logo de la boutique</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label htmlFor="logo-upload" style={{ cursor: 'pointer' }}>
                    <div style={{
                      width: 90, height: 90, borderRadius: 16,
                      border: '2px dashed hsl(222 25% 30%)',
                      backgroundColor: logoPreview ? 'transparent' : 'hsl(222 35% 14%)',
                      backgroundImage: logoPreview ? `url(${logoPreview})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {!logoPreview && <Camera size={22} color="hsl(220 15% 55%)" />}
                    </div>
                  </label>
                  <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImagePreview(e, 'logo')} />
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: 4 }}>Logo de votre boutique</p>
                    <p style={{ fontSize: '0.78rem', color: 'hsl(220 15% 55%)' }}>PNG ou JPG · Format carré recommandé · Max 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Infos générales */}
            <div className="card">
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Informations générales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label" htmlFor="shop-name">Nom de la boutique *</label>
                  <input id="shop-name" type="text" placeholder="Ex: Mode Dakar by Aminata" value={form.name} onChange={e => update('name', e.target.value)} className="input" required />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="shop-desc">Description de la boutique</label>
                  <textarea id="shop-desc" placeholder="Décrivez votre boutique, vos produits, ce qui vous rend unique..." value={form.description} onChange={e => update('description', e.target.value)} className="input" style={{ minHeight: 100, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Localisation & Contact */}
            <div className="card">
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Localisation & Contact</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                   <label className="label" htmlFor="city">Ville</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
                    <input id="city" type="text" placeholder="Dakar" value={form.city} onChange={e => update('city', e.target.value)} className="input" style={{ paddingLeft: 36 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="country">Pays</label>
                  <select id="country" value={form.country} onChange={e => update('country', e.target.value)} className="input">
                    {['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Guinée', 'Burkina Faso', 'Niger', 'Bénin', 'Togo', 'Cameroun', 'Autre'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label" htmlFor="address">Adresse complète</label>
                  <input id="address" type="text" placeholder="Quartier, rue, numéro..." value={form.address} onChange={e => update('address', e.target.value)} className="input" />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="shop-phone">Téléphone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
                    <input id="shop-phone" type="tel" placeholder="+221 77 000 00 00" value={form.phone} onChange={e => update('phone', e.target.value)} className="input" style={{ paddingLeft: 36 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="shop-email">Email de contact</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(220 15% 55%)' }} />
                    <input id="shop-email" type="email" placeholder="boutique@email.com" value={form.email} onChange={e => update('email', e.target.value)} className="input" style={{ paddingLeft: 36 }} />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Enregistrement...</> : <><Store size={18} /> Enregistrer ma boutique</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
