// src/Components/staff/ServiceHistory.jsx
// Historique d'un service : toutes les commandes qu'il a traitées sur la
// période choisie, avec le décompte par statut.

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Inbox, History } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from './OrderRow'
import OrderDetailModal from './OrderDetailModal'
import { NAVY, PURPLE, ORDER_STATUS, STATUS_KEYS } from './staffConfig'

const PERIODES = [
  { key: 1,  label: 'Journée' },
  { key: 7,  label: 'Semaine' },
  { key: 14, label: '2 semaines' },
  { key: 30, label: 'Mois' },
]

function ServiceHistory({ service, tagScope = null, summaryOpts = {}, showQuantity = true }) {
  const [days, setDays]       = useState(7)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.get('/workflow/history', { params: { service, days } })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally { setLoading(false) }
  }, [service, days])

  useEffect(() => { load() }, [load])

  const orders   = data?.orders || []
  const counts   = data?.counts || {}
  const selected = orders.find(o => o._id === selectedId) || null

  return (
    <div className="space-y-5">

      {/* Période */}
      <div className="flex flex-wrap gap-2">
        {PERIODES.map(p => {
          const active = days === p.key
          return (
            <button key={p.key} onClick={() => setDays(p.key)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: active ? PURPLE : '#f3f4f6',
                color:      active ? 'white' : '#6b7280',
              }}>
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Décompte par statut */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[80px] bg-white rounded-xl px-3 py-2.5 border-2 text-center"
          style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
          <p className="text-lg font-black leading-none" style={{ color: PURPLE }}>
            {loading ? '…' : (counts.total ?? 0)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Total</p>
        </div>
        {STATUS_KEYS.map(s => {
          const cfg = ORDER_STATUS[s]
          return (
            <div key={s} className="flex-1 min-w-[80px] bg-white rounded-xl px-3 py-2.5 border border-gray-100 text-center">
              <p className="text-lg font-black leading-none" style={{ color: cfg.color }}>
                {loading ? '…' : (counts[s] ?? 0)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                {cfg.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Commandes de la période */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-13 h-13 p-3 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.08)' }}>
            <History size={24} style={{ color: PURPLE }} />
          </div>
          <p className="text-sm text-gray-400">
            Aucune commande traitée sur cette période.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </p>
          {orders.map(o => (
            <OrderRow key={o._id} order={o} tagScope={tagScope} showQuantity={showQuantity}
              onOpen={x => setSelectedId(x._id)} />
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelectedId(null)}
          summaryOpts={summaryOpts}
          notesReadOnly
          onTagsChanged={load}
        />
      )}
    </div>
  )
}

export default ServiceHistory
