import { useState } from 'react'
import { Loader2, PackageCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
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
  return (
    <StageBoard
      stage="emballage"
      eyebrow="Service emballage"
      title="Commandes à emballer"
      emptyText="Aucune commande à emballer."
      summaryOpts={{ showDesign: true, showMaterials: true, showHistory: true }}
      layout="cards"
      readOnly={!canAct(role, 'emballage')}
      actions={EmballageActions}
    />
  )
}

export default EmballagePage
