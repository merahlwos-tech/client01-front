import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Send, Clock3, Timer, AlertTriangle, ListChecks, UserX,
  CheckCircle2, Factory, Undo2, CalendarDays, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import {
  canAct, PURPLE, NAVY, DESIGNER_TAGS, getCountdown,
  WEEKDAYS, nextDateForWeekday, formatDayLabel,
} from '../../Components/staff/staffConfig'

/* ── Compte à rebours de l'atelier ── */
function DeadlineBanner({ deadlineAt }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const cd = getCountdown(deadlineAt)
  if (!cd) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
        style={{ background: '#f3f4f6', color: '#6b7280' }}>
        <Clock3 size={14} /> Pas encore confirmée — compte à rebours non démarré
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black"
      style={{ background: cd.bg, color: cd.color }}>
      {cd.expired ? <AlertTriangle size={16} /> : <Timer size={16} />}
      {cd.expired
        ? <span>Délai dépassé de {cd.label.replace('Retard ', '')}</span>
        : <span>Temps restant : {cd.label}</span>}
    </div>
  )
}

/* ── Sélecteur du jour de fabrication ── */
function DaySelector({ value, onChange }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 flex items-center gap-1.5">
        <CalendarDays size={12} /> Jour de fabrication
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
        {WEEKDAYS.map(w => {
          const active = value === w.day
          return (
            <button key={w.day} type="button" onClick={() => onChange(w.day)}
              className="py-2 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: active ? PURPLE : '#f3f4f6',
                color:      active ? 'white' : '#6b7280',
              }}>
              {w.short}
            </button>
          )
        })}
      </div>
      {value != null && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          → fabrication le <span className="font-bold" style={{ color: NAVY }}>
            {formatDayLabel(nextDateForWeekday(value))}
          </span>
        </p>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   Vue « À traiter » — validation puis envoi
══════════════════════════════════════════════ */
function DesignActions({ order, removeOne, updateOne, onCountsChanged }) {
  const [notes, setNotes] = useState(order.pipeline?.design?.notes || '')
  const [day, setDay]     = useState(null)
  const [busy, setBusy]   = useState(null)

  const validated = !!order.pipeline?.designValidated
  const isSlow    = (order.pipeline?.designerTag || 'aucun') === 'reponses_lentes'
  const slowCfg   = DESIGNER_TAGS.reponses_lentes

  /* Valider / dévalider le design */
  const toggleValidate = async () => {
    setBusy('validate')
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/design-validate`,
        { validated: !validated, notes })
      toast.success(!validated ? 'Design validé' : 'Validation retirée')
      updateOne?.(res.data)
      onCountsChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(null) }
  }

  /* Envoyer en production avec le jour choisi */
  const sendToProduction = async () => {
    if (day == null) return toast.error('Choisissez le jour de fabrication')
    setBusy('send')
    try {
      await staffApi.post(`/workflow/orders/${order._id}/send-production`, {
        productionDate: nextDateForWeekday(day),
        productionDay:  day,
        notes,
      })
      toast.success(`Envoyée en production — ${formatDayLabel(nextDateForWeekday(day))}`)
      removeOne(order._id)
      onCountsChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(null) }
  }

  /* Étiquette client lent */
  const toggleTag = async () => {
    setBusy('tag')
    try {
      await staffApi.patch(`/workflow/orders/${order._id}/designer-tag`,
        { designerTag: isSlow ? 'aucun' : 'reponses_lentes' })
      toast.success(isSlow ? 'Client réactivé' : 'Client mis dans « réponses lentes »')
      removeOne(order._id)
      onCountsChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <DeadlineBanner deadlineAt={order.pipeline?.deadlineAt} />

      {/* Étape 1 — validation */}
      <button onClick={toggleValidate} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50"
        style={{
          borderColor: validated ? '#10b981' : '#e5e7eb',
          background:  validated ? '#10b981' : 'white',
          color:       validated ? 'white'   : '#6b7280',
        }}>
        {busy === 'validate' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        {validated ? 'Design validé — annuler la validation' : 'Marquer mon travail comme validé'}
      </button>

      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder="Note pour la production (facultatif)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

      {/* Étape 2 — envoi planifié (uniquement une fois validé) */}
      {validated ? (
        <div className="space-y-2 p-3 rounded-xl" style={{ background: '#faf9ff' }}>
          <DaySelector value={day} onChange={setDay} />
          <button onClick={sendToProduction} disabled={!!busy || day == null}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: PURPLE }}>
            {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Envoyer à la production
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 text-center">
          Validez votre travail pour pouvoir l'envoyer à la production.
        </p>
      )}

      {/* Client lent */}
      <button onClick={toggleTag} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-50"
        style={{
          borderColor: isSlow ? slowCfg.color : '#e5e7eb',
          background:  isSlow ? slowCfg.color : 'white',
          color:       isSlow ? 'white'       : '#9ca3af',
        }}>
        {busy === 'tag' ? <Loader2 size={13} className="animate-spin" /> : <Clock3 size={13} />}
        {isSlow ? 'Client réactif — remettre dans la liste' : 'Client lent à répondre'}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════
   Vue « Envoyé à la production »
══════════════════════════════════════════════ */
function SentActions({ order, removeOne, updateOne, onCountsChanged }) {
  const [day, setDay]   = useState(order.pipeline?.productionDay ?? null)
  const [busy, setBusy] = useState(null)

  const reschedule = async () => {
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

  const pullBack = async () => {
    setBusy('pull')
    try {
      await staffApi.post(`/workflow/orders/${order._id}/pull-back`)
      toast.success('Commande retirée de la production')
      removeOne(order._id)
      onCountsChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBusy(null)
    }
  }

  const planned = order.pipeline?.productionDate

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: '#eff6ff', color: '#2563eb' }}>
        <Factory size={15} />
        Fabrication prévue : {planned ? formatDayLabel(planned) : '—'}
      </div>

      <div className="p-3 rounded-xl space-y-2" style={{ background: '#faf9ff' }}>
        <DaySelector value={day} onChange={setDay} />
        <button onClick={reschedule}
          disabled={!!busy || day == null || day === order.pipeline?.productionDay}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-40"
          style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
          {busy === 'day' ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
          Replanifier
        </button>
      </div>

      <button onClick={pullBack} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-red-50 disabled:opacity-50"
        style={{ borderColor: '#fecaca', color: '#ef4444' }}>
        {busy === 'pull' ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
        Ne pas donner à la production
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
function DesignerPage() {
  const { role } = useStaffAuth()
  const [view, setView]     = useState('todo')   // todo | sent | slow
  const [counts, setCounts] = useState(null)

  const refreshCounts = useCallback(() => {
    staffApi.get('/workflow/orders/counters')
      .then(r => setCounts(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => { refreshCounts() }, [refreshCounts])

  const TABS = [
    { key: 'todo', label: 'À traiter',            icon: ListChecks, count: counts ? counts.aTraiter + counts.validees : null, color: PURPLE },
    { key: 'sent', label: 'Envoyé à la production', icon: Factory,  count: counts?.enProduction, color: '#2563eb' },
    { key: 'slow', label: 'Clients lents',         icon: UserX,     count: counts?.slow, color: DESIGNER_TAGS.reponses_lentes.color },
  ]

  const tabs = (
    <div className="flex flex-wrap gap-2">
      {TABS.map(t => {
        const active = view === t.key
        const Icon = t.icon
        return (
          <button key={t.key} onClick={() => setView(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: active ? t.color : '#f3f4f6',
              color:      active ? 'white' : '#6b7280',
            }}>
            <Icon size={15} />
            {t.label}{t.count != null ? ` (${t.count})` : ''}
          </button>
        )
      })}
    </div>
  )

  const CONFIG = {
    todo: {
      stage: 'design', params: { slow: 0 },
      title: 'Commandes à designer',
      empty: 'Aucune commande en attente de design.',
      actions: DesignActions,
    },
    sent: {
      stage: 'production', params: {},
      title: 'Envoyées à la production',
      empty: 'Aucune commande en attente chez la production.',
      actions: SentActions,
    },
    slow: {
      stage: 'design', params: { slow: 1 },
      title: 'Clients lents à répondre',
      empty: 'Aucun client signalé comme lent à répondre.',
      actions: DesignActions,
    },
  }
  const cfg = CONFIG[view]

  return (
    <StageBoard
      key={view}
      stage={cfg.stage}
      eyebrow="Service design"
      title={cfg.title}
      emptyText={cfg.empty}
      summaryOpts={{ showHistory: true }}
      readOnly={!canAct(role, 'design')}
      actions={cfg.actions}
      actionProps={{ onCountsChanged: refreshCounts }}
      extraParams={cfg.params}
      headerExtra={tabs}
    />
  )
}

export default DesignerPage
