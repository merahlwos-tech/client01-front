import { useState } from 'react'
import { Loader2, PackageCheck, History } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard, { PageHeader } from '../../Components/staff/StageBoard'
import ServiceHistory from '../../Components/staff/ServiceHistory'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct } from '../../Components/staff/staffConfig'

function EmballageActions({ order, removeOne }) {
  const [notes, setNotes]     = useState('')
  const [sending, setSending] = useState(false)

  const finish = async () => {
    setSending(true)
    try {
      await staffApi.post(`/workflow/orders/${order._id}/package`, { notes })
      toast.success('Emballage terminé — commande clôturée')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Note d'emballage — enregistrée sur la commande et consultable
          ensuite par le service qui gère l'expédition */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          Note d'emballage
        </p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Ex. colis fragile, 2 cartons, remis en main propre…"
          className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />
        <p className="text-[11px] text-gray-400 mt-1">
          Visible sur la commande pour le service de livraison.
        </p>
      </div>
      <button onClick={finish} disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: '#06b6d4' }}>
        {sending ? <Loader2 size={15} className="animate-spin" /> : <PackageCheck size={15} />}
        Emballage terminé
      </button>
    </div>
  )
}

function EmballagePage() {
  const { role } = useStaffAuth()
  const [view, setView] = useState('todo')   // todo | historique

  const tabs = (
    <div className="flex flex-wrap gap-2">
      {[
        { key: 'todo',       label: 'À emballer', icon: PackageCheck, color: '#06b6d4' },
        { key: 'historique', label: 'Historique', icon: History,      color: '#6b7280' },
      ].map(t => {
        const active = view === t.key
        const Icon = t.icon
        return (
          <button key={t.key} onClick={() => setView(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: active ? t.color : '#f3f4f6', color: active ? 'white' : '#6b7280' }}>
            <Icon size={15} /> {t.label}
          </button>
        )
      })}
    </div>
  )

  if (view === 'historique') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader eyebrow="Service emballage" title="Historique" />
        {tabs}
        <ServiceHistory service="emballage"
          summaryOpts={{ showDesign: true, showMaterials: true }} />
      </div>
    )
  }

  return (
    <StageBoard
      headerExtra={tabs}
      stage="emballage"
      eyebrow="Service emballage"
      title="Commandes à emballer"
      emptyText="Aucune commande à emballer."
      summaryOpts={{ showDesign: true, showMaterials: true }}
      layout="cards"
      readOnly={!canAct(role, 'emballage')}
      actions={EmballageActions}
    />
  )
}

export default EmballagePage
