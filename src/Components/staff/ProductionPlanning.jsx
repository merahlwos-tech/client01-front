// src/Components/staff/ProductionPlanning.jsx
// Emploi du temps hebdomadaire de la fabrication : une semaine en colonnes,
// un clic sur un jour affiche les commandes à faire ce jour-là.

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, ChevronLeft, ChevronRight, CalendarDays, Inbox, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from './OrderRow'
import OrderDetailModal from './OrderDetailModal'
import { NAVY, PURPLE, WEEKDAYS, toDateStr, todayStr, formatDayLabel } from './staffConfig'

/* Les 7 jours de la semaine contenant `ref`, du dimanche au samedi */
function weekDays(ref) {
  const start = new Date(ref)
  start.setDate(ref.getDate() - ref.getDay())   // recule jusqu'au dimanche
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function ProductionPlanning({ summaryOpts = {} }) {
  const [weekRef, setWeekRef]   = useState(() => new Date())
  const [planning, setPlanning] = useState([])       // [{date,total,urgent,pieces}]
  const [loading, setLoading]   = useState(true)

  const [selectedDate, setSelectedDate] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const days  = weekDays(weekRef)
  const today = todayStr()

  /* Compteurs de la semaine affichée */
  const loadWeek = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.get('/workflow/production-planning', {
        params: { from: toDateStr(days[0]), to: toDateStr(days[6]) },
      })
      setPlanning(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement du planning')
    } finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekRef])

  useEffect(() => { loadWeek() }, [loadWeek])

  /* Commandes du jour sélectionné */
  const loadDay = useCallback(async (date) => {
    setLoadingDay(true)
    try {
      const res = await staffApi.get('/workflow/orders', {
        params: { stage: 'production', date },
      })
      setOrders(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally { setLoadingDay(false) }
  }, [])

  const openDay = (date) => {
    setSelectedDate(date)
    loadDay(date)
  }

  const shiftWeek = (delta) => {
    const d = new Date(weekRef)
    d.setDate(d.getDate() + delta * 7)
    setWeekRef(d)
    setSelectedDate(null)
    setOrders([])
  }

  const infoFor = (dateStr) => planning.find(p => p.date === dateStr)
  const selected = orders.find(o => o._id === selectedId) || null

  const moisLabel = days[0].toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">

      {/* Navigation de semaine */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => shiftWeek(-1)} title="Semaine précédente"
          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-purple-600 transition-colors">
          <ChevronLeft size={16} />
        </button>

        <div className="text-center min-w-0">
          <p className="text-sm font-black capitalize truncate" style={{ color: NAVY }}>{moisLabel}</p>
          <button onClick={() => { setWeekRef(new Date()); setSelectedDate(null) }}
            className="inline-flex items-center gap-1 text-[11px] font-bold py-1 px-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: PURPLE }}>
            <RotateCcw size={11} /> Semaine en cours
          </button>
        </div>

        <button onClick={() => shiftWeek(1)} title="Semaine suivante"
          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-purple-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Les 7 jours */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement du planning…
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map(d => {
            const ds     = toDateStr(d)
            const info   = infoFor(ds)
            const isToday= ds === today
            const active = selectedDate === ds
            const nb     = info?.total || 0

            return (
              <button key={ds} onClick={() => openDay(ds)}
                className="p-2.5 rounded-xl border-2 text-center transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: active ? PURPLE : isToday ? 'rgba(124,58,237,0.35)' : '#f0f0f4',
                  background:  active ? PURPLE : 'white',
                }}>
                <p className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: active ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                  {WEEKDAYS[d.getDay()].short}
                </p>
                <p className="text-lg font-black leading-tight"
                  style={{ color: active ? 'white' : isToday ? PURPLE : NAVY }}>
                  {d.getDate()}
                </p>
                {nb > 0 ? (
                  <span className="inline-block mt-1 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? 'rgba(255,255,255,0.25)' : (info.urgent > 0 ? '#fef2f2' : '#eff6ff'),
                      color:      active ? 'white' : (info.urgent > 0 ? '#ef4444' : '#2563eb'),
                    }}>
                    {nb}
                  </span>
                ) : (
                  <span className="inline-block mt-1 text-[10px]"
                    style={{ color: active ? 'rgba(255,255,255,0.5)' : '#d1d5db' }}>—</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Commandes du jour choisi */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays size={15} style={{ color: PURPLE }} />
            <p className="text-sm font-black" style={{ color: NAVY }}>
              {formatDayLabel(selectedDate)}
            </p>
            <span className="text-xs text-gray-400">
              {loadingDay ? '…' : `${orders.length} commande${orders.length > 1 ? 's' : ''}`}
            </span>
            {(() => {
              const p = infoFor(selectedDate)
              return p?.pieces ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#eff6ff', color: '#2563eb' }}>
                  {p.pieces.toLocaleString('fr-DZ')} pièces
                </span>
              ) : null
            })()}
          </div>

          {loadingDay ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
              <Loader2 size={15} className="animate-spin" /> Chargement…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Inbox size={22} style={{ color: PURPLE }} />
              </div>
              <p className="text-sm text-gray-400">Rien à fabriquer ce jour-là.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => (
                <OrderRow key={o._id} order={o} onOpen={x => setSelectedId(x._id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && !loading && (
        <p className="text-xs text-gray-400 text-center py-6">
          Choisissez un jour pour voir les commandes à fabriquer.
        </p>
      )}

      {/* Détail d'une commande (consultation) */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelectedId(null)}
          summaryOpts={{ showDesign: true, ...summaryOpts }}
          notesReadOnly={false}
          onTagsChanged={() => loadDay(selectedDate)}
        />
      )}
    </div>
  )
}

export default ProductionPlanning
