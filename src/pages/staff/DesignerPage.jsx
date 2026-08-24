import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, Send, Clock3, Timer, AlertTriangle, ListChecks, UserX,
  CheckCircle2, Factory, Undo2, CalendarDays, RotateCcw, Boxes, History,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard, { PageHeader } from '../../Components/staff/StageBoard'
import ProductionPlanning from '../../Components/staff/ProductionPlanning'
import ServiceHistory from '../../Components/staff/ServiceHistory'
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
/* `mode` : 'todo' = travail en cours (on valide seulement)
            'traitees' = travail fini (on planifie et on envoie) */
function DesignActions({ order, removeOne, updateOne, onCountsChanged, mode = 'todo' }) {
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
      await staffApi.patch(`/workflow/orders/${order._id}/design-validate`,
        { validated: !validated, notes })
      toast.success(!validated
        ? 'Commande traitée — elle passe dans « Commandes traitées »'
        : 'Validation retirée — retour dans « À traiter »')
      removeOne(order._id)      // elle change de liste
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

      {/* Liste « À traiter » : il termine son travail, rien de plus.
          La planification se fait ensuite depuis « Commandes traitées ». */}
      {mode === 'todo' ? (
        <>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Note pour la production (facultatif)"
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

          <button onClick={toggleValidate} disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#10b981' }}>
            {busy === 'validate' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Travail terminé
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            La commande passera dans « Commandes traitées », où vous choisirez
            son jour de fabrication.
          </p>
        </>
      ) : (
        /* Liste « Commandes traitées » : planification et envoi */
        <>
          <div className="space-y-2 p-3 rounded-xl" style={{ background: '#faf9ff' }}>
            <DaySelector value={day} onChange={setDay} />
            <button onClick={sendToProduction} disabled={!!busy || day == null}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: PURPLE }}>
              {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Ajouter au planning de production
            </button>
          </div>

          <button onClick={toggleValidate} disabled={!!busy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-50"
            style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
            {busy === 'validate' ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
            Reprendre le travail
          </button>
        </>
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
    { key: 'todo',     label: 'À traiter',             icon: ListChecks,   count: counts?.aTraiter, color: PURPLE },
    { key: 'traitees', label: 'Commandes traitées',    icon: CheckCircle2, count: counts?.validees, color: '#10b981' },
    { key: 'sent',     label: 'Envoyé à la production', icon: Factory,     count: counts?.enProduction, color: '#2563eb' },
    { key: 'planning', label: 'Planning production',    icon: CalendarDays, count: null, color: '#0ea5e9' },
    { key: 'slow',     label: 'Clients lents',          icon: UserX,       count: counts?.slow, color: DESIGNER_TAGS.reponses_lentes.color },
    { key: 'historique', label: 'Historique',           icon: History,     count: null, color: '#6b7280' },
  ]

  const tabs = (
    <div className="flex flex-wrap gap-2 items-center">
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

      {/* Consultation du stock — le designer n'a pas les droits de modification */}
      <Link to="/stock?from=designer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-purple-50 ml-auto"
        style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
        <Boxes size={15} /> Voir le stock
      </Link>
    </div>
  )

  const CONFIG = {
    todo: {
      stage: 'design', params: { slow: 0, validated: 0 },
      title: 'Commandes à designer',
      empty: 'Aucune commande en attente de design.',
      actions: DesignActions,
    },
    traitees: {
      stage: 'design', params: { slow: 0, validated: 1 },
      title: 'Commandes traitées',
      empty: 'Aucune commande traitée en attente de planification.',
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

  /* Le planning a sa propre mise en page (semaine + jour sélectionné) :
     il ne passe donc pas par StageBoard. */
  if (view === 'planning') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader eyebrow="Service design" title="Planning de fabrication" />
        {tabs}
        <ProductionPlanning />
      </div>
    )
  }

  if (view === 'historique') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader eyebrow="Service design" title="Historique" />
        {tabs}
        <ServiceHistory service="designer" tagScope="designer"
          summaryOpts={{ showDesign: true }} />
      </div>
    )
  }

  return (
    <StageBoard
      key={view}
      stage={cfg.stage}
      eyebrow="Service design"
      title={cfg.title}
      emptyText={cfg.empty}
      summaryOpts={{}}
      readOnly={!canAct(role, 'design')}
      actions={cfg.actions}
      /* La liste des clients lents garde les actions de travail */
      actionProps={{ onCountsChanged: refreshCounts,
                     mode: view === 'traitees' ? 'traitees' : 'todo' }}
      extraParams={cfg.params}
      headerExtra={tabs}
      layout="list"
      tagScope="designer"
    />
  )
}

export default DesignerPage
