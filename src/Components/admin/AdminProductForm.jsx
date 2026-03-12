import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const CATEGORIES = [
  { value: 'Board',        label: 'Boites' },
  { value: 'Bags',         label: 'Sacs' },
  { value: 'Autocollants', label: 'Cartes' },
  { value: 'Paper',        label: 'Papier' },
]

const DOUBLE_PRINT_CATS = ['Bags', 'Paper', 'Autocollants']

const EMPTY = {
  name: '', category: 'Board',
  sizes: [{ size: '', price: '' }],
  colors: [], doubleSided: false, doubleSidedPrice: '', images: [],
}

const inputCls = err =>
  `w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-purple-100'}`

function AdminProductForm({ initialData, onSuccess, onCancel }) {
  const isEditing = !!initialData
  const [form, setForm] = useState(() => {
    if (!initialData) return EMPTY
    return {
      name: initialData.name || '',
      category: initialData.category || 'Board',
      sizes: initialData.sizes?.length > 0
        ? initialData.sizes.map(s => ({ size: String(s.size), price: String(s.price ?? '') }))
        : [{ size: '', price: '' }],
      colors: initialData.colors || [],
      doubleSided: initialData.doubleSided ?? DOUBLE_PRINT_CATS.includes(initialData.category),
      doubleSidedPrice: String(initialData.doubleSidedPrice ?? ''),
      images: initialData.images || [],
    }
  })
  const [colorInput, setColorInput] = useState('')
  const [errors, setErrors]         = useState({})
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [dragOver, setDragOver]     = useState(false)

  useEffect(() => {
    setForm(p => ({ ...p, doubleSided: DOUBLE_PRINT_CATS.includes(p.category) }))
  }, [form.category])

  const set = (key, val) => { setForm(p => ({ ...p, [key]: val })); if (errors[key]) setErrors(p => ({ ...p, [key]: '' })) }

  const addSize    = () => setForm(p => ({ ...p, sizes: [...p.sizes, { size: '', price: '' }] }))
  const removeSize = i  => setForm(p => ({ ...p, sizes: p.sizes.filter((_, idx) => idx !== i) }))
  const updateSize = (i, field, val) => setForm(p => ({ ...p, sizes: p.sizes.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))

  const addColor    = () => { const c = colorInput.trim(); if (c && !form.colors.includes(c)) setForm(p => ({ ...p, colors: [...p.colors, c] })); setColorInput('') }
  const removeColor = c  => setForm(p => ({ ...p, colors: p.colors.filter(x => x !== c) }))

  const uploadFiles = async files => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach(f => fd.append('images', f))
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const urls = res.data.urls || res.data
      setForm(p => ({ ...p, images: [...p.images, ...(Array.isArray(urls) ? urls : [urls])] }))
      toast.success('Image(s) uploadée(s)')
    } catch { toast.error('Erreur upload') }
    finally { setUploading(false) }
  }
  const removeImage = async url => {
    setForm(p => ({ ...p, images: p.images.filter(i => i !== url) }))
    try {
      await api.delete('/upload', { data: { url } })
    } catch (err) {
      console.error('Erreur suppression R2:', err)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.sizes.every(s => s.size.trim() && !isNaN(Number(s.price)) && Number(s.price) > 0))
      e.sizes = 'Chaque taille doit avoir un nom et un prix valide'
    if (form.doubleSided && (!form.doubleSidedPrice || isNaN(Number(form.doubleSidedPrice))))
      e.doubleSidedPrice = 'Prix requis'
    if (!isEditing && form.images.length === 0) e.images = 'Au moins une image requise'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        sizes: form.sizes.filter(s => s.size.trim()).map(s => ({ size: s.size, price: Number(s.price) })),
        doubleSidedPrice: form.doubleSided ? Number(form.doubleSidedPrice) : 0,
      }
      if (isEditing) { await api.put(`/products/${initialData._id}`, payload); toast.success('Produit mis à jour') }
      else           { await api.post('/products', payload);                    toast.success('Produit créé') }
      onSuccess?.()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur sauvegarde') }
    finally { setSaving(false) }
  }

  const labelCls = "block text-xs font-bold uppercase tracking-widest mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-7" noValidate>

      {/* Nom */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>Nom du produit *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Ex: Boite kraft personnalisée..."
          className={inputCls(errors.name)} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Catégorie */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>Catégorie *</label>
        <select value={form.category} onChange={e => set('category', e.target.value)}
          className={inputCls(false)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Tailles + Prix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls} style={{ color: NAVY }}>Tailles & Prix *</label>
          <button type="button" onClick={addSize}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ background: PURPLE }}>
            <Plus size={13} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {form.sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-3 rounded-xl border border-gray-200">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Taille</p>
                <input value={s.size} onChange={e => updateSize(i, 'size', e.target.value)}
                  placeholder="Ex: A4, 30×20..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm
                             outline-none focus:border-purple-400 transition-all" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Prix (DA)</p>
                <input type="number" min="0" value={s.price} onChange={e => updateSize(i, 'price', e.target.value)}
                  placeholder="1500"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm
                             outline-none focus:border-purple-400 transition-all" />
              </div>
              <button type="button" onClick={() => removeSize(i)}
                className="mt-5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
      </div>

      {/* Couleurs */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>
          Couleurs disponibles <span className="text-gray-400 font-normal" style={{ textTransform: 'none' }}>(optionnel)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input value={colorInput} onChange={e => setColorInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
            placeholder="Ex: Rouge, Noir..."
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm
                       outline-none focus:border-purple-400 transition-all" />
          <button type="button" onClick={addColor}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: PURPLE }}><Plus size={16} /></button>
        </div>
        {form.colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.colors.map(c => (
              <span key={c} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white font-medium"
                style={{ background: PURPLE }}>
                {c}
                <button type="button" onClick={() => removeColor(c)} className="opacity-70 hover:opacity-100"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Double impression */}
      <div className="rounded-2xl border-2 p-4 transition-all"
        style={{ borderColor: form.doubleSided ? PURPLE : '#e5e7eb', background: form.doubleSided ? 'rgba(124,58,237,0.04)' : '#f9fafb' }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative" onClick={() => set('doubleSided', !form.doubleSided)}>
            <div className="w-11 h-6 rounded-full transition-colors" style={{ background: form.doubleSided ? PURPLE : '#d1d5db' }}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.doubleSided ? 'left-5' : 'left-0.5'}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: NAVY }}>Impression des deux côtés</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {DOUBLE_PRINT_CATS.includes(form.category) ? 'Pré-activé pour cette catégorie' : 'Option disponible'}
            </p>
          </div>
        </label>
        {form.doubleSided && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PURPLE }}>
              Prix supplément double impression (DA) *
            </label>
            <input type="number" min="0" value={form.doubleSidedPrice}
              onChange={e => { set('doubleSidedPrice', e.target.value); setErrors(p => ({ ...p, doubleSidedPrice: '' })) }}
              placeholder="500"
              className={inputCls(errors.doubleSidedPrice)} />
            {errors.doubleSidedPrice && <p className="text-red-500 text-xs mt-1">{errors.doubleSidedPrice}</p>}
          </div>
        )}
      </div>

      {/* Images */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>Images {!isEditing && '*'}</label>
        <label className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed
                         rounded-2xl p-8 cursor-pointer transition-all
                         ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:border-purple-300'}
                         ${errors.images ? 'border-red-300 bg-red-50' : ''}
                         ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}>
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadFiles(e.target.files)} />
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: dragOver ? PURPLE : '#e5e7eb' }}>
            {uploading ? <Loader2 size={24} className="animate-spin" style={{ color: PURPLE }} />
                       : <Upload size={24} style={{ color: dragOver ? 'white' : '#9ca3af' }} />}
          </div>
          <p className="text-sm font-semibold text-gray-600">
            {uploading ? 'Upload en cours...' : 'Glisser ou cliquer pour uploader'}
          </p>
        </label>
        {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
        {form.images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={16} className="text-white" />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving || uploading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3
                     rounded-xl text-white font-bold text-sm transition-all hover:opacity-90
                     disabled:opacity-50 shadow-lg"
          style={{ background: PURPLE }}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : (isEditing ? 'Mettre à jour' : 'Créer le produit')}
        </button>
        {onCancel && (
          <button type="button" onClick={async () => {
            // Supprimer les images uploadées pendant cette session si on annule
            // (images qui n'existaient pas avant = nouvelles images ajoutées sans sauvegarder)
            if (!isEditing) {
              // Nouveau produit annulé → supprimer toutes les images uploadées
              await Promise.all(form.images.map(url =>
                api.delete('/upload', { data: { url } }).catch(() => {})
              ))
            } else {
              // Édition annulée → supprimer uniquement les nouvelles images ajoutées
              const originalImages = initialData.images || []
              const newImages = form.images.filter(url => !originalImages.includes(url))
              await Promise.all(newImages.map(url =>
                api.delete('/upload', { data: { url } }).catch(() => {})
              ))
            }
            onCancel()
          }}
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-500
                       font-semibold text-sm hover:bg-gray-50 transition-all">
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}

export default AdminProductForm