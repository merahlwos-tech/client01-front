// src/Components/staff/StageBoard.jsx
// Tableau générique d'une étape : récupère les commandes de l'étape et les
// affiche en grille de cartes. Chaque panel fournit ses propres actions.
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Inbox, Lock } from 'lucide-react'
import staffApi from '../../utils/staffApi'
import toast from 'react-hot-toast'
import OrderSummary from './OrderSummary'
import { NAVY, PURPLE } from './staffConfig'

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
}) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await staffApi.get('/workflow/orders', { params: { stage } })
      setOrders(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [stage])

  useEffect(() => { setLoading(true); refresh() }, [refresh])

  // Retire une commande de la liste (après action) sans refetch complet
  const removeOne = (id) => setOrders(prev => prev.filter(o => o._id !== id))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} count={loading ? null : orders.length} />

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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <OrderSummary order={order} {...summaryOpts} />
              {/* Rendu comme COMPOSANT (<Actions />) et non appelé comme une
                  fonction : les actions utilisent des hooks, les appeler dans
                  ce .map() violerait les règles des hooks (React #310). */}
              {!readOnly && Actions && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Actions order={order} refresh={refresh} removeOne={removeOne} {...actionProps} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StageBoard
