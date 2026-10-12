// src/pages/staff/StockPage.jsx
// Le stock, pensé pour un usage d'atelier :
//   - chaque matière est une carte avec sa PHOTO en grand — plusieurs matières
//     portent le même nom (même sac, autre couleur), c'est elle qui les distingue ;
//   - trois gestes clairs : Entrée (réception), Sortie (casse, perte) et
//     Inventaire (on saisit ce qu'on a réellement compté) ;
//   - recherche, filtre « à réapprovisionner », et l'historique de chaque
//     matière pour savoir qui a pris quoi.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Boxes, Loader2, Plus, Minus, ImagePlus, Trash2, X, Eye, ArrowLeft, Search,
  Pencil, History, ClipboardCheck, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  PackageX, ListFilter,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { uploadToCloudinary } from '../../utils/uploadCloudinary'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canWriteStock, NAVY, PURPLE, thumb, shortRef } from '../../Components/staff/staffConfig'
import { PageHeader } from '../../Components/staff/StageBoard'

const field = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors bg-white'
const label = 'block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400'

const fmt = (n) => Number(n || 0).toLocaleString('fr-DZ')

// Photo en grand : entière (non recadrée) mais allégée par Cloudinary
const large = (url) =>
  typeof url === 'string' && url.includes('/image/upload/') && !/\/upload\/[a-z]+_/.test(url)
    ? url.replace('/image/upload/', '/image/upload/w_1200,c_limit,q_auto,f_auto/')
    : url

/* ── État d'une matière ── */
const STATUS = {
  rupture: { label: 'Rupture',   color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  bas:     { label: 'Stock bas', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ok:      { label: 'En stock',  color: '#059669', bg: '#ecfdf5', border: '#f0f0f4' },
}
const statusOf = (m) =>
  m.quantity <= 0 ? 'rupture' : m.quantity <= (m.lowStockThreshold || 0) ? 'bas' : 'ok'

/* ── Les trois gestes sur le stock ── */
const MOVES = {
  in:  { title: 'Entrée de stock',  verb: 'Ajouter au stock',   color: '#10b981', hint: 'Réception de marchandise',
         placeholder: 'Motif (optionnel) — ex : livraison fournisseur' },
  out: { title: 'Sortie de stock',  verb: 'Retirer du stock',   color: '#ef4444', hint: 'Casse, perte, échantillon… hors commande',
         placeholder: 'Motif (optionnel) — ex : sacs abîmés' },
  set: { title: 'Inventaire',       verb: 'Enregistrer le comptage', color: PURPLE, hint: 'Saisissez la quantité réellement comptée',
         placeholder: 'Remarque (optionnel)' },
}
const QUICK = [50, 100, 500, 1000]

/* ══════════════════════════════════════════════
   Mouvement de stock (entrée / sortie / inventaire)
══════════════════════════════════════════════ */
function MoveForm({ material, type, onDone, onCancel }) {
  const cfg = MOVES[type]
  const [qty, setQty]   = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [type])

  const q = Number(qty)
  const filled = qty !== '' && Number.isFinite(q) && q >= 0
  const after = !filled ? null
    : type === 'in' ? material.quantity + q
    : type === 'out' ? material.quantity - q
    : q
  const tooMuch = type === 'out' && filled && q > material.quantity
  const invalid = !filled || (type !== 'set' && q === 0) || tooMuch
    || (type === 'set' && q === material.quantity)

  const submit = async (e) => {
    e.preventDefault()
    if (invalid) return
    setBusy(true)
    try {
      const res = await staffApi.post(`/stock/${material._id}/move`, { type, quantity: q, note })
      toast.success(type === 'in' ? `+${fmt(q)} ${material.unit}`
        : type === 'out' ? `−${fmt(q)} ${material.unit}`
        : `Stock corrigé : ${fmt(q)} ${material.unit}`)
      onDone(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="p-3 rounded-xl space-y-2.5" style={{ background: cfg.color + '0f' }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black" style={{ color: cfg.color }}>{cfg.title}</p>
          <p className="text-[11px] text-gray-400">{cfg.hint}</p>
        </div>
        <button type="button" onClick={onCancel} title="Fermer"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-white transition-colors">
          <X size={15} />
        </button>
      </div>

      <input ref={inputRef} type="number" min="0" inputMode="numeric" value={qty}
        onChange={e => setQty(e.target.value)}
        placeholder={type === 'set' ? 'Quantité comptée' : 'Quantité'}
        className="w-full px-3 py-2.5 rounded-xl border-2 text-lg font-black outline-none bg-white transition-colors"
        style={{ borderColor: tooMuch ? '#fca5a5' : '#e5e7eb', color: NAVY }} />

      {/* Raccourcis : les quantités se comptent par centaines */}
      {type !== 'set' && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map(n => (
            <button key={n} type="button" onClick={() => setQty(String((Number(qty) || 0) + n))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border transition-all hover:opacity-80"
              style={{ borderColor: cfg.color + '55', color: cfg.color }}>
              +{fmt(n)}
            </button>
          ))}
          {qty !== '' && (
            <button type="button" onClick={() => setQty('')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-gray-400 hover:bg-white transition-all">
              Effacer
            </button>
          )}
        </div>
      )}

      <input value={note} onChange={e => setNote(e.target.value)} maxLength={200}
        placeholder={cfg.placeholder}
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none bg-white focus:border-purple-400 transition-colors"
        style={{ color: NAVY }} />

      {/* Avant → après : on voit le résultat avant de valider */}
      <p className="text-xs" style={{ color: tooMuch ? '#ef4444' : '#6b7280' }}>
        {tooMuch
          ? `Impossible : il n'y a que ${fmt(material.quantity)} ${material.unit} en stock.`
          : after == null
            ? `Actuellement : ${fmt(material.quantity)} ${material.unit}`
            : <>
                {fmt(material.quantity)} → <span className="font-black" style={{ color: NAVY }}>{fmt(after)}</span> {material.unit}
                {type === 'set' && q !== material.quantity && (
                  <span> (écart {q > material.quantity ? '+' : '−'}{fmt(Math.abs(q - material.quantity))})</span>
                )}
              </>}
      </p>

      <button type="submit" disabled={busy || invalid}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
        style={{ background: cfg.color }}>
        {busy && <Loader2 size={14} className="animate-spin" />}
        {cfg.verb}
      </button>
    </form>
  )
}

/* ══════════════════════════════════════════════
   Journal des mouvements (d'une matière, ou de tout le stock)
══════════════════════════════════════════════ */
function Movements({ materialId = null, limit = 15, showName = false }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    let alive = true
    setRows(null)
    staffApi.get('/stock/movements', { params: { limit, ...(materialId ? { material: materialId } : {}) } })
      .then(r => { if (alive) setRows(r.data || []) })
      .catch(() => { if (alive) setRows([]) })
    return () => { alive = false }
  }, [materialId, limit])

  if (rows === null) {
    return (
      <p className="flex items-center gap-2 text-xs text-gray-400 py-3">
        <Loader2 size={13} className="animate-spin" /> Chargement de l'historique…
      </p>
    )
  }
  if (rows.length === 0) return <p className="text-xs text-gray-400 italic py-3">Aucun mouvement enregistré.</p>

  return (
    <div className="divide-y divide-gray-100">
      {rows.map(m => {
        // Un inventaire peut corriger dans les deux sens : `delta` porte le signe
        const sign = m.type === 'in' ? 1 : m.type === 'out' ? -1
          : (m.delta != null ? Math.sign(m.delta) : 0)
        const color = sign > 0 ? '#059669' : sign < 0 ? '#ef4444' : '#6b7280'
        const Icon  = m.type === 'adjust' ? ClipboardCheck : sign > 0 ? ArrowDownCircle : ArrowUpCircle
        return (
          <div key={m._id} className="flex items-start gap-2.5 py-2">
            <Icon size={15} className="flex-shrink-0 mt-0.5" style={{ color }} />
            <div className="min-w-0 flex-1">
              {showName && (
                <p className="text-xs font-bold truncate text-left" dir="auto" style={{ color: NAVY }}>{m.materialName}</p>
              )}
              <p className="text-xs break-words" style={{ color: '#4b5563' }}>
                {m.note || (m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Inventaire')}
                {m.order && (
                  <span className="ml-1 font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: '#f5f3ff', color: PURPLE }}>
                    #{shortRef(m.order)}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-gray-400">
                {new Date(m.createdAt).toLocaleString('fr-FR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                {m.by ? ` · ${m.by}` : ''}
              </p>
            </div>
            <span className="text-sm font-black flex-shrink-0" style={{ color }}>
              {sign > 0 ? '+' : sign < 0 ? '−' : '±'}{fmt(m.quantity)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════
   Création / modification d'une matière
══════════════════════════════════════════════ */
function MaterialForm({ material = null, onClose, onSaved }) {
  const isEdit = !!material
  const [form, setForm] = useState({
    name: material?.name || '',
    variant: material?.variant || '',
    unit: material?.unit || 'unité',
    lowStockThreshold: String(material?.lowStockThreshold ?? 5),
    quantity: '',
    note: material?.note || '',
  })
  const [image, setImage]         = useState(material?.image || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const fileRef = useRef(null)
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Images uniquement')
    setUploading(true)
    try { setImage(await uploadToCloudinary(file)) }
    catch (err) { toast.error(err.message || 'Erreur lors de l\'envoi') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Le nom est requis')
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(), variant: form.variant.trim(),
        unit: form.unit.trim() || 'unité',
        lowStockThreshold: Math.max(0, Number(form.lowStockThreshold) || 0),
        note: form.note.trim(), image,
      }
      const res = isEdit
        ? await staffApi.patch(`/stock/${material._id}`, body)
        : await staffApi.post('/stock', { ...body, quantity: Math.max(0, Number(form.quantity) || 0) })
      toast.success(isEdit ? 'Matière modifiée' : 'Matière ajoutée')
      onSaved(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(30,27,75,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <p className="font-black text-sm" style={{ color: NAVY }}>
            {isEdit ? 'Modifier la matière' : 'Nouvelle matière'}
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Photo : c'est elle qui fait reconnaître la matière d'un coup d'œil */}
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" id="material-image" />
            <label htmlFor="material-image"
              className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer border-2 border-dashed text-[11px] font-bold transition-all hover:opacity-80"
              style={{ borderColor: 'rgba(124,58,237,0.35)', color: PURPLE, background: '#faf9ff' }}>
              {uploading ? <Loader2 size={20} className="animate-spin" />
                : image ? <img src={thumb(image, 200)} alt="" className="w-full h-full object-cover" />
                : <><ImagePlus size={20} /> Photo</>}
            </label>
            <div className="text-xs text-gray-400">
              <p>Une photo aide à reconnaître la matière, surtout quand plusieurs portent le même nom.</p>
              {image && (
                <button type="button" onClick={() => setImage('')}
                  className="mt-1 font-bold hover:underline" style={{ color: '#ef4444' }}>
                  Retirer la photo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={label}>Nom *</label>
            <input value={form.name} onChange={set('name')} dir="auto" autoFocus={!isEdit}
              placeholder="ex : Sac de livraison 30*40" className={field} style={{ color: NAVY }} />
          </div>

          <div>
            <label className={label}>Couleur / variante</label>
            <input value={form.variant} onChange={set('variant')} dir="auto"
              placeholder="ex : Blanc, Noir, Rose…" className={field} style={{ color: NAVY }} />
            <p className="text-[11px] text-gray-400 mt-1">
              Distingue deux matières du même nom dans toutes les listes.
            </p>
          </div>

          <div className={`grid gap-2 ${isEdit ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {!isEdit && (
              <div>
                <label className={label}>Quantité</label>
                <input type="number" min="0" value={form.quantity} onChange={set('quantity')}
                  placeholder="0" className={field} style={{ color: NAVY }} />
              </div>
            )}
            <div>
              <label className={label}>Unité</label>
              <input value={form.unit} onChange={set('unit')} placeholder="unité, kg, rouleau…"
                className={field} style={{ color: NAVY }} />
            </div>
            <div>
              <label className={label}>Alerte sous</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')}
                className={field} style={{ color: NAVY }} />
            </div>
          </div>
          {isEdit && (
            <p className="text-[11px] text-gray-400 -mt-1">
              La quantité se change avec Entrée, Sortie ou Inventaire, pour garder une trace.
            </p>
          )}

          <div>
            <label className={label}>Remarque</label>
            <input value={form.note} onChange={set('note')} dir="auto" maxLength={200}
              placeholder="Fournisseur, emplacement… (optionnel)" className={field} style={{ color: NAVY }} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PURPLE }}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Ajouter au stock'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all">
              Annuler
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ══════════════════════════════════════════════
   Carte d'une matière
══════════════════════════════════════════════ */
function MaterialCard({ material, canWrite, ambiguous, onUpdated, onEdit, onDeleted, onZoom }) {
  const [panel, setPanel] = useState(null)      // 'in' | 'out' | 'set' | 'history' | null
  const st  = STATUS[statusOf(material)]
  const toggle = (p) => setPanel(cur => cur === p ? null : p)

  const remove = async () => {
    if (!window.confirm(`Supprimer « ${material.name}${material.variant ? ` — ${material.variant}` : ''} » du stock ?\n\nSon historique sera conservé.`)) return
    try {
      await staffApi.delete(`/stock/${material._id}`)
      toast.success('Matière supprimée')
      onDeleted(material._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const iconBtn = 'p-2 rounded-lg transition-all'

  return (
    <div className="bg-white rounded-2xl border-2 overflow-hidden flex flex-col"
      style={{ borderColor: st.border }}>

      <div className="flex gap-3 p-3">
        {/* Photo — on clique pour la voir en grand */}
        <button type="button" onClick={() => material.image && onZoom(material)}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: '#f5f3ff', cursor: material.image ? 'zoom-in' : 'default' }}
          title={material.image ? 'Voir la photo en grand' : undefined}>
          {material.image
            ? <img src={thumb(material.image, 240)} alt="" loading="lazy" decoding="async"
                className="w-full h-full object-cover" />
            : <Boxes size={30} style={{ color: 'rgba(124,58,237,0.35)' }} />}
        </button>

        <div className="min-w-0 flex-1 flex flex-col">
          <p className="text-sm font-bold leading-snug break-words text-left" dir="auto" style={{ color: NAVY }}>
            {material.name}
          </p>
          {material.variant && (
            <p className="text-xs font-semibold mt-0.5 text-left" dir="auto" style={{ color: PURPLE }}>{material.variant}</p>
          )}

          <p className="mt-auto pt-1.5 leading-none">
            <span className="text-2xl font-black" style={{ color: st.color }}>{fmt(material.quantity)}</span>
            <span className="text-xs text-gray-400"> {material.unit}</span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
            <span className="text-[10px] text-gray-400">alerte sous {fmt(material.lowStockThreshold)}</span>
          </div>
        </div>
      </div>

      {material.note && (
        <p className="px-3 pb-2 text-[11px] text-gray-400 break-words" dir="auto">{material.note}</p>
      )}

      {/* Même nom qu'une autre matière, sans rien pour les distinguer */}
      {ambiguous && canWrite && (
        <button type="button" onClick={() => onEdit(material)}
          className="mx-3 mb-2 flex items-start gap-1.5 text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          Même nom qu'une autre matière — ajoutez sa couleur pour les distinguer.
        </button>
      )}

      {/* Actions */}
      <div className="mt-auto px-3 pb-3 space-y-2">
        {canWrite && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => toggle('out')} disabled={material.quantity <= 0}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-35"
              style={panel === 'out'
                ? { background: '#ef4444', borderColor: '#ef4444', color: 'white' }
                : { borderColor: '#fecaca', color: '#ef4444' }}>
              <Minus size={15} /> Sortie
            </button>
            <button type="button" onClick={() => toggle('in')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
              style={panel === 'in'
                ? { background: '#10b981', borderColor: '#10b981', color: 'white' }
                : { borderColor: '#a7f3d0', color: '#059669' }}>
              <Plus size={15} /> Entrée
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          {canWrite && (
            <button type="button" onClick={() => toggle('set')}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all"
              style={panel === 'set' ? { background: PURPLE, color: 'white' } : { color: '#6b7280', background: '#f3f4f6' }}>
              <ClipboardCheck size={13} /> Inventaire
            </button>
          )}
          <button type="button" onClick={() => toggle('history')}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all"
            style={panel === 'history' ? { background: NAVY, color: 'white' } : { color: '#6b7280', background: '#f3f4f6' }}>
            <History size={13} /> Historique
          </button>
          {canWrite && (
            <>
              <button type="button" onClick={() => onEdit(material)} title="Modifier la matière"
                className={`${iconBtn} ml-auto text-gray-400 hover:text-purple-600 hover:bg-purple-50`}>
                <Pencil size={14} />
              </button>
              <button type="button" onClick={remove} title="Supprimer la matière"
                className={`${iconBtn} text-gray-400 hover:text-red-500 hover:bg-red-50`}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {(panel === 'in' || panel === 'out' || panel === 'set') && (
          <MoveForm material={material} type={panel}
            onCancel={() => setPanel(null)}
            onDone={(updated) => { onUpdated(updated); setPanel(null) }} />
        )}
        {panel === 'history' && (
          <div className="px-1">
            <Movements materialId={material._id} limit={15} />
          </div>
        )}
      </div>
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

const SORTS = {
  name: { label: 'Par nom' },
  low:  { label: 'Les plus bas d\'abord' },
  high: { label: 'Les plus fournis d\'abord' },
}

function StockPage() {
  const { role } = useStaffAuth()
  const [searchParams] = useSearchParams()
  const from   = searchParams.get('from')
  const backTo = RETOURS[from] || null
  const canWrite = canWriteStock(role) && !ORIGINES_LECTURE_SEULE.includes(from)

  const [materials, setMaterials] = useState([])
  const [flow, setFlow]           = useState(null)     // entrées / sorties sur 30 jours
  const [loading, setLoading]     = useState(true)

  const [view, setView]     = useState('stock')        // stock | journal
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState('all')          // all | alert | rupture
  const [sort, setSort]     = useState('name')

  const [editing, setEditing]   = useState(null)       // matière en cours d'édition
  const [creating, setCreating] = useState(false)
  const [zoom, setZoom]         = useState(null)

  const loadFlow = useCallback(() => {
    staffApi.get('/stock/stats')
      .then(r => setFlow({ in: r.data?.restockedLast30 || 0, out: r.data?.consumedLast30 || 0 }))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await staffApi.get('/stock')
      setMaterials(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement du stock')
    } finally { setLoading(false) }
    loadFlow()
  }, [loadFlow])

  useEffect(() => { load() }, [load])

  /* Après un geste, seule la matière concernée est remplacée : la page ne se
     recharge pas, on ne perd ni sa recherche ni sa position. */
  const upsert = (m) => {
    setMaterials(prev => prev.some(x => x._id === m._id)
      ? prev.map(x => x._id === m._id ? m : x)
      : [...prev, m])
    loadFlow()
  }
  const removeLocal = (id) => setMaterials(prev => prev.filter(x => x._id !== id))

  const counts = useMemo(() => {
    const c = { all: materials.length, rupture: 0, bas: 0 }
    materials.forEach(m => { const s = statusOf(m); if (s !== 'ok') c[s]++ })
    return { ...c, alert: c.rupture + c.bas }
  }, [materials])

  /* Matières qu'on ne peut pas distinguer à la lecture : même nom, même variante */
  const ambiguous = useMemo(() => {
    const seen = {}
    const key = (m) => `${m.name.trim().toLowerCase()}|${(m.variant || '').trim().toLowerCase()}`
    materials.forEach(m => { seen[key(m)] = (seen[key(m)] || 0) + 1 })
    return new Set(materials.filter(m => seen[key(m)] > 1).map(m => m._id))
  }, [materials])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = materials.filter(m => {
      if (filter === 'rupture' && statusOf(m) !== 'rupture') return false
      if (filter === 'alert' && statusOf(m) === 'ok') return false
      if (!q) return true
      return `${m.name} ${m.variant || ''} ${m.note || ''}`.toLowerCase().includes(q)
    })
    if (sort === 'low')  list = [...list].sort((a, b) => a.quantity - b.quantity)
    if (sort === 'high') list = [...list].sort((a, b) => b.quantity - a.quantity)
    return list            // 'name' : l'ordre du serveur (nom, puis variante)
  }, [materials, query, filter, sort])

  const FILTERS = [
    { key: 'all',     label: 'Toutes',             count: counts.all,     color: PURPLE },
    { key: 'alert',   label: 'À réapprovisionner', count: counts.alert,   color: '#d97706' },
    { key: 'rupture', label: 'En rupture',         count: counts.rupture, color: '#ef4444' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {backTo && (
        <Link to={backTo}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-purple-50"
          style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
          <ArrowLeft size={15} /> Retour
        </Link>
      )}

      <div className="flex items-end justify-between flex-wrap gap-3">
        <PageHeader eyebrow="Matières premières" title="Stock" />
        {canWrite && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ background: PURPLE }}>
            <Plus size={15} /> Nouvelle matière
          </button>
        )}
      </div>

      {!canWrite && (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <Eye size={13} /> Consultation seule
        </div>
      )}

      {/* L'essentiel en chiffres */}
      {/* Sur téléphone : 3 compteurs puis 2 flux, sans case orpheline */}
      <div className="grid grid-cols-6 sm:grid-cols-5 gap-2">
        {[
          { label: 'Matières',       value: fmt(counts.all),     color: NAVY, span: 'col-span-2' },
          { label: 'En rupture',     value: fmt(counts.rupture), color: counts.rupture ? '#ef4444' : '#9ca3af', span: 'col-span-2' },
          { label: 'Stock bas',      value: fmt(counts.bas),     color: counts.bas ? '#d97706' : '#9ca3af', span: 'col-span-2' },
          { label: 'Entrées · 30 j', value: flow ? `+${fmt(flow.in)}` : '…', color: '#059669', span: 'col-span-3' },
          { label: 'Sorties · 30 j', value: flow ? `−${fmt(flow.out)}` : '…', color: '#ef4444', span: 'col-span-3' },
        ].map(s => (
          <div key={s.label} className={`${s.span} sm:col-span-1 bg-white rounded-xl px-2 py-2.5 border border-gray-100 text-center`}>
            <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Matières / journal */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'stock',   label: 'Matières', icon: Boxes },
          { key: 'journal', label: 'Journal des mouvements', icon: History },
        ].map(t => {
          const Icon = t.icon
          const active = view === t.key
          return (
            <button key={t.key} onClick={() => setView(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: active ? PURPLE : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {view === 'journal' ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
          <Movements limit={100} showName />
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Boxes size={26} style={{ color: PURPLE }} />
          </div>
          <p className="text-sm text-gray-400">
            Aucune matière en stock{canWrite ? ' — commencez par « Nouvelle matière ».' : '.'}
          </p>
        </div>
      ) : (
        <>
          {/* Recherche, filtre, tri */}
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={query} onChange={e => setQuery(e.target.value)} dir="auto"
                placeholder="Chercher une matière, une couleur…"
                className={`${field} pl-9 pr-9`} style={{ color: NAVY }} />
              {query && (
                <button onClick={() => setQuery('')} title="Effacer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {FILTERS.map(f => {
                const active = filter === f.key
                return (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: active ? f.color : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
                    {f.label} ({f.count})
                  </button>
                )
              })}
              <div className="relative">
                <ListFilter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select value={sort} onChange={e => setSort(e.target.value)} title="Ordre d'affichage"
                  className="pl-7 pr-2 py-2 rounded-xl border-2 border-gray-200 text-xs font-bold outline-none bg-white"
                  style={{ color: '#6b7280' }}>
                  {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <PackageX size={26} className="text-gray-300" />
              <p className="text-sm text-gray-400">
                {query ? 'Aucune matière ne correspond à cette recherche.'
                  : filter === 'rupture' ? 'Aucune matière en rupture.'
                  : 'Rien à réapprovisionner pour l\'instant.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              {visible.map(m => (
                <MaterialCard key={m._id} material={m} canWrite={canWrite}
                  ambiguous={ambiguous.has(m._id)}
                  onUpdated={upsert} onDeleted={removeLocal}
                  onEdit={setEditing} onZoom={setZoom} />
              ))}
            </div>
          )}
        </>
      )}

      {(creating || editing) && (
        <MaterialForm material={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={(m) => { upsert(m); load() }} />
      )}

      {/* Photo en grand */}
      {zoom && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 gap-3"
          style={{ background: 'rgba(30,27,75,0.85)' }} onClick={() => setZoom(null)}>
          <img src={large(zoom.image)} alt="" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
          <p className="text-white text-sm font-bold text-center" dir="auto">
            {zoom.name}{zoom.variant ? ` — ${zoom.variant}` : ''} · {fmt(zoom.quantity)} {zoom.unit}
          </p>
        </div>
      )}
    </div>
  )
}

export default StockPage
