// src/pages/staff/StockPage.jsx
// Page stock volontairement dépouillée : trois chiffres, la liste des
// matières, et un formulaire d'ajout replié tant qu'on n'en a pas besoin.

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Boxes, Loader2, Plus, ImagePlus, Trash2, X, Eye, ArrowLeft, ChevronDown,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { uploadToCloudinary } from '../../utils/uploadCloudinary'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canWriteStock, NAVY, PURPLE, thumb } from '../../Components/staff/staffConfig'
import { PageHeader } from '../../Components/staff/StageBoard'

const field = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors'
const label = 'block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400'

/* ── Ajout d'une matière — replié par défaut ── */
function AddMaterialForm({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'unité', lowStockThreshold: '5' })
  const [image, setImage]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const fileRef = useRef(null)

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Images uniquement')
    setUploading(true)
    try {
      setImage(await uploadToCloudinary(file))
      toast.success('Image ajoutée')
    } catch (err) {
      toast.error(err.message || 'Erreur upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Nom de la matière requis')
    setSaving(true)
    try {
      await staffApi.post('/stock', {
        name: form.name.trim(),
        quantity: Number(form.quantity) || 0,
        unit: form.unit.trim() || 'unité',
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        image,
      })
      toast.success('Matière ajoutée')
      setForm({ name: '', quantity: '', unit: 'unité', lowStockThreshold: '5' })
      setImage(''); setOpen(false)
      onAdded()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-dashed transition-all hover:bg-purple-50"
        style={{ borderColor: 'rgba(124,58,237,0.35)', color: PURPLE }}>
        <Plus size={16} /> Ajouter une matière première
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-black text-sm" style={{ color: NAVY }}>Nouvelle matière</p>
        <button type="button" onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <ChevronDown size={16} />
        </button>
      </div>

      <div>
        <label className={label}>Nom *</label>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="ex : Carton kraft, Bobine adhésive…" className={field} style={{ color: NAVY }} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={label}>Quantité</label>
          <input type="number" min="0" value={form.quantity}
            onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
            placeholder="0" className={field} style={{ color: NAVY }} />
        </div>
        <div>
          <label className={label}>Unité</label>
          <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
            placeholder="kg, m, rouleau…" className={field} style={{ color: NAVY }} />
        </div>
        <div>
          <label className={label}>Alerte sous</label>
          <input type="number" min="0" value={form.lowStockThreshold}
            onChange={e => setForm(p => ({ ...p, lowStockThreshold: e.target.value }))}
            className={field} style={{ color: NAVY }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage}
          className="hidden" id="material-image" />
        {image ? (
          <div className="relative">
            <img src={thumb(image, 96)} alt="" width={48} height={48}
              className="w-12 h-12 rounded-xl object-cover border-2"
              style={{ borderColor: 'rgba(124,58,237,0.25)' }} />
            <button type="button" onClick={() => setImage('')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
              style={{ background: '#ef4444' }}>
              <X size={11} color="white" />
            </button>
          </div>
        ) : (
          <label htmlFor="material-image"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
            {uploading
              ? <><Loader2 size={13} className="animate-spin" /> Envoi…</>
              : <><ImagePlus size={13} /> Photo (optionnel)</>}
          </label>
        )}

        <button type="submit" disabled={saving || uploading}
          className="ml-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: PURPLE }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Ajouter
        </button>
      </div>
    </form>
  )
}

/* ── Ligne d'une matière ── */
function MaterialRow({ material, canWrite, onChanged }) {
  const [add, setAdd]   = useState('')
  const [busy, setBusy] = useState(false)
  const low = material.quantity <= material.lowStockThreshold

  const restock = async () => {
    const q = Number(add)
    if (!q || q <= 0) return toast.error('Quantité invalide')
    setBusy(true)
    try {
      await staffApi.patch(`/stock/${material._id}/restock`, { quantity: q })
      toast.success(`+${q} ${material.unit}`)
      setAdd(''); onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!window.confirm(`Supprimer « ${material.name} » du stock ?`)) return
    try {
      await staffApi.delete(`/stock/${material._id}`)
      toast.success('Matière supprimée'); onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ borderColor: low ? '#fecaca' : '#f0f0f4', background: low ? '#fef2f2' : 'white' }}>
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: '#f5f3ff' }}>
        {material.image
          ? <img src={thumb(material.image, 96)} alt="" width={44} height={44}
              className="w-full h-full object-cover" loading="lazy" decoding="async" />
          : <Boxes size={18} style={{ color: 'rgba(124,58,237,0.4)' }} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{material.name}</p>
        <p className="text-xs">
          <span className="font-black" style={{ color: low ? '#ef4444' : '#059669' }}>
            {material.quantity}
          </span>
          <span className="text-gray-400"> {material.unit}</span>
          {low && <span className="ml-2 font-bold" style={{ color: '#ef4444' }}>· stock bas</span>}
        </p>
      </div>

      {canWrite && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input type="number" min="0" value={add} onChange={e => setAdd(e.target.value)} placeholder="+"
            className="w-14 px-2 py-1.5 rounded-lg border-2 border-gray-200 text-sm outline-none focus:border-purple-400"
            style={{ color: NAVY }} />
          <button onClick={restock} disabled={busy} title="Réapprovisionner"
            className="p-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#10b981' }}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
          <button onClick={remove} title="Supprimer"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// Destinations autorisées pour le bouton retour (évite une redirection
// arbitraire depuis l'URL)
const RETOURS = {
  designer:      '/designer',
  confirmatrice: '/confirmatrice',
  production:    '/production',
  insolation:    '/insolation',
  emballage:     '/emballage',
  chef:          '/chef',
  staff:         '/staff',
}

// Services qui consultent le stock sans pouvoir le modifier. En accès libre
// les rôles n'existent plus (tout le monde passe pour un superadmin) : c'est
// l'origine de la visite qui détermine les droits appliqués.
const ORIGINES_LECTURE_SEULE = ['designer', 'confirmatrice', 'insolation', 'emballage', 'production']

function StockPage() {
  const { role } = useStaffAuth()
  const [searchParams] = useSearchParams()
  const from   = searchParams.get('from')
  const backTo = RETOURS[from] || null

  const canWrite = canWriteStock(role) && !ORIGINES_LECTURE_SEULE.includes(from)
  const [materials, setMaterials] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    try {
      const [mats, st] = await Promise.all([
        staffApi.get('/stock'),
        staffApi.get('/stock/stats'),
      ])
      setMaterials(mats.data || [])
      setStats(st.data || null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur chargement stock')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {backTo && (
        <Link to={backTo}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-purple-50"
          style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
          <ArrowLeft size={15} /> Retour
        </Link>
      )}

      <PageHeader eyebrow="Matières premières" title="Stock" />

      {!canWrite && (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <Eye size={13} /> Consultation seule
        </div>
      )}

      {/* L'essentiel en trois chiffres */}
      <div className="flex gap-2">
        {[
          { label: 'Matières',  value: stats?.totalMaterials ?? 0, color: NAVY },
          { label: 'Unités',    value: (stats?.totalUnits ?? 0).toLocaleString('fr-DZ'), color: '#059669' },
          { label: 'Stock bas', value: stats?.lowStockCount ?? 0, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white rounded-xl px-3 py-2.5 border border-gray-100 text-center">
            <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {canWrite && <AddMaterialForm onAdded={load} />}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : materials.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          Aucune matière en stock{canWrite ? ' — ajoutez-en une ci-dessus.' : '.'}
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map(m => (
            <MaterialRow key={m._id} material={m} canWrite={canWrite} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  )
}

export default StockPage
