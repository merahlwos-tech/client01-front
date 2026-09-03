// src/Components/staff/DayCalendarPicker.jsx
// Choix du jour de fabrication sur un CALENDRIER : le designer désigne une
// date précise plutôt qu'un simple jour de la semaine, et voit du même coup
// la charge déjà planifiée sur chaque journée pour répartir le travail.

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import staffApi from '../../utils/staffApi'
import {
  NAVY, PURPLE, WEEKDAYS_ORDERED, WEEK_START, toDateStr, todayStr, formatDayLabel,
} from './staffConfig'

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

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
    if (i % 7 === 6 && d.getMonth() !== month && d > first) break
  }
  return cells
}

function DayCalendarPicker({ value, onChange, label = 'Jour de fabrication' }) {
  const today = todayStr()
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()

  const [year, setYear]   = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())
  const [charge, setCharge] = useState({})   // { 'YYYY-MM-DD': {total, urgent} }

  const cells = useMemo(() => monthGrid(year, month), [year, month])

  /* Charge déjà planifiée sur le mois affiché */
  useEffect(() => {
    const from = toDateStr(new Date(year, month, 1))
    const to   = toDateStr(new Date(year, month + 1, 0))
    let alive = true
    staffApi.get('/workflow/production-planning', { params: { from, to } })
      .then(r => {
        if (!alive) return
        const map = {}
        ;(r.data || []).forEach(d => { map[d.date] = d })
        setCharge(map)
      })
      .catch(() => { if (alive) setCharge({}) })
    return () => { alive = false }
  }, [year, month])

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
        <CalendarDays size={12} /> {label}
      </p>

      <div className="rounded-xl bg-white border border-gray-100 p-2">
        <div className="flex items-center justify-between mb-1.5">
          <button type="button" onClick={() => shift(-1)} title="Mois précédent"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <p className="text-xs font-black capitalize" style={{ color: NAVY }}>
            {MOIS[month]} {year}
          </p>
          <button type="button" onClick={() => shift(1)} title="Mois suivant"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {WEEKDAYS_ORDERED.map(w => (
            <p key={w.day} className="text-[9px] font-bold uppercase text-center text-gray-400">
              {w.short}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(d => {
            const key     = toDateStr(d)
            const inMonth = d.getMonth() === month
            const active  = value === key
            const isToday = key === today
            const past    = key < today
            const load    = charge[key]
            return (
              <button key={key} type="button" onClick={() => onChange(key)}
                className="h-10 rounded-lg flex flex-col items-center justify-center transition-all"
                style={{
                  background: active ? PURPLE : load ? 'rgba(124,58,237,0.08)' : 'transparent',
                  color:      active ? 'white' : inMonth ? NAVY : '#d1d5db',
                  border: isToday && !active ? `1.5px solid ${PURPLE}` : '1.5px solid transparent',
                  /* Les dates passées restent choisissables (rattrapage) mais
                     s'effacent pour ne pas être sélectionnées par mégarde. */
                  opacity: !inMonth ? 0.4 : past ? 0.5 : 1,
                }}>
                <span className="text-[11px] font-bold leading-none">{d.getDate()}</span>
                {load && (
                  <span className="text-[9px] font-black leading-none mt-0.5"
                    style={{ color: active ? 'white' : load.urgent > 0 ? '#ef4444' : PURPLE }}>
                    {load.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {value && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          → fabrication le <span className="font-bold" style={{ color: NAVY }}>
            {formatDayLabel(value)}
          </span>
          {charge[value] && (
            <span> — {charge[value].total} commande{charge[value].total > 1 ? 's' : ''} déjà prévue{charge[value].total > 1 ? 's' : ''}</span>
          )}
        </p>
      )}
    </div>
  )
}

export default DayCalendarPicker
