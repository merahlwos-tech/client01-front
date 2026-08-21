import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, PackageOpen,
  CalendarCheck, History, ShieldCheck, Undo2, Pencil,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import NotesThread from '../../Components/staff/NotesThread'
import OrderForm from '../../Components/staff/OrderForm'
import {
  canAct, PURPLE, NAVY, todayStr, formatDayLabel,
  WEEKDAYS, nextDateForWeekday, STAGES,
} from '../../Components/staff/staffConfig'

// Étapes vers lesquelles le chef peut déplacer une commande
const FORCEABLE_STAGES = ['confirmation', 'design', 'production', 'emballage', 'livraison', 'termine']

/* Le chef de production peut corriger le jour choisi par le designer,
   et retirer la commande de la production comme le designer. */
function ChefRescheduleActions({ order, updateOne, removeOne, onEdit }) {
  const [day, setDay]   = useState(order.pipeline?.productionDay ?? null)
  const [busy, setBusy] = useState(null)   // 'day' | 'pull' | 'stage'

  /* Déplace la commande à l'étape voulue, sans passer par les intermédiaires */
  const forceStage = async (stage) => {
    const label = STAGES[stage]?.label || stage
    if (!window.confirm(`Déplacer cette commande vers « ${label} » ?`)) return
    setBusy('stage')
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/stage`, {
        stage, asChef: true, note: 'Étape forcée par le chef de production',
      })
      toast.success(`Commande déplacée vers « ${label} »`)
      // Elle quitte la vue production dès qu'elle change d'étape
      if (stage !== 'production') removeOne?.(order._id)
      else updateOne?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(null) }
  }

  const save = async () => {
    if (day == null) return
    setBusy('day')
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/production-day`, {
        productionDate: nextDateForWeekday(day),
        productionDay:  day,
      })
      toast.success(`Replanifiée — ${formatDayLabel(nextDateForWeekday(day))}`)
      updateOne?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(null) }
  }

  /* Retire la commande de la production : elle repart chez le designer */
  const pullBack = async () => {
    if (!window.confirm('Retirer cette commande de la production ?\nElle repartira chez le designer.')) return
    setBusy('pull')
    try {
      await staffApi.post(`/workflow/orders/${order._id}/pull-back`)
      toast.success('Commande retirée de la production')
      removeOne?.(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <NotesThread order={order} onChanged={updateOne} />

      <div className="p-3 rounded-xl space-y-2" style={{ background: '#faf9ff' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Affectation du designer — modifiable
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
          {WEEKDAYS.map(w => {
            const active = day === w.day
            return (
              <button key={w.day} type="button" onClick={() => setDay(w.day)}
                className="py-2 rounded-lg text-[11px] font-bold transition-all"
                style={{ background: active ? PURPLE : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
                {w.short}
              </button>
            )
          })}
        </div>
        <button onClick={save} disabled={!!busy || day == null || day === order.pipeline?.productionDay}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-40"
          style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
          {busy === 'day' ? <Loader2 size={13} className="animate-spin" /> : <CalendarCheck size={13} />}
          Changer le jour de fabrication
        </button>
      </div>

      {/* Modifier la commande, même déjà en fabrication */}
      <button onClick={() => onEdit?.(order)} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-purple-50 disabled:opacity-50"
        style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
        <Pencil size={14} /> Modifier la commande
      </button>

      {/* Forcer une étape du circuit */}
      <div className="p-3 rounded-xl space-y-2" style={{ background: '#fffbeb' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#b45309' }}>
          Forcer une étape
        </p>
        <div className="grid grid-cols-3 gap-1">
          {FORCEABLE_STAGES.map(s => {
            const cfg = STAGES[s]
            const active = order.pipeline?.stage === s
            return (
              <button key={s} onClick={() => forceStage(s)} disabled={!!busy || active}
                className="py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:cursor-default"
                style={{
                  background: active ? cfg.color : cfg.bg,
                  color:      active ? 'white'   : cfg.color,
                  opacity:    busy && !active ? 0.5 : 1,
                }}>
                {cfg.label}
              </button>
            )
          })}
        </div>
        <p className="text-[10px]" style={{ color: '#b45309' }}>
          Déplace la commande sans passer par les étapes intermédiaires.
        </p>
      </div>

      {/* Retrait de la production — même prérogative que le designer */}
      <button onClick={pullBack} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-red-50 disabled:opacity-50"
        style={{ borderColor: '#fecaca', color: '#ef4444' }}>
        {busy === 'pull' ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
        Retirer de la production
      </button>
    </div>
  )
}

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

/* Mode chef : il conserve toutes les actions de la production ET peut en plus
   replanifier le jour de fabrication décidé par le designer. */
function ChefProductionActions(props) {
  return (
    <div className="space-y-4">
      <ChefRescheduleActions {...props} />
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          Actions de fabrication
        </p>
        <ProductionActions {...props} />
      </div>
    </div>
  )
}

function ProductionPage() {
  const { role } = useStaffAuth()
  const [searchParams] = useSearchParams()

  /* Le chef arrive depuis sa page avec ?chef=1 : il garde ses prérogatives
     même quand l'accès libre le fait passer pour un superadmin. */
  const chefMode = role === 'chef_production' || searchParams.get('chef') === '1'
  const readOnly = !canAct(role, 'production') && !chefMode
  const [materials, setMaterials] = useState([])
  const [editing, setEditing]     = useState(null)   // commande en cours d'édition (chef)
  const [reloadKey, setReloadKey] = useState(0)      // force le rechargement après édition
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
      {chefMode && (
        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ml-auto"
          style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
          <ShieldCheck size={12} /> Mode chef — planning modifiable
        </span>
      )}
    </div>
  )

  return (
    <>
    <StageBoard
      key={`${view}-${reloadKey}`}
      stage="production"
      eyebrow="Service production"
      title={isLate ? 'Commandes en retard' : 'À fabriquer aujourd\'hui'}
      emptyText={isLate
        ? 'Aucune commande en retard.'
        : 'Aucune commande à fabriquer aujourd\'hui.'}
      summaryOpts={{ showDesign: true, showHistory: true, showNotes: true }}
      readOnly={readOnly}
      actions={chefMode ? ChefProductionActions : ProductionActions}
      actionProps={{
        materials,
        onStockChanged: () => { fetchMaterials(); refreshCounts() },
        onEdit: setEditing,
      }}
      extraParams={isLate ? { overdueBefore: today } : { date: today }}
      headerExtra={tabs}
    />

    {/* Édition d'une commande, même déjà en fabrication (chef) */}
    {editing && (
      <OrderForm
        order={editing}
        asChef
        onClose={() => setEditing(null)}
        onSaved={() => { setReloadKey(k => k + 1); refreshCounts() }}
      />
    )}
    </>
  )
}

export default ProductionPage
