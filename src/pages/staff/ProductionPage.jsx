import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, PackageOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct, PURPLE, NAVY } from '../../Components/staff/staffConfig'

function ProductionActions({ order, materials, onDone }) {
  const [rows, setRows]   = useState([{ material: '', quantity: '' }])
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  const setRow = (i, patch) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(prev => [...prev, { material: '', quantity: '' }])
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const matById = (id) => materials.find(m => m._id === id)

  const validRows = rows
    .map(r => ({ material: r.material, quantity: Number(r.quantity) }))
    .filter(r => r.material && r.quantity > 0)

  const finish = async () => {
    if (validRows.length === 0) {
      return toast.error('Indiquez au moins une matière consommée')
    }
    setSending(true)
    try {
      await staffApi.post(`/workflow/orders/${order._id}/produce`, {
        materialsUsed: validRows, notes,
      })
      toast.success('Fabrication terminée → emballage')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: PURPLE }}>
        <PackageOpen size={13} /> Matières premières consommées
      </p>

      {materials.length === 0 ? (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: '#fffbeb', color: '#b45309' }}>
          <AlertTriangle size={14} /> Aucune matière en stock. Le chef de production doit en ajouter.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const mat = matById(row.material)
            const over = mat && Number(row.quantity) > mat.quantity
            return (
              <div key={i} className="flex gap-2 items-start">
                <select value={row.material} onChange={e => setRow(i, { material: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors"
                  style={{ color: NAVY }}>
                  <option value="">Matière…</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>{m.name} (stock : {m.quantity} {m.unit})</option>
                  ))}
                </select>
                <input type="number" min="0" value={row.quantity} onChange={e => setRow(i, { quantity: e.target.value })}
                  placeholder="Qté"
                  className="w-20 px-2 py-2 rounded-xl border-2 text-sm outline-none focus:border-purple-400 transition-colors"
                  style={{ borderColor: over ? '#fca5a5' : '#e5e7eb', color: NAVY }} />
                <button onClick={() => removeRow(i)} disabled={rows.length === 1}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
          <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-70" style={{ color: PURPLE }}>
            <Plus size={14} /> Ajouter une matière
          </button>
        </div>
      )}

      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder="Notes de production (optionnel)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

      <button onClick={finish} disabled={sending || validRows.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: '#3b82f6' }}>
        {sending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        Fabrication terminée
      </button>
    </div>
  )
}

function ProductionPage() {
  const { role } = useStaffAuth()
  const readOnly = !canAct(role, 'production')
  const [materials, setMaterials] = useState([])

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await staffApi.get('/stock')
      setMaterials(res.data || [])
    } catch { /* silencieux : le board affiche déjà les erreurs commandes */ }
  }, [])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  return (
    <StageBoard
      stage="production"
      eyebrow="Service production"
      title="Commandes à fabriquer"
      emptyText="Aucune commande en production."
      summaryOpts={{ showDesign: true, showHistory: true }}
      readOnly={readOnly}
      renderActions={(order, { removeOne }) => (
        <ProductionActions
          order={order}
          materials={materials}
          onDone={() => { removeOne(order._id); fetchMaterials() }}
        />
      )}
    />
  )
}

export default ProductionPage
