'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import {
  ArrowLeft, Upload, X, Plus, Loader2, Package,
  ImagePlus, Trash2, Save, Eye, AlertCircle, Search
} from 'lucide-react'
import CatalogModal from '@/components/merchant/CatalogModal'
import { CatalogProduct } from '@/types'

interface ImagePreview { file: File; url: string }
const MAX_DRAFTS = 5
const DRAFT_KEY = 'jokoo_product_draft'

const categories = [
  { id: 'c6272313-cad1-4679-aba5-59dbcf9ad3b5', name: 'Mode & Vêtements' }, 
  { id: '8cdda408-d4a6-44e2-8f86-c0f41c03fca1', name: 'Électronique' },
  { id: '0d822f9c-462b-42b0-87f1-240bf98a4682', name: 'Alimentation' },     
  { id: 'd0e0e368-c72b-4668-b490-6549030b5910', name: 'Beauté & Santé' },
  { id: '5fbb7687-4ac9-44a6-9bee-d81f6f6a7cdb', name: 'Maison & Déco' },    
  { id: '0aaf567c-c632-413a-aa7d-e862ee2aad71', name: 'Sport & Loisirs' },
  { id: 'd5a7e613-339a-45e5-8c82-fbf930b97ba6', name: 'Informatique' },     
  { id: 'affe3db3-982c-4132-bc64-982d7ea9c8ce', name: 'Livres & Éducation' },
]

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    stock: '', sku: '', category_id: '', status: 'draft' as 'draft' | 'active',
    weight: ''
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ── Brouillon automatique (survit à l'actualisation) ─────
  const [draftSavedAt, setDraftSavedAt] = useState('')
  const restored = useRef(false)
  const skipSave = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setForm(prev => ({ ...prev, ...JSON.parse(raw) }))
    } catch {}
    restored.current = true
  }, [])

  useEffect(() => {
    if (!restored.current || skipSave.current) return
    const t = setTimeout(() => {
      const hasData = Object.entries(form).some(([k, v]) => k !== 'status' && v)
      if (!hasData) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setDraftSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [form])

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setForm({ name: '', description: '', price: '', compare_price: '', stock: '', sku: '', category_id: '', status: 'draft', weight: '' })
    setDraftSavedAt('')
  }

  function handleCatalogSelect(product: CatalogProduct) {
    setForm(prev => ({
      ...prev,
      name: product.name,
      description: product.description || '',
      price: product.base_price.toString(),
      category_id: product.category_id || '',
    }))
    setIsCatalogOpen(false)
  }

  // ── Gestion des images ───────────────────────────────────
  function handleFiles(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files)
      .filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, 8 - images.length)

    const previews: ImagePreview[] = valid.map(file => ({
      file, url: URL.createObjectURL(file)
    }))
    setImages(prev => [...prev, ...previews].slice(0, 8))
  }

  function removeImage(index: number) {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // ── Upload image vers Cloudflare R2 ──────────────────────
  async function uploadImage(file: File, _shopId: string): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        console.error('Erreur upload:', await res.text())
        return null
      }
      const data = await res.json()
      return data.url || null
    } catch (err) {
      console.error('Exception upload:', err)
      return null
    }
  }

  // ── Soumission du formulaire ─────────────────────────────
  async function handleSubmit(e: React.FormEvent, forcedStatus?: 'draft' | 'active') {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock) {
      setError('Remplissez au minimum : nom, prix et stock')
      return
    }
    setLoading(true)
    setError('')
    
    const finalStatus = forcedStatus || form.status

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Récupérer la boutique
      const { getMyShopAction } = await import('@/app/actions')
      const shop = await getMyShopAction()
      
      if (!shop) {
        setError('Boutique introuvable. Créez d\'abord votre boutique via le tableau de bord.')
        setLoading(false)
        return
      }

      const payload = {
        shop_id: shop.id,
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        stock: parseInt(form.stock),
        sku: form.sku || null,
        category_id: form.category_id || null,
        status: finalStatus,
        weight: form.weight ? parseFloat(form.weight) : null,
      }

      // Brouillons : réutiliser un brouillon du même nom, sinon limiter à MAX_DRAFTS
      let existingId: string | null = null
      if (finalStatus === 'draft') {
        const { data: drafts } = await supabase.from('products').select('id, name').eq('shop_id', shop.id).eq('status', 'draft')
        const same = (drafts || []).find(d => d.name.trim().toLowerCase() === form.name.trim().toLowerCase())
        if (same) existingId = same.id
        else if ((drafts || []).length >= MAX_DRAFTS) {
          setError(`Limite de ${MAX_DRAFTS} brouillons atteinte. Publiez ou supprimez un ancien brouillon (Produits → Brouillons).`)
          setLoading(false)
          return
        }
      }

      // Créer (ou mettre à jour) le produit
      const { data: product, error: productError } = existingId
        ? await supabase.from('products').update(payload).eq('id', existingId).select().single()
        : await supabase.from('products').insert(payload).select().single()

      if (productError) { setError('Erreur lors de la création : ' + productError.message); setLoading(false); return }

      // Uploader les images
      if (images.length > 0) {
        const uploadedUrls = await Promise.all(images.map(img => uploadImage(img.file, shop.id)))
        
        if (uploadedUrls.includes(null)) {
          setError("L'upload des images a échoué (Vérifiez les permissions de votre bucket Storage 'product-images').")
          setLoading(false)
          return
        }

        const validUrls = uploadedUrls.filter(Boolean) as string[]

        if (validUrls.length > 0) {
          const { error: imageError } = await supabase.from('product_images').insert(
            validUrls.map((url, position) => ({ product_id: product.id, url, position }))
          )
          if (imageError) {
            console.error("Erreur images:", imageError)
            setError('Le produit a été créé, mais l\'ajout des images a échoué (Problème de permissions RLS).')
            setLoading(false)
            return
          }
        }
      }

      // Afficher le toast de succès puis rediriger
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      skipSave.current = true
      setSuccess(finalStatus === 'active' ? '✅ Produit publié avec succès !' : '💾 Brouillon sauvegardé !')
      setTimeout(() => router.push('/merchant/products'), 1800)
    } catch {
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="merchant-page-wrapper">
      {/* Sidebar simplifiée */}
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
            { href: '/merchant/products', label: 'Tous les produits' },
            { href: '/merchant/products/new', label: '+ Nouveau produit', active: true },
            { href: '/merchant/orders', label: 'Commandes' },
            { href: '/merchant/shop', label: 'Ma Boutique' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-nav-item ${item.active ? 'active' : ''}`} style={{ marginBottom: 2, ...(item.active ? { color: 'hsl(221 83% 53%)', background: 'hsl(221 83% 96%)', fontWeight: 700 } : {}) }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="merchant-content-area">
        {/* Mobile Header */}
        <div className="merchant-mobile-header">
          <Link href="/merchant/products" className="btn btn-ghost btn-icon" style={{ minWidth: 38, minHeight: 38, padding: 0 }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }}>
            <h2 className="merchant-mobile-header-title">Nouveau produit</h2>
          </div>
          <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'active')} className="btn btn-primary btn-sm" disabled={loading} style={{ padding: '8px 14px', minHeight: 38, fontWeight: 800, borderRadius: 10, gap: 6 }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer
          </button>
        </div>

        {/* Desktop Topbar */}
        <div className="merchant-desktop-topbar" style={{ background: 'white', borderBottom: '1px solid hsl(214 32% 91%)', padding: '0 28px', height: 64, alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Link href="/merchant/products" className="btn btn-ghost btn-icon" style={{ background: 'hsl(210 20% 98%)', color: 'hsl(222 47% 11%)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'hsl(222 47% 11%)' }}>Nouveau produit</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)' }}>Remplissez les informations de votre produit</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')} className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
              <Save size={15} /> Sauvegarder brouillon
            </button>
            <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'active')} className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Publication...</> : <><Eye size={15} /> Publier le produit</>}
            </button>
          </div>
        </div>

        <div className="merchant-inner animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
          {success && (
            <div className="alert alert-success animate-fade-in" style={{ marginBottom: 20 }}>
              {success}
            </div>
          )}
          {error && (
            <div className="alert alert-error animate-fade-in" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit}>
            {/* Bouton d'importation depuis le catalogue */}
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'linear-gradient(145deg, hsl(221 83% 53% / 0.08), hsl(210 20% 98%))', border: '1px dashed hsl(221 83% 53% / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'hsl(222 47% 11%)', fontSize: '0.95rem' }}>Gagner du temps ?</div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(215 16% 55%)' }}>Sélectionnez un modèle existant dans le catalogue de la marketplace.</div>
              </div>
              <button type="button" onClick={() => setIsCatalogOpen(true)} className="btn btn-primary btn-sm" style={{ background: 'hsl(221 83% 53% / 0.1)', color: 'hsl(221 83% 53%)', border: 'none' }}>
                <Search size={16} /> Parcourir le catalogue
              </button>
            </div>

            <div className="merchant-bottom-grid">

              {/* ── Colonne gauche ─────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Infos de base */}
                <div className="card">
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20 }}>Informations du produit</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label className="label" htmlFor="product-name">Nom du produit *</label>
                      <input id="product-name" type="text" placeholder="Ex: Robe Wax Premium Taille M" value={form.name} onChange={e => update('name', e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                      <label className="label" htmlFor="description">Description</label>
                      <textarea id="description" placeholder="Décrivez votre produit en détail..." value={form.description} onChange={e => update('description', e.target.value)} className="input" style={{ minHeight: 120, resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group">
                        <label className="label" htmlFor="price">Prix (FCFA) *</label>
                        <input id="price" type="number" placeholder="0" min="0" value={form.price} onChange={e => update('price', e.target.value)} className="input" required />
                      </div>
                      <div className="form-group">
                        <label className="label" htmlFor="compare_price">Prix barré (FCFA)</label>
                        <input id="compare_price" type="number" placeholder="Prix original" min="0" value={form.compare_price} onChange={e => update('compare_price', e.target.value)} className="input" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div className="card">
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 6 }}>Photos du produit</h3>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(220 15% 55%)', marginBottom: 16 }}>Max 8 photos · JPG, PNG, WebP · Max 5MB chacune</p>

                  {/* Zone d'upload */}
                  <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{ marginBottom: images.length > 0 ? 16 : 0, padding: '24px 16px', borderColor: isDragging ? 'hsl(221 83% 53%)' : undefined, background: isDragging ? 'hsl(221 83% 98%)' : 'hsl(210 17% 95%)' }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'hsl(221 83% 53% / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImagePlus size={20} color="hsl(221 83% 53%)" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(222 47% 11%)' }}>Glissez vos photos ici</p>
                        <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)', marginTop: 2 }}>ou <span style={{ color: 'hsl(221 83% 53%)', textDecoration: 'underline' }}>cliquez pour sélectionner</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Prévisualisations */}
                  {images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {images.map((img, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'hsl(210 17% 95%)', border: '1px solid hsl(214 32% 91%)' }}>
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {i === 0 && (
                            <div style={{ position: 'absolute', top: 4, left: 4, background: 'hsl(221 83% 53%)', color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                              PRINCIPALE
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {images.length < 8 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ aspectRatio: '1', borderRadius: 8, border: '1.5px dashed hsl(214 32% 80%)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(215 16% 55%)', transition: 'all 0.2s' }}
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Colonne droite ─────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Statut */}
                <div className="card">
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Statut</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { value: 'active', label: '✅ Publié', desc: 'Visible par les clients' },
                      { value: 'draft', label: '📝 Brouillon', desc: 'Non visible' },
                    ].map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: form.status === opt.value ? '2px solid hsl(221 83% 53%)' : '1px solid hsl(214 32% 91%)', background: form.status === opt.value ? 'hsl(221 83% 53% / 0.05)' : 'hsl(210 20% 98%)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="radio" name="status" value={opt.value} checked={form.status === opt.value} onChange={e => update('status', e.target.value)} style={{ display: 'none' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'hsl(215 16% 55%)' }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Inventaire */}
                <div className="card">
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Inventaire</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="label" htmlFor="stock">Quantité en stock *</label>
                      <input id="stock" type="number" placeholder="0" min="0" value={form.stock} onChange={e => update('stock', e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                      <label className="label" htmlFor="sku">Référence (SKU)</label>
                      <input id="sku" type="text" placeholder="EX: ROB-WAX-001" value={form.sku} onChange={e => update('sku', e.target.value)} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="label" htmlFor="weight">Poids (kg)</label>
                      <input id="weight" type="number" placeholder="0.5" min="0" step="0.1" value={form.weight} onChange={e => update('weight', e.target.value)} className="input" />
                    </div>
                  </div>
                </div>

                {/* Catégorie */}
                <div className="card">
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16 }}>Catégorie</h3>
                  <select value={form.category_id} onChange={e => update('category_id', e.target.value)} className="input">
                    <option value="">-- Sélectionner --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tips */}
                <div className="card" style={{ background: 'linear-gradient(145deg, hsl(221 83% 53% / 0.05), hsl(221 83% 53% / 0.02))', borderColor: 'hsl(221 83% 53% / 0.2)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(221 83% 53%)', marginBottom: 10 }}>💡 Conseils pour vendre plus</p>
                  <ul style={{ fontSize: '0.75rem', color: 'hsl(222 47% 20%)', lineHeight: 1.8, paddingLeft: 16 }}>
                    <li>Ajoutez min. 3 photos de qualité</li>
                    <li>Description détaillée = +60% de ventes</li>
                    <li>Indiquez un prix barré pour attirer</li>
                    <li>Mettez le stock à jour régulièrement</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
          <div style={{ height: 150 }} />
        </div>

        {/* Barre d'actions fixe (style Shopify / Jumia) */}
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--bottom-nav-height, 64px) + var(--safe-bottom, 0px))', zIndex: 900, background: 'white', borderTop: '1px solid hsl(214 32% 91%)', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)', padding: '10px 14px' }}>
          {draftSavedAt && (
            <div style={{ fontSize: '0.7rem', color: '#16a34a', textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>
              ✓ Brouillon enregistré automatiquement à {draftSavedAt}
              <button type="button" onClick={clearDraft} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#dc2626', fontSize: '0.7rem', textDecoration: 'underline' }}>Effacer</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, maxWidth: 1000, margin: '0 auto' }}>
            <button type="button" disabled={loading} onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')} style={{ flex: 1, minHeight: 50, borderRadius: 12, border: '2px solid #2563eb', background: 'white', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
              Brouillon
            </button>
            <button type="button" disabled={loading} onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'active')} style={{ flex: 2, minHeight: 50, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', fontWeight: 800, fontSize: '1rem', boxShadow: '0 6px 16px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Enregistrement...</> : <><Save size={18} /> Enregistrer et publier</>}
            </button>
          </div>
        </div>
      </main>

      {/* Modal du catalogue */}
      <CatalogModal 
        isOpen={isCatalogOpen} 
        onClose={() => setIsCatalogOpen(false)} 
        onSelect={handleCatalogSelect} 
      />
    </div>
  )
}
