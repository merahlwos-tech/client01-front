import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Plus, Search, Pencil, Inbox, RefreshCcw, AlertTriangle, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from '../../Components/staff/OrderRow'
import OrderDetailModal from '../../Components/staff/OrderDetailModal'
import OrderForm from '../../Components/staff/OrderForm'
import { PageHeader } from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import {
  canAct, NAVY, PURPLE,
  ORDER_STATUS, STATUS_KEYS, URGENCY, URGENCY_KEYS,
} from '../../Components/staff/staffConfig'

/* Étapes où la commande est déjà travaillée en atelier :
   elle n'est alors plus modifiable par la confirmatrice. */
const LOCKED_STAGES = ['production', 'emballage', 'livraison', 'termine']

/* ══════════════════════════════════════════════
   Carte d'une commande
══════════════════════════════════════════════ */
function OrderActions({ order, onChanged, onEdit }) {
  const [busy, setBusy] = useState(false)

  const status  = order.status || 'en attente'
  const urgency = order.pipeline?.urgency || 'normal'
  const locked  = LOCKED_STAGES.includes(order.pipeline?.stage)

  const patch = async (path, body, successMsg) => {
    setBusy(true)
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/${path}`, body)
      toast.success(successMsg)
      onChanged(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus  = (s) => patch('status',  { status: s },   `Statut → ${ORDER_STATUS[s].label}`)
  const changeUrgency = (u) => patch('urgency', { urgency: u },  `Urgence → ${URGENCY[u].label}`)

  return (
    <>
      {order.pipeline?.manual && (
        <p className="mb-3 text-[11px] font-semibold" style={{ color: PURPLE }}>
          ✎ Commande saisie manuellement
        </p>
      )}

      {(
        <div className="space-y-3">

          {locked ? (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: '#fffbeb', color: '#b45309' }}>
              <Lock size={13} />
              En atelier ({order.pipeline.stage}) — non modifiable
            </div>
          ) : (
            <>
              {/* Statut */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Statut</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUS_KEYS.map(s => {
                    const cfg = ORDER_STATUS[s]
                    const active = status === s
                    return (
                      <button key={s} onClick={() => changeStatus(s)} disabled={busy || active}
                        className="py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-default"
                        style={{
                          background: active ? cfg.color : cfg.bg,
                          color:      active ? 'white'    : cfg.color,
                          opacity:    busy && !active ? 0.5 : 1,
                        }}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Urgence */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Urgence</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {URGENCY_KEYS.map(u => {
                    const cfg = URGENCY[u]
                    const active = urgency === u
                    return (
                      <button key={u} onClick={() => changeUrgency(u)} disabled={busy || active}
                        className="py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-default"
                        style={{
                          background: active ? cfg.color : cfg.bg,
                          color:      active ? 'white'    : cfg.color,
                          opacity:    busy && !active ? 0.5 : 1,
                        }}>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Modifier */}
              <button onClick={() => onEdit(order)} disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-purple-50 disabled:opacity-50"
                style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
                <Pencil size={14} /> Modifier la commande
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
function ConfirmatricePage() {
  const { role } = useStaffAuth()
  const readOnly = !canAct(role, 'confirmation')

  const [orders, setOrders]   = useState([])
  const [counts, setCounts]   = useState(null)
  const [loading, setLoading] = useState(true)
  // 'nouveau' (non traitées) | un statut | 'tag:<id>'
  const [filter, setFilter]   = useState('nouveau')
  const [tags, setTags]       = useState([])
  const [search, setSearch]   = useState('')
  const [query, setQuery]     = useState('')        // recherche appliquée (débouncée)
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [selectedId, setSelectedId] = useState(null)   // commande ouverte en détail

  const selected = orders.find(o => o._id === selectedId) || null

  /* Débounce de la recherche (évite une requête par frappe) */
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // `filter` vaut soit 'nouveau', soit un statut, soit 'tag:<id>'
      const params = filter.startsWith('tag:')
        ? { tag: filter.slice(4) }
        : { status: filter }
      if (query.trim()) params.q = query.trim()

      const [list, cnt, tg] = await Promise.all([
        staffApi.get('/workflow/confirmation', { params }),
        staffApi.get('/workflow/confirmation/counts'),
        staffApi.get('/tags', { params: { scope: 'confirmatrice' } }),
      ])
      setOrders(list.data || [])
      setCounts(cnt.data || null)
      setTags(tg.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [filter, query])

  useEffect(() => { load() }, [load])

  /* Remplace une commande dans la liste après modification.
     Sans argument (ex. suppression d'une étiquette) → rechargement complet. */
  const handleChanged = (updated) => {
    if (!updated?._id) { load(); return }
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))

    // Les compteurs changent → on les rafraîchit discrètement
    staffApi.get('/workflow/confirmation/counts')
      .then(r => setCounts(r.data)).catch(() => {})

    /* La commande sort-elle de la vue courante ?
       - onglet « Commandes » : dès qu'elle reçoit un statut
       - onglet d'un statut    : si son statut a changé
       - onglet d'une étiquette : si l'étiquette a été retirée   */
    const sort =
      filter === 'nouveau'        ? !!updated.pipeline?.statusSetAt
    : filter.startsWith('tag:')   ? !(updated.pipeline?.customTags || [])
                                      .some(t => String(t._id || t) === filter.slice(4))
    :                               updated.status !== filter

    if (sort) {
      setOrders(prev => prev.filter(o => o._id !== updated._id))
      setSelectedId(null)
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit   = (order) => { setEditing(order); setFormOpen(true) }

  // « Commandes » = celles qu'elle n'a pas encore traitées
  const TABS = [
    { key: 'nouveau', label: 'Commandes', count: counts?.nouveau, color: PURPLE },
    ...STATUS_KEYS.map(s => ({
      key: s, label: ORDER_STATUS[s].label, count: counts?.[s], color: ORDER_STATUS[s].color,
    })),
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-end justify-between flex-wrap gap-3">
        <PageHeader eyebrow="Service confirmation" title="Commandes" />
        {!readOnly && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
            style={{ background: PURPLE }}>
            <Plus size={15} /> Nouvelle commande
          </button>
        )}
      </div>

      {readOnly && (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <AlertTriangle size={13} /> Lecture seule
        </div>
      )}

      {/* Filtres + recherche */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {TABS.map(t => {
            const active = filter === t.key
            return (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className="px-3 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? t.color : '#f3f4f6',
                  color:      active ? 'white' : '#6b7280',
                }}>
                {t.label}{t.count != null ? ` (${t.count})` : ''}
              </button>
            )
          })}

          {/* Étiquettes : un clic filtre les commandes qui la portent */}
          {tags.length > 0 && <span className="w-px self-stretch bg-gray-200 mx-1" />}
          {tags.map(tag => {
            const key    = `tag:${tag._id}`
            const active = filter === key
            const nb     = counts?.tags?.[tag._id]
            return (
              <button key={tag._id} onClick={() => setFilter(key)}
                className="px-3 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? tag.color : tag.color + '1a',
                  color:      active ? 'white'   : tag.color,
                }}>
                {tag.name}{nb != null ? ` (${nb})` : ''}
              </button>
            )
          })}
        </div>

        <div className="relative sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, téléphone, commune…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors"
            style={{ color: NAVY }} />
          <button onClick={load} title="Rafraîchir"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-gray-50 transition-colors">
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Inbox size={26} style={{ color: PURPLE }} />
          </div>
          <p className="text-sm text-gray-400">
            {query ? 'Aucune commande ne correspond à cette recherche.' : 'Aucune commande pour ce filtre.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <OrderRow key={order._id} order={order} onOpen={o => setSelectedId(o._id)} />
          ))}
        </div>
      )}

      {/* Détail de la commande sélectionnée */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelectedId(null)}
          summaryOpts={{ showHistory: true }}
          tagScope={readOnly ? null : 'confirmatrice'}
          onTagsChanged={handleChanged}>
          {!readOnly && (
            <OrderActions order={selected} onChanged={handleChanged}
              onEdit={(o) => { setSelectedId(null); openEdit(o) }} />
          )}
        </OrderDetailModal>
      )}

      {/* Formulaire création / modification */}
      {formOpen && (
        <OrderForm
          order={editing}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSaved={load}
        />
      )}
    </div>
  )
}

export default ConfirmatricePage
