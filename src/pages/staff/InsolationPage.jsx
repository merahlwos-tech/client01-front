import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Inbox, CheckCircle2, Undo2, Sun, ListChecks, RefreshCcw, History,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from '../../Components/staff/OrderRow'
import OrderDetailModal from '../../Components/staff/OrderDetailModal'
import ServiceHistory from '../../Components/staff/ServiceHistory'
import { PageHeader } from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import {
  PURPLE, INSOLATION_STATUS, isSuperadmin,
} from '../../Components/staff/staffConfig'

/* Actions du service insolation sur une commande */
function InsolationActions({ order, onChanged, onDone }) {
  const [note, setNote] = useState(order.pipeline?.insolation?.note || '')
  const [busy, setBusy] = useState(false)

  const current = order.pipeline?.insolation?.status || 'en_attente'

  const setStatus = async (status) => {
    setBusy(true)
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/insolation`, { status, note })
      toast.success(status === 'confirme'
        ? 'Insolation confirmée — passée dans la liste « Confirmé »'
        : 'Remise en attente')
      onChanged?.(res.data)
      onDone?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Statut insolation
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(INSOLATION_STATUS).map(([key, cfg]) => {
            const active = current === key
            return (
              <button key={key} onClick={() => setStatus(key)} disabled={busy || active}
                className="py-2.5 rounded-xl text-sm font-bold transition-all disabled:cursor-default"
                style={{
                  background: active ? cfg.color : cfg.bg,
                  color:      active ? 'white'   : cfg.color,
                  opacity:    busy && !active ? 0.5 : 1,
                }}>
                {busy && !active
                  ? <Loader2 size={14} className="animate-spin inline" />
                  : key === 'confirme' ? <CheckCircle2 size={14} className="inline mr-1" />
                                       : <Undo2 size={14} className="inline mr-1" />}
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={300}
        placeholder="Note d'insolation (enregistrée avec le statut)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

      {order.pipeline?.insolation?.at && (
        <p className="text-[11px] text-gray-400">
          Dernière mise à jour : {new Date(order.pipeline.insolation.at).toLocaleString('fr-DZ', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          {order.pipeline.insolation.by ? ` par ${order.pipeline.insolation.by}` : ''}
        </p>
      )}
    </div>
  )
}

function InsolationPage() {
  const { role } = useStaffAuth()
  const readOnly = !(role === 'insolation' || isSuperadmin(role) || role === 'chef_production')

  const [view, setView]       = useState('en_attente')   // en_attente | confirme
  const [orders, setOrders]   = useState([])
  const [counts, setCounts]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const selected = orders.find(o => o._id === selectedId) || null

  const load = useCallback(async () => {
    if (view === 'historique') { setLoading(false); return }
    setLoading(true)
    try {
      const [list, cnt] = await Promise.all([
        staffApi.get('/workflow/insolation', { params: { status: view } }),
        staffApi.get('/workflow/insolation/counts'),
      ])
      setOrders(list.data || [])
      setCounts(cnt.data || null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally { setLoading(false) }
  }, [view])

  useEffect(() => { load() }, [load])

  /* Après changement de statut : la commande quitte la liste courante */
  const handleChanged = (updated) => {
    if (!updated?._id) { load(); return }
    const stillHere = view === 'confirme'
      ? updated.pipeline?.insolation?.status === 'confirme'
      : updated.pipeline?.insolation?.status !== 'confirme'

    if (stillHere) {
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
    } else {
      setOrders(prev => prev.filter(o => o._id !== updated._id))
      setSelectedId(null)
    }
    staffApi.get('/workflow/insolation/counts').then(r => setCounts(r.data)).catch(() => {})
  }

  const TABS = [
    { key: 'en_attente', label: 'À insoler', icon: ListChecks, count: counts?.en_attente, color: PURPLE },
    { key: 'confirme',   label: 'Confirmé',  icon: CheckCircle2, count: counts?.confirme, color: INSOLATION_STATUS.confirme.color },
    { key: 'historique', label: 'Historique', icon: History,    count: null, color: '#6b7280' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <PageHeader eyebrow="Service insolation" title={view === 'confirme' ? 'Commandes confirmées' : 'Commandes à insoler'} />
        <button onClick={load} title="Rafraîchir"
          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-purple-600 transition-colors">
          <RefreshCcw size={15} />
        </button>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => {
          const active = view === t.key
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setView(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: active ? t.color : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
              <Icon size={15} />
              {t.label}{t.count != null ? ` (${t.count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Historique du service */}
      {view === 'historique' && (
        <ServiceHistory service="insolation" showQuantity={false}
          summaryOpts={{ showDesign: true, showQuantity: false, showPrice: false, service: 'insolation' }} />
      )}

      {/* Liste */}
      {view !== 'historique' && (loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Sun size={26} style={{ color: PURPLE }} />
          </div>
          <p className="text-sm text-gray-400">
            {view === 'confirme'
              ? 'Aucune commande confirmée pour l\'instant.'
              : 'Aucune commande validée par le designer en attente d\'insolation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            /* L'insolation n'a pas besoin des quantités */
            <OrderRow key={order._id} order={order} showQuantity={false} service="insolation" showPrice={false}
              onOpen={o => setSelectedId(o._id)} />
          ))}
        </div>
      ))}

      {/* Détail */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelectedId(null)}
          summaryOpts={{ showDesign: true, showQuantity: false }}
          onTagsChanged={handleChanged}
          notesReadOnly={readOnly}>
          {!readOnly && (
            <InsolationActions order={selected} onChanged={handleChanged} />
          )}
        </OrderDetailModal>
      )}
    </div>
  )
}

export default InsolationPage
