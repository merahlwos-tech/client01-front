// src/Components/staff/MaterialsDeclaration.jsx
// Matières à déduire du stock pour une commande.
//
// Dès qu'une commande arrive, la confirmatrice indique ce qu'elle va
// consommer : le stock diminue tout de suite, sans attendre la fabrication.
// Une nouvelle saisie REMPLACE la précédente (le serveur n'applique que
// l'écart) : on peut donc corriger, ou tout remettre en stock, sans jamais
// compter deux fois.

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, Plus, Trash2, Loader2, AlertTriangle, Undo2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { NAVY, PURPLE } from './staffConfig'

const emptyRow = () => ({ material: '', quantity: '' })

// Lignes du formulaire à partir de ce qui est déjà déduit pour la commande
const rowsFrom = (order) => {
  const used = order.pipeline?.materialsUsed || []
  return used.length
    ? used.map(m => ({ material: String(m.material?._id || m.material || ''), quantity: m.quantity }))
    : [emptyRow()]
}

function MaterialsDeclaration({ order, onChanged, readOnly = false, stockLink = null }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading]     = useState(true)
  const [rows, setRows]           = useState(() => rowsFrom(order))
  const [saving, setSaving]       = useState(false)

  const declared = order.pipeline?.materialsUsed || []

  const loadStock = useCallback(() => {
    return staffApi.get('/stock')
      .then(r => setMaterials(r.data || []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStock() }, [loadStock])

  // La commande affichée change (ou vient d'être mise à jour) : on repart d'elle
  useEffect(() => { setRows(rowsFrom(order)) }, [order._id, order.pipeline?.materialsUsed])

  const setRow    = (i, patch) => setRows(p => p.map((r, k) => k === i ? { ...r, ...patch } : r))
  const addRow    = () => setRows(p => [...p, emptyRow()])
  const removeRow = (i) => setRows(p => (p.length === 1 ? [emptyRow()] : p.filter((_, k) => k !== i)))

  const matById = (id) => materials.find(m => String(m._id) === String(id))
  // Ce que CETTE commande a déjà pris sur une matière : il lui est « rendu »
  // avant de compter la nouvelle quantité.
  const alreadyTaken = (id) => declared
    .filter(m => String(m.material?._id || m.material) === String(id))
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0)

  const valid = rows
    .map(r => ({ material: r.material, quantity: Number(r.quantity) }))
    .filter(r => r.material && r.quantity > 0)

  /* Stock restant après la saisie, toutes lignes d'une même matière cumulées */
  const remainingFor = (id) => {
    const mat = matById(id)
    if (!mat) return null
    const asked = valid.filter(r => String(r.material) === String(id)).reduce((s, r) => s + r.quantity, 0)
    return mat.quantity + alreadyTaken(id) - asked
  }
  const shortage = valid.some(r => (remainingFor(r.material) ?? 0) < 0)

  const sameAsDeclared = (() => {
    const key = (list) => list
      .map(m => `${String(m.material?._id || m.material)}:${Number(m.quantity)}`).sort().join('|')
    return key(valid) === key(declared)
  })()

  const save = async (list) => {
    setSaving(true)
    try {
      const res = await staffApi.put(`/workflow/orders/${order._id}/materials`, { materials: list })
      toast.success(list.length ? 'Stock mis à jour' : 'Matières remises en stock')
      onChanged?.(res.data)
      loadStock()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const cancelAll = () => {
    if (!window.confirm('Remettre en stock toutes les matières déduites pour cette commande ?')) return
    save([])
  }

  return (
    <div className="p-3 rounded-xl space-y-2.5" style={{ background: '#faf9ff' }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: PURPLE }}>
          <Boxes size={13} /> Matières à déduire du stock
        </p>
        {stockLink && (
          <Link to={stockLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold hover:opacity-70 transition-opacity"
            style={{ color: PURPLE }}>
            Voir le stock <ExternalLink size={11} />
          </Link>
        )}
      </div>

      {/* Ce qui est déjà sorti du stock pour cette commande */}
      {declared.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {declared.map((m, i) => (
            <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: '#eff6ff', color: '#2563eb' }}>
              {m.name} ×{m.quantity}
            </span>
          ))}
        </div>
      )}

      {readOnly ? (
        declared.length === 0 && <p className="text-xs text-gray-400 italic">Aucune matière déduite.</p>
      ) : loading ? (
        <p className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={13} className="animate-spin" /> Chargement du stock…
        </p>
      ) : materials.length === 0 ? (
        <p className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <AlertTriangle size={13} /> Aucune matière en stock. Le chef de production doit en ajouter.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {rows.map((row, i) => {
              const mat  = matById(row.material)
              const left = row.material ? remainingFor(row.material) : null
              const over = left != null && left < 0
              return (
                <div key={i}>
                  <div className="flex gap-2 items-start">
                    <select value={row.material} onChange={e => setRow(i, { material: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors bg-white"
                      style={{ color: NAVY }}>
                      <option value="">Matière…</option>
                      {materials.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} — en stock : {m.quantity} {m.unit}
                        </option>
                      ))}
                    </select>
                    <input type="number" min="0" value={row.quantity} placeholder="Qté"
                      onChange={e => setRow(i, { quantity: e.target.value })}
                      className="w-20 px-2 py-2 rounded-xl border-2 text-sm outline-none focus:border-purple-400 transition-colors bg-white"
                      style={{ borderColor: over ? '#fca5a5' : '#e5e7eb', color: NAVY }} />
                    <button type="button" onClick={() => removeRow(i)} title="Retirer cette ligne"
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {mat && Number(row.quantity) > 0 && (
                    <p className="text-[11px] mt-1 ml-1" style={{ color: over ? '#ef4444' : '#6b7280' }}>
                      {over
                        ? `Stock insuffisant : il manque ${Math.abs(left)} ${mat.unit}.`
                        : `Il restera ${left} ${mat.unit} en stock.`}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <button type="button" onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-bold py-1 px-1 -mx-1 rounded-lg transition-colors hover:opacity-70"
            style={{ color: PURPLE }}>
            <Plus size={14} /> Ajouter une matière
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={() => save(valid)}
              disabled={saving || shortage || sameAsDeclared || (valid.length === 0 && declared.length === 0)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: PURPLE }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Boxes size={14} />}
              {declared.length > 0 ? 'Mettre à jour le stock' : 'Déduire du stock'}
            </button>
            {declared.length > 0 && (
              <button type="button" onClick={cancelAll} disabled={saving}
                title="Remettre ces matières en stock"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all hover:bg-white disabled:opacity-40"
                style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                <Undo2 size={13} /> Annuler
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default MaterialsDeclaration
