import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, PackageOpen,
  CalendarCheck, History,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import {
  canAct, PURPLE, NAVY, todayStr, formatDayLabel,
} from '../../Components/staff/staffConfig'

function ProductionActions({ order, removeOne, materials, onStockChanged }) {
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
      removeOne(order._id)
      onStockChanged?.()          // rafraîchit le stock après consommation
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
  const [view, setView]     = useState('today')   // today | late
  const [counts, setCounts] = useState(null)

  // Date locale de l'atelier (recalculée à chaque rendu de la page)
  const today = todayStr()

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await staffApi.get('/stock')
      setMaterials(res.data || [])
    } catch { /* silencieux : le board affiche déjà les erreurs commandes */ }
  }, [])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  /* Compteurs du jour / en retard */
  const refreshCounts = useCallback(() => {
    staffApi.get('/workflow/orders/counters', { params: { date: today } })
      .then(r => setCounts(r.data))
      .catch(() => {})
  }, [today])

  useEffect(() => { refreshCounts() }, [refreshCounts])

  const isLate = view === 'late'

  /* La production ne voit que les commandes planifiées pour aujourd'hui.
     Un second onglet rattrape celles dont le jour est passé, pour qu'aucune
     commande ne reste invisible. */
  const tabs = (
    <div className="flex flex-wrap gap-2 items-center">
      <button onClick={() => setView('today')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        style={{ background: !isLate ? PURPLE : '#f3f4f6', color: !isLate ? 'white' : '#6b7280' }}>
        <CalendarCheck size={15} />
        Aujourd'hui{counts?.duJour != null ? ` (${counts.duJour})` : ''}
      </button>
      {(counts?.enRetard ?? 0) > 0 && (
        <button onClick={() => setView('late')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: isLate ? '#ef4444' : '#fef2f2', color: isLate ? 'white' : '#ef4444' }}>
          <History size={15} /> En retard ({counts.enRetard})
        </button>
      )}
      <span className="text-xs text-gray-400 ml-1">{formatDayLabel(today)}</span>
    </div>
  )

  return (
    <StageBoard
      key={view}
      stage="production"
      eyebrow="Service production"
      title={isLate ? 'Commandes en retard' : 'À fabriquer aujourd\'hui'}
      emptyText={isLate
        ? 'Aucune commande en retard.'
        : 'Aucune commande à fabriquer aujourd\'hui.'}
      summaryOpts={{ showDesign: true, showHistory: true }}
      readOnly={readOnly}
      actions={ProductionActions}
      actionProps={{ materials, onStockChanged: () => { fetchMaterials(); refreshCounts() } }}
      extraParams={isLate ? { overdueBefore: today } : { date: today }}
      headerExtra={tabs}
    />
  )
}

export default ProductionPage
