// src/Components/staff/ProductionPlanning.jsx
// Emploi du temps de la fabrication, en semaine ou en mois. Un clic sur un
// jour affiche les commandes à faire ce jour-là ; une commande se saisit à la
// souris et se lâche sur une autre journée pour la replanifier.

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Loader2, ChevronLeft, ChevronRight, CalendarDays, Inbox, RotateCcw, Undo2,
  CalendarRange,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from './OrderRow'
import OrderDetailModal from './OrderDetailModal'
import DayCalendarPicker from './DayCalendarPicker'
import {
  NAVY, PURPLE, WEEKDAYS, WEEKDAYS_ORDERED, WEEK_START,
  toDateStr, todayStr, formatDayLabel, weekdayOf,
} from './staffConfig'

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/* Les 7 jours de la semaine contenant `ref` — l'atelier va du samedi au vendredi */
function weekDays(ref) {
  const start = new Date(ref)
  start.setDate(ref.getDate() - ((ref.getDay() - WEEK_START + 7) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/* Grille du mois, semaines commençant le samedi — même découpage que l'historique */
function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() - WEEK_START + 7) % 7))

  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push(d)
    // On s'arrête dès qu'une semaine entière dépasse le mois
    if (i % 7 === 6 && d.getMonth() !== month && d > first) break
  }
  return cells
}

/* Replanification depuis le planning : c'est ici qu'on a la vision d'ensemble
   des journées, donc l'endroit naturel pour rééquilibrer la charge. */
function PlanningActions({ order, onDone }) {
  const [date, setDate] = useState(order.pipeline?.productionDate || null)
  const [busy, setBusy] = useState(null)

  const replanifier = async () => {
    if (!date) return
    setBusy('day')
    try {
      await staffApi.patch(`/workflow/orders/${order._id}/production-day`, {
        productionDate: date,
        productionDay:  weekdayOf(date),
      })
      toast.success(`Replanifiée — ${formatDayLabel(date)}`)
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(null) }
  }

  const retirer = async () => {
    if (!window.confirm('Retirer cette commande de la production ?')) return
    setBusy('pull')
    try {
      await staffApi.post(`/workflow/orders/${order._id}/pull-back`)
      toast.success('Commande retirée de la production')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl space-y-2" style={{ background: '#faf9ff' }}>
        <DayCalendarPicker value={date} onChange={setDate} label="Date de fabrication" />
        <button onClick={replanifier}
          disabled={!!busy || !date || date === order.pipeline?.productionDate}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: PURPLE }}>
          {busy === 'day' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
          Replanifier
        </button>
      </div>

      <button onClick={retirer} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-red-50 disabled:opacity-50"
        style={{ borderColor: '#fecaca', color: '#ef4444' }}>
        {busy === 'pull' ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
        Ne pas donner à la production
      </button>
    </div>
  )
}

const VUES = [
  { key: 'semaine', label: 'Semaine', icon: CalendarDays },
  { key: 'mois',    label: 'Mois',    icon: CalendarRange },
]

function ProductionPlanning({ summaryOpts = {}, readOnly = false }) {
  const [vue, setVue]           = useState('semaine')
  const [ref, setRef]           = useState(() => new Date())
  const [planning, setPlanning] = useState([])       // [{date,total,urgent,pieces}]
  const [loading, setLoading]   = useState(true)

  const [selectedDate, setSelectedDate] = useState(null)
  const [orders, setOrders]     = useState([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const today = todayStr()

  const days  = useMemo(() => weekDays(ref), [ref])
  const cells = useMemo(() => monthGrid(ref.getFullYear(), ref.getMonth()), [ref])

  /* Intervalle interrogé : la semaine affichée, ou le mois entier */
  const from = vue === 'semaine' ? toDateStr(days[0]) : toDateStr(cells[0])
  const to   = vue === 'semaine' ? toDateStr(days[6]) : toDateStr(cells[cells.length - 1])

  const loadPlanning = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.get('/workflow/production-planning', {
        params: { from, to },
      })
      setPlanning(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement du planning')
    } finally { setLoading(false) }
  }, [from, to])

  useEffect(() => { loadPlanning() }, [loadPlanning])

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

  /* Une flèche avance d'une semaine ou d'un mois, selon la vue */
  const shift = (delta) => {
    const d = new Date(ref)
    if (vue === 'semaine') d.setDate(d.getDate() + delta * 7)
    else                   d.setMonth(d.getMonth() + delta, 1)
    setRef(d)
    setSelectedDate(null)
    setOrders([])
  }

  const infoFor = (dateStr) => planning.find(p => p.date === dateStr)
  const selected = orders.find(o => o._id === selectedId) || null

  /* ── Glisser-déposer : on saisit une commande et on la lâche sur un jour ── */
  const [dragged, setDragged]   = useState(null)
  const [hoverDay, setHoverDay] = useState(null)

  const dropOnDay = async (dateStr, weekday) => {
    setHoverDay(null)
    const order = dragged
    setDragged(null)
    if (!order || order.pipeline?.productionDate === dateStr) return

    try {
      await staffApi.patch(`/workflow/orders/${order._id}/production-day`, {
        productionDate: dateStr,
        productionDay:  weekday,
      })
      toast.success(`Déplacée au ${formatDayLabel(dateStr)}`)
      loadPlanning()
      if (selectedDate) loadDay(selectedDate)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  // Attributs de dépôt communs aux deux vues
  const dropProps = (ds, weekday) => ({
    onDragOver:  (e) => { if (dragged) { e.preventDefault(); setHoverDay(ds) } },
    onDragLeave: () => setHoverDay(h => h === ds ? null : h),
    onDrop:      (e) => { e.preventDefault(); dropOnDay(ds, weekday) },
  })

  const titre = vue === 'semaine'
    ? ref.toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' })
    : `${MOIS[ref.getMonth()]} ${ref.getFullYear()}`

  return (
    <div className="space-y-5">

      {/* Semaine ou mois */}
      <div className="flex flex-wrap gap-2">
        {VUES.map(v => {
          const Icon = v.icon
          const active = vue === v.key
          return (
            <button key={v.key}
              onClick={() => { setVue(v.key); setSelectedDate(null); setOrders([]) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: active ? PURPLE : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
              <Icon size={15} /> {v.label}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => shift(-1)}
          title={vue === 'semaine' ? 'Semaine précédente' : 'Mois précédent'}
          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-purple-600 transition-colors">
          <ChevronLeft size={16} />
        </button>

        <div className="text-center min-w-0">
          <p className="text-sm font-black capitalize truncate" style={{ color: NAVY }}>{titre}</p>
          <button onClick={() => { setRef(new Date()); setSelectedDate(null) }}
            className="inline-flex items-center gap-1 text-[11px] font-bold py-1 px-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: PURPLE }}>
            <RotateCcw size={11} /> {vue === 'semaine' ? 'Semaine en cours' : 'Mois en cours'}
          </button>
        </div>

        <button onClick={() => shift(1)}
          title={vue === 'semaine' ? 'Semaine suivante' : 'Mois suivant'}
          className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-purple-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement du planning…
        </div>
      ) : vue === 'semaine' ? (
        /* ── Les 7 jours de la semaine ── */
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map(d => {
            const ds      = toDateStr(d)
            const info    = infoFor(ds)
            const isToday = ds === today
            const active  = selectedDate === ds
            const nb      = info?.total || 0
            const survole = hoverDay === ds
            return (
              <button key={ds} onClick={() => openDay(ds)} {...dropProps(ds, d.getDay())}
                className="p-2.5 rounded-xl border-2 text-center transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: survole ? '#10b981'
                    : active ? PURPLE : isToday ? 'rgba(124,58,237,0.35)' : '#f0f0f4',
                  background:  survole ? '#ecfdf5' : active ? PURPLE : 'white',
                  transform:   survole ? 'scale(1.06)' : undefined,
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
      ) : (
        /* ── Le mois entier, comme le calendrier de l'historique ── */
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_ORDERED.map(w => (
              <p key={w.day} className="text-[10px] font-bold uppercase text-center text-gray-400">
                {w.short}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map(d => {
              const ds      = toDateStr(d)
              const info    = infoFor(ds)
              const inMonth = d.getMonth() === ref.getMonth()
              const isToday = ds === today
              const active  = selectedDate === ds
              const survole = hoverDay === ds
              return (
                /* Hauteur fixe : `aspect-square` étirerait chaque case à la
                   largeur d'un septième du panneau. */
                <button key={ds} onClick={() => openDay(ds)} {...dropProps(ds, d.getDay())}
                  className="h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center transition-all"
                  style={{
                    background: survole ? '#ecfdf5'
                      : active ? PURPLE
                      : info ? 'rgba(124,58,237,0.08)' : 'transparent',
                    color: active ? 'white' : inMonth ? NAVY : '#d1d5db',
                    border: survole ? '1.5px solid #10b981'
                      : isToday && !active ? `1.5px solid ${PURPLE}` : '1.5px solid transparent',
                    opacity: inMonth ? 1 : 0.45,
                    transform: survole ? 'scale(1.08)' : undefined,
                  }}>
                  <span className="text-xs font-bold leading-none">{d.getDate()}</span>
                  {info && (
                    <span className="text-[10px] font-black leading-none mt-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)'
                          : info.urgent > 0 ? '#fef2f2' : '#eff6ff',
                        color: active ? 'white' : info.urgent > 0 ? '#ef4444' : '#2563eb',
                      }}>
                      {info.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
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
                /* Chaque commande se saisit à la souris et se lâche sur un jour */
                <div key={o._id}
                  draggable={!readOnly}
                  onDragStart={() => setDragged(o)}
                  onDragEnd={() => { setDragged(null); setHoverDay(null) }}
                  className={readOnly ? '' : 'cursor-grab active:cursor-grabbing'}
                  style={{ opacity: dragged?._id === o._id ? 0.4 : 1 }}>
                  <OrderRow order={o} service="designer" showPrice={false}
                    onOpen={x => setSelectedId(x._id)} />
                </div>
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
          onTagsChanged={() => loadDay(selectedDate)}>
          {!readOnly && (
            <PlanningActions order={selected} onDone={() => {
              setSelectedId(null)
              loadPlanning()                   // les compteurs des jours changent
              if (selectedDate) loadDay(selectedDate)
            }} />
          )}
        </OrderDetailModal>
      )}
    </div>
  )
}

export default ProductionPlanning
