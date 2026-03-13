import { useState, useEffect, useRef } from 'react'
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

// Palette de couleurs prédéfinies
const PRESET_COLORS = [
  { hex: '#000000', fr: 'Noir',        ar: 'أسود' },
  { hex: '#FFFFFF', fr: 'Blanc',       ar: 'أبيض' },
  { hex: '#EF4444', fr: 'Rouge',       ar: 'أحمر' },
  { hex: '#3B82F6', fr: 'Bleu',        ar: 'أزرق' },
  { hex: '#22C55E', fr: 'Vert',        ar: 'أخضر' },
  { hex: '#EAB308', fr: 'Jaune',       ar: 'أصفر' },
  { hex: '#F97316', fr: 'Orange',      ar: 'برتقالي' },
  { hex: '#EC4899', fr: 'Rose',        ar: 'وردي' },
  { hex: '#A855F7', fr: 'Violet',      ar: 'بنفسجي' },
  { hex: '#92400E', fr: 'Marron',      ar: 'بني' },
  { hex: '#6B7280', fr: 'Gris',        ar: 'رمادي' },
  { hex: '#D97706', fr: 'Doré',        ar: 'ذهبي' },
  { hex: '#94A3B8', fr: 'Argenté',     ar: 'فضي' },
  { hex: '#1E3A8A', fr: 'Bleu marine', ar: 'أزرق داكن' },
  { hex: '#7F1D1D', fr: 'Bordeaux',    ar: 'بوردو' },
  { hex: '#0D9488', fr: 'Turquoise',   ar: 'تركوازي' },
  { hex: '#F5E6C8', fr: 'Beige',       ar: 'بيج' },
  { hex: '#8B5CF6', fr: 'Lavande',     ar: 'لافندر' },
]

const EMPTY = {
  name: '', category: 'Board',
  sizes: [{ size: '', price: '' }],
  colors: [], numberOfColors: '', doubleSided: false, doubleSidedPrice: '', images: [],
}

const inputCls = err =>
  `w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-purple-100'}`

// Refs pour le scroll-to-error
const fieldOrderAdmin = ['name', 'sizes', 'doubleSidedPrice', 'images']

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
      numberOfColors: initialData.numberOfColors != null ? String(initialData.numberOfColors) : '',
      doubleSided: initialData.doubleSided ?? DOUBLE_PRINT_CATS.includes(initialData.category),
      doubleSidedPrice: String(initialData.doubleSidedPrice ?? ''),
      images: initialData.images || [],
    }
  })
  const [errors, setErrors]         = useState({})
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const fieldRefs = useRef({})

  useEffect(() => {
    setForm(p => ({ ...p, doubleSided: DOUBLE_PRINT_CATS.includes(p.category) }))
  }, [form.category])

  const set = (key, val) => { setForm(p => ({ ...p, [key]: val })); if (errors[key]) setErrors(p => ({ ...p, [key]: '' })) }

  const addSize    = () => setForm(p => ({ ...p, sizes: [...p.sizes, { size: '', price: '' }] }))
  const removeSize = i  => setForm(p => ({ ...p, sizes: p.sizes.filter((_, idx) => idx !== i) }))
  const updateSize = (i, field, val) => setForm(p => ({ ...p, sizes: p.sizes.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))

  const toggleColor = (hex) => setForm(p => ({
    ...p,
    colors: p.colors.includes(hex) ? p.colors.filter(c => c !== hex) : [...p.colors, hex],
  }))

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
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll vers le premier champ en erreur
      const firstErr = fieldOrderAdmin.find(k => errs[k])
      if (firstErr && fieldRefs.current[firstErr]) {
        fieldRefs.current[firstErr].scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = fieldRefs.current[firstErr].querySelector('input,select,textarea')
        if (input) setTimeout(() => input.focus(), 350)
      }
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        sizes: form.sizes.filter(s => s.size.trim()).map(s => ({ size: s.size, price: Number(s.price) })),
        numberOfColors: form.numberOfColors !== '' ? Number(form.numberOfColors) : null,
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
      <div ref={el => { if (el) fieldRefs.current['name'] = el }}>
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
      <div ref={el => { if (el) fieldRefs.current['sizes'] = el }}>
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

      {/* Couleurs disponibles */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>
          Couleurs disponibles <span className="text-gray-400 font-normal" style={{ textTransform: 'none' }}>(optionnel)</span>
        </label>
        <div className="grid grid-cols-9 gap-2 p-3 rounded-xl border-2 border-gray-200 bg-gray-50">
          {PRESET_COLORS.map(({ hex, fr }) => {
            const selected = form.colors.includes(hex)
            const isWhite  = hex === '#FFFFFF'
            return (
              <button key={hex} type="button" title={fr}
                onClick={() => toggleColor(hex)}
                className="relative flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: hex,
                    border: isWhite ? '2px solid #e5e7eb' : selected ? `3px solid ${PURPLE}` : '2px solid transparent',
                    boxShadow: selected ? `0 0 0 2px ${PURPLE}40` : 'none',
                    transform: selected ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
                {selected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke={isWhite ? '#7c3aed' : 'white'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <span className="text-[9px] text-gray-400 text-center leading-tight max-w-[32px] truncate">{fr}</span>
              </button>
            )
          })}
        </div>
        {form.colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.colors.map(hex => {
              const preset = PRESET_COLORS.find(p => p.hex === hex)
              return (
                <span key={hex} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                  style={{ background: `${hex}20`, borderColor: hex === '#FFFFFF' ? '#e5e7eb' : hex, color: NAVY }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200" style={{ background: hex }} />
                  {preset?.fr || hex}
                  <button type="button" onClick={() => toggleColor(hex)} className="opacity-60 hover:opacity-100 ml-0.5"><X size={10} /></button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Nombre de couleurs dans le design */}
      <div>
        <label className={labelCls} style={{ color: NAVY }}>
          Nombre de couleurs dans le design <span className="text-gray-400 font-normal" style={{ textTransform: 'none' }}>(optionnel)</span>
        </label>
        <input
          type="number" min="1" max="12"
          value={form.numberOfColors}
          onChange={e => set('numberOfColors', e.target.value)}
          placeholder="Ex: 2"
          className={inputCls(false)}
        />
        <p className="text-xs text-gray-400 mt-1">Le client pourra saisir le nombre de couleurs souhaité dans son design.</p>
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
      <div ref={el => { if (el) fieldRefs.current['images'] = el }}>
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