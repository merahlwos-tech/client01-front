// src/Components/staff/StageBoard.jsx
// Tableau générique d'une étape : récupère les commandes de l'étape et les
// affiche en grille de cartes. Chaque panel fournit ses propres actions.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Inbox, Lock, CheckSquare, Square, Trash2 } from 'lucide-react'
import staffApi from '../../utils/staffApi'
import toast from 'react-hot-toast'
import OrderSummary from './OrderSummary'
import OrderRow from './OrderRow'
import OrderDetailModal from './OrderDetailModal'
import { NAVY, PURPLE, getPurgeCountdown } from './staffConfig'

export function PageHeader({ eyebrow, title, count }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>{eyebrow}</p>
        <h1 className="text-2xl sm:text-3xl font-black italic" style={{ color: NAVY }}>{title}</h1>
      </div>
      {count != null && (
        <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
          {count} commande{count > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

function StageBoard({
  stage, eyebrow, title, emptyText = 'Aucune commande à cette étape.',
  summaryOpts = {}, actions: Actions, actionProps = {}, readOnly = false,
  extraParams = {}, headerExtra = null,
  layout = 'cards',          // 'cards' | 'list' (liste + détail au clic)
  service = null,            // filtre les états affichés selon le métier
  showPrice = true,          // production et insolation ne voient pas les montants
  tagScope = null,           // active les étiquettes personnalisées
  deletable = false,         // suppression manuelle par sélection (mode liste)
}) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  // Sérialisé pour servir de dépendance stable au useCallback
  const paramsKey = JSON.stringify(extraParams)

  const refresh = useCallback(async () => {
    try {
      const res = await staffApi.get('/workflow/orders', {
        params: { stage, ...JSON.parse(paramsKey) },
      })
      setOrders(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [stage, paramsKey])

  useEffect(() => { setLoading(true); refresh() }, [refresh])

  // Retire une commande de la liste (après action) sans refetch complet
  const removeOne = (id) => setOrders(prev => prev.filter(o => o._id !== id))

  // Remplace une commande modifiée sur place (étiquette, urgence…)
  const updateOne = (updated) =>
    setOrders(prev => prev.map(o => o._id === updated._id ? updated : o))

  /* ── Mode liste : la commande sélectionnée s'ouvre en détail ── */
  const [selectedId, setSelectedId] = useState(null)
  const selected = orders.find(o => o._id === selectedId) || null

  /* ── Suppression manuelle par sélection ── */
  const [picking, setPicking]   = useState(false)
  const [picked, setPicked]     = useState([])
  const [deleting, setDeleting] = useState(false)

  const togglePick = (id) =>
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const pickAll = () =>
    setPicked(picked.length === orders.length ? [] : orders.map(o => o._id))

  const removePicked = async () => {
    if (picked.length === 0) return
    if (!window.confirm(
      `Supprimer définitivement ${picked.length} commande(s) ?\n\n`
      + 'Les logos clients seront effacés eux aussi. Cette action est irréversible.'
    )) return
    setDeleting(true)
    try {
      const res = await staffApi.post('/workflow/orders/bulk-delete', { ids: picked })
      toast.success(`${res.data?.deleted ?? picked.length} commande(s) supprimée(s)`)
      setOrders(prev => prev.filter(o => !picked.includes(o._id)))
      setPicked([]); setPicking(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setDeleting(false) }
  }

  const closeDetail = () => setSelectedId(null)

  // Après une action dans le détail : on ferme si la commande a quitté la liste
  const removeOneAndClose = (id) => { removeOne(id); closeDetail() }
  const updateOneKeepOpen = (updated) => {
    if (!updated) { refresh(); return }
    updateOne(updated)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} count={loading ? null : orders.length} />

      {headerExtra}

      {readOnly && (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          style={{ background: '#fffbeb', color: '#b45309' }}>
          <Lock size={13} /> Lecture seule
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
            <Inbox size={26} style={{ color: PURPLE }} />
          </div>
          <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
      ) : layout === 'list' ? (
        /* ── Liste compacte : on clique une ligne pour voir le détail ── */
        <div className="space-y-2">
          {deletable && !readOnly && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <button onClick={() => { setPicking(p => !p); setPicked([]) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                style={picking
                  ? { borderColor: PURPLE, background: PURPLE, color: 'white' }
                  : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                <CheckSquare size={13} /> {picking ? 'Quitter la sélection' : 'Sélectionner'}
              </button>
              {picking && (
                <>
                  <button onClick={pickAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500 transition-all hover:bg-gray-50">
                    <Square size={13} />
                    {picked.length === orders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <button onClick={removePicked} disabled={picked.length === 0 || deleting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                    style={{ background: '#ef4444' }}>
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Supprimer ({picked.length})
                  </button>
                </>
              )}
            </div>
          )}
          {orders.map(order => (
            <OrderRow key={order._id} order={order} tagScope={tagScope} service={service} showPrice={showPrice}
              selectable={picking} selected={picked.includes(order._id)} onToggleSelect={togglePick}
              purge={getPurgeCountdown(order)}
              onOpen={o => setSelectedId(o._id)} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <OrderSummary order={order} service={service} showPrice={showPrice} {...summaryOpts} />
              {/* Rendu comme COMPOSANT (<Actions />) et non appelé comme une
                  fonction : les actions utilisent des hooks, les appeler dans
                  ce .map() violerait les règles des hooks (React #310). */}
              {!readOnly && Actions && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Actions order={order} refresh={refresh} removeOne={removeOne}
                    updateOne={updateOne} {...actionProps} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Détail de la commande sélectionnée (mode liste) */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={closeDetail}
          summaryOpts={{ service, showPrice, ...summaryOpts }}
          tagScope={readOnly ? null : tagScope}
          onTagsChanged={updateOneKeepOpen}
          /* Annulée = sortie du circuit : elle quitte la liste du service */
          onCancelled={readOnly ? undefined : (_u, id) => removeOneAndClose(id)}>
          {!readOnly && Actions && (
            <Actions order={selected} refresh={refresh}
              removeOne={removeOneAndClose} updateOne={updateOneKeepOpen}
              {...actionProps} />
          )}
        </OrderDetailModal>
      )}
    </div>
  )
}

export default StageBoard
