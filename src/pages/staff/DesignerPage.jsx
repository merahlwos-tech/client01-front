import { useState, useEffect } from 'react'
import { Loader2, Send, Clock3, Timer, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import {
  canAct, PURPLE, NAVY, URGENCY, DESIGNER_TAGS, getCountdown,
} from '../../Components/staff/staffConfig'

/* Rappel du délai restant, mis en avant en haut de la carte */
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

function DesignActions({ order, removeOne, updateOne }) {
  const [notes, setNotes]   = useState('')
  const [sending, setSending] = useState(false)
  const [tagging, setTagging] = useState(false)

  const tag = order.pipeline?.designerTag || 'aucun'
  const isSlow = tag === 'reponses_lentes'

  /* Étiquette « réponses lentes » — bascule on/off */
  const toggleTag = async () => {
    setTagging(true)
    const next = isSlow ? 'aucun' : 'reponses_lentes'
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/designer-tag`, { designerTag: next })
      toast.success(next === 'aucun' ? 'Étiquette retirée' : 'Client signalé « réponses lentes »')
      updateOne?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setTagging(false)
    }
  }

  /* Travail terminé → production (aucun fichier n'est envoyé) */
  const submit = async () => {
    setSending(true)
    try {
      await staffApi.post(`/workflow/orders/${order._id}/design`, { notes })
      toast.success('Commande envoyée en production')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const slowCfg = DESIGNER_TAGS.reponses_lentes

  return (
    <div className="space-y-3">
      <DeadlineBanner deadlineAt={order.pipeline?.deadlineAt} />

      {/* Étiquette designer */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Mon étiquette
        </p>
        <button onClick={toggleTag} disabled={tagging}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50"
          style={{
            borderColor: isSlow ? slowCfg.color : '#e5e7eb',
            background:  isSlow ? slowCfg.color : 'white',
            color:       isSlow ? 'white'       : '#6b7280',
          }}>
          {tagging ? <Loader2 size={14} className="animate-spin" /> : <Clock3 size={14} />}
          {isSlow ? 'Client « réponses lentes » — retirer' : 'Signaler « réponses lentes »'}
        </button>
      </div>

      {/* Note facultative pour la production */}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder="Note pour la production (facultatif)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

      <button onClick={submit} disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: PURPLE }}>
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        Travail terminé — envoyer en production
      </button>
    </div>
  )
}

function DesignerPage() {
  const { role } = useStaffAuth()
  return (
    <StageBoard
      stage="design"
      eyebrow="Service design"
      title="Commandes à designer"
      emptyText="Aucune commande en attente de design."
      summaryOpts={{ showHistory: true }}
      readOnly={!canAct(role, 'design')}
      actions={DesignActions}
    />
  )
}

export default DesignerPage
