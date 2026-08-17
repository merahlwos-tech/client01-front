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
      toast.success('Emballage terminé → livraison')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder="Notes d'emballage (optionnel)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />
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
      readOnly={!canAct(role, 'emballage')}
      actions={EmballageActions}
    />
  )
}

export default EmballagePage
