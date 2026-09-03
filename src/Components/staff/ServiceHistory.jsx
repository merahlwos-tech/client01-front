// src/Components/staff/ServiceHistory.jsx
// Historique d'un service, présenté sous forme de CALENDRIER : chaque jour
// porte le nombre de commandes traitées, un clic ouvre la journée. Les
// décomptes par statut servent aussi de filtre sur la liste affichée.

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Loader2, History, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import OrderRow from './OrderRow'
import OrderDetailModal from './OrderDetailModal'
import {
  NAVY, PURPLE, ORDER_STATUS, STATUS_KEYS, WEEKDAYS_ORDERED, WEEK_START,
  toDateStr, getPurgeCountdown, CANCELLED_RETENTION_DAYS,
} from './staffConfig'

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/* Décalage du fuseau de l'atelier, au format attendu par MongoDB (+01:00).
   Sans lui, une commande de 23 h serait comptée la veille. */
function tzOffset() {
  const mins = -new Date().getTimezoneOffset()
  const sign = mins >= 0 ? '+' : '-'
  const abs  = Math.abs(mins)
  const p    = (n) => String(n).padStart(2, '0')
  return `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`
}

/* Grille du mois, semaines commençant le SAMEDI comme partout dans l'atelier */
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

function ServiceHistory({
  service, tagScope = null, summaryOpts = {}, showQuantity = true,
  showPrice = true,          // designer, insolation et production ne voient pas les montants
  deletable = false,         // confirmatrice et designer peuvent supprimer
}) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [day, setDay]     = useState(null)          // 'YYYY-MM-DD' ou null = tout le mois
  const [statut, setStatut] = useState('total')     // total | confirmé | en attente | annulé

  const [jours, setJours]     = useState({})
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  /* Sélection pour suppression manuelle */
  const [picking, setPicking] = useState(false)
  const [picked, setPicked]   = useState([])
  const [deleting, setDeleting] = useState(false)

  const cells = useMemo(() => monthGrid(year, month), [year, month])

  /* Bornes envoyées au serveur : instants LOCAUX, donc le jour affiché est
     bien celui de l'atelier. */
  const range = useMemo(() => {
    if (day) {
      const [y, m, d] = day.split('-').map(Number)
      return {
        from: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
        to:   new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
      }
    }
    return {
      from: new Date(year, month, 1, 0, 0, 0, 0).toISOString(),
      to:   new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString(),
    }
  }, [year, month, day])

  /* Décomptes du mois pour colorer le calendrier */
  useEffect(() => {
    const from = new Date(year, month, 1, 0, 0, 0, 0).toISOString()
    const to   = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()
    staffApi.get('/workflow/history/calendar', {
      params: { service, from, to, tz: tzOffset() },
    })
      .then(r => setJours(r.data?.jours || {}))
      .catch(() => setJours({}))
  }, [service, year, month])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.get('/workflow/history', {
        params: { service, from: range.from, to: range.to },
      })
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement')
    } finally { setLoading(false) }
  }, [service, range])

  useEffect(() => { load() }, [load])

  /* Changer de mois ferme la journée ouverte : elle n'y est plus */
  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(null)
    setPicked([])
  }

  const counts = data?.counts || {}
  const allOrders = data?.orders || []

  // Le décompte cliqué filtre la liste : « Annulé » ne montre que les annulées
  const orders = statut === 'total'
    ? allOrders
    : allOrders.filter(o => o.status === statut)

  const selected = orders.find(o => o._id === selectedId) || null

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
      setPicked([]); setPicking(false)
      load()
      // Les décomptes du calendrier changent aussi
      const from = new Date(year, month, 1).toISOString()
      const to   = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()
      staffApi.get('/workflow/history/calendar', { params: { service, from, to, tz: tzOffset() } })
        .then(r => setJours(r.data?.jours || {})).catch(() => {})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setDeleting(false) }
  }

  const CHIPS = [
    { key: 'total', label: 'Total', color: PURPLE, value: counts.total ?? 0 },
    ...STATUS_KEYS.map(s => ({
      key: s, label: ORDER_STATUS[s].label, color: ORDER_STATUS[s].color, value: counts[s] ?? 0,
    })),
  ]

  const todayStr = toDateStr(today)

  return (
    <div className="space-y-5">

      {/* ── Calendrier du mois ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shiftMonth(-1)} title="Mois précédent"
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={17} />
          </button>
          <p className="text-sm font-black capitalize" style={{ color: NAVY }}>
            {MOIS[month]} {year}
          </p>
          <button onClick={() => shiftMonth(1)} title="Mois suivant"
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS_ORDERED.map(w => (
            <p key={w.day} className="text-[10px] font-bold uppercase text-center text-gray-400">
              {w.short}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map(d => {
            const key      = toDateStr(d)
            const inMonth  = d.getMonth() === month
            const info     = jours[key]
            const active   = day === key
            const isToday  = key === todayStr
            return (
              <button key={key} onClick={() => { setDay(active ? null : key); setPicked([]) }}
                className="aspect-square min-h-[38px] rounded-lg flex flex-col items-center justify-center transition-all"
                style={{
                  background: active ? PURPLE
                    : info ? 'rgba(124,58,237,0.08)' : 'transparent',
                  color: active ? 'white' : inMonth ? NAVY : '#d1d5db',
                  border: isToday && !active ? `1.5px solid ${PURPLE}` : '1.5px solid transparent',
                  opacity: inMonth ? 1 : 0.45,
                }}>
                <span className="text-xs font-bold leading-none">{d.getDate()}</span>
                {info && (
                  <span className="text-[10px] font-black leading-none mt-0.5"
                    style={{ color: active ? 'white' : PURPLE }}>
                    {info.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {day && (
          <button onClick={() => { setDay(null); setPicked([]) }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-gray-50"
            style={{ color: PURPLE }}>
            <X size={13} /> Voir tout le mois
          </button>
        )}
      </div>

      {/* ── Décomptes cliquables : ils filtrent la liste ── */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(c => {
          const active = statut === c.key
          return (
            <button key={c.key} onClick={() => setStatut(c.key)}
              className="flex-1 min-w-[80px] rounded-xl px-3 py-2.5 border-2 text-center transition-all"
              style={{
                borderColor: active ? c.color : '#f0f0f4',
                background:  active ? c.color + '10' : 'white',
              }}>
              <p className="text-lg font-black leading-none" style={{ color: c.color }}>
                {loading ? '…' : c.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                {c.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* ── Barre de sélection / suppression ── */}
      {deletable && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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

      {/* ── Commandes de la période ── */}
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
            {statut === 'total'
              ? (day ? 'Aucune commande ce jour-là.' : 'Aucune commande traitée ce mois-ci.')
              : `Aucune commande « ${ORDER_STATUS[statut]?.label} » sur cette période.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
            {orders.length} commande{orders.length > 1 ? 's' : ''}
            {statut !== 'total' && ` · ${ORDER_STATUS[statut]?.label}`}
          </p>
          {statut === 'annulé' && (
            <p className="text-[11px] px-3 py-2 rounded-xl" style={{ background: '#fffbeb', color: '#b45309' }}>
              Une commande annulée est définitivement supprimée {CANCELLED_RETENTION_DAYS} jours
              après son annulation — le délai restant est indiqué sur chaque ligne.
            </p>
          )}
          {orders.map(o => (
            <OrderRow key={o._id} order={o} tagScope={tagScope} showQuantity={showQuantity}
              showPrice={showPrice} service={service}
              selectable={picking} selected={picked.includes(o._id)} onToggleSelect={togglePick}
              purge={getPurgeCountdown(o)}
              onOpen={x => setSelectedId(x._id)} />
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelectedId(null)}
          summaryOpts={{ service, showPrice, ...summaryOpts }}
          notesReadOnly
          onTagsChanged={load}
        />
      )}
    </div>
  )
}

export default ServiceHistory
