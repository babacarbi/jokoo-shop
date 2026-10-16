'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import {
  ArrowLeft, Upload, X, Plus, Loader2, Package,
  ImagePlus, Trash2, Save, Eye, AlertCircle
} from 'lucide-react'

interface ImagePreview { file?: File; url: string; id?: string }

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

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const resolvedParams = use(params)
  const productId = resolvedParams.id
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [images, setImages] = useState<ImagePreview[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    stock: '', sku: '', category_id: '', status: 'draft' as 'draft' | 'active',
    weight: ''
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    loadProduct()
  }, [])

  async function loadProduct() {
    setLoading(true)
    const { getMyShopAction } = await import('@/app/actions')
    const shop = await getMyShopAction()
    if (!shop) {
      router.push('/merchant/dashboard')
      return
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', productId)
      .eq('shop_id', shop.id)
      .single()

    if (productError || !product) {
      setError('Produit introuvable')
      setLoading(false)
      return
    }

    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? String(product.price) : '',
      compare_price: product.compare_price ? String(product.compare_price) : '',
      stock: product.stock !== null ? String(product.stock) : '',
      sku: product.sku || '',
      category_id: product.category_id || '',
      status: product.status as 'draft' | 'active',
      weight: product.weight ? String(product.weight) : ''
    })

    if (product.product_images) {
      const existingImages = product.product_images.sort((a: any, b: any) => a.position - b.position).map((img: any) => ({
        id: img.id,
        url: img.url
      }))
      setImages(existingImages)
    }

    setLoading(false)
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
      const img = prev[index]
      if (img.id) {
        setDeletedImageIds(d => [...d, img.id!])
      } else {
        URL.revokeObjectURL(img.url)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // ── Upload image vers Supabase Storage ──────────────────
  async function uploadImage(file: File, shopId: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const filename = `${shopId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { contentType: file.type, upsert: false })

    if (error) {
      console.error("Erreur Storage:", error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return publicUrl
  }

  // ── Soumission du formulaire ─────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock) {
      setError('Remplissez au minimum : nom, prix et stock')
      return
    }
    setSaving(true)
    setError('')

    try {
      const { getMyShopAction } = await import('@/app/actions')
      const shop = await getMyShopAction()
      if (!shop) {
        setError('Boutique introuvable.')
        setSaving(false)
        return
      }

      // Mettre à jour le produit
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: form.name,
          slug: slugify(form.name),
          description: form.description || null,
          price: parseFloat(form.price),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          stock: parseInt(form.stock),
          sku: form.sku || null,
          category_id: form.category_id || null,
          status: form.status,
          weight: form.weight ? parseFloat(form.weight) : null,
        })
        .eq('id', productId)
        .eq('shop_id', shop.id)

      if (productError) { setError('Erreur lors de la modification : ' + productError.message); setSaving(false); return }

      // Supprimer les images retirées
      if (deletedImageIds.length > 0) {
        await supabase.from('product_images').delete().in('id', deletedImageIds)
      }

      // Uploader les nouvelles images
      const newImages = images.filter(img => img.file)
      if (newImages.length > 0) {
        const existingCount = images.filter(img => !img.file).length
        const uploadedUrls = await Promise.all(newImages.map(img => uploadImage(img.file!, shop.id)))
        
        if (uploadedUrls.includes(null)) {
          setError("L'upload des images a échoué (Vérifiez les permissions de votre bucket Storage 'product-images').")
          setSaving(false)
          return
        }

        const validUrls = uploadedUrls.filter(Boolean) as string[]

        if (validUrls.length > 0) {
          const { error: imageError } = await supabase.from('product_images').insert(
            validUrls.map((url, i) => ({ product_id: productId, url, position: existingCount + i }))
          )
          if (imageError) {
            console.error("Erreur images:", imageError)
            setError('Le produit a été mis à jour, mais l\'ajout des images a échoué (Problème de permissions RLS).')
            setSaving(false)
            return
          }
        }
      }

      setSuccess('✅ Produit mis à jour avec succès !')
      setTimeout(() => router.push('/merchant/products'), 1800)
    } catch {
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="merchant-page-wrapper">
        <main className="merchant-content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={30} className="animate-spin" color="hsl(221 83% 53%)" />
        </main>
      </div>
    )
  }

  return (
    <div className="merchant-page-wrapper">
      {/* Sidebar simplifiée */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid hsl(214 32% 91%)' }}>
          <Link href="/merchant/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'hsl(222 47% 11%)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(221 83% 53%))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px hsl(25 95% 53% / 0.3)' }}>
              <Package size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Mes Produits</span>
          </Link>
        </div>
        <nav style={{ padding: 12, flex: 1 }}>
          {[
            { href: '/merchant/dashboard', label: 'Dashboard' },
            { href: '/merchant/products', label: 'Tous les produits', active: true },
            { href: '/merchant/products/new', label: '+ Nouveau produit' },
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
            <h2 className="merchant-mobile-header-title">Modifier le produit</h2>
          </div>
          <button form="product-form" type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ padding: '8px 12px', minHeight: 38 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          </button>
        </div>

        {/* Desktop Topbar */}
        <div className="merchant-desktop-topbar" style={{ background: 'white', borderBottom: '1px solid hsl(214 32% 91%)', padding: '0 28px', height: 64, alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Link href="/merchant/products" className="btn btn-ghost btn-icon" style={{ background: 'hsl(210 20% 98%)', color: 'hsl(222 47% 11%)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'hsl(222 47% 11%)' }}>Modifier le produit</h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 16% 55%)' }}>Modifiez les informations de votre produit</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button form="product-form" type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Save size={15} /> Enregistrer les modifications</>}
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
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
