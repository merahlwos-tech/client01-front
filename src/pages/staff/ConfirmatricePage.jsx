import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct } from '../../Components/staff/staffConfig'

function ConfirmActions(order, { removeOne }) {
  const [busy, setBusy] = useState(null) // 'confirm' | 'cancel'

  const act = async (type) => {
    setBusy(type)
    try {
      await staffApi.post(`/workflow/orders/${order._id}/${type}`)
      toast.success(type === 'confirm' ? 'Commande confirmée → design' : 'Commande annulée')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act('confirm')} disabled={!!busy}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: '#10b981' }}>
        {busy === 'confirm' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        Confirmer
      </button>
      <button onClick={() => act('cancel')} disabled={!!busy}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-red-50 disabled:opacity-50"
        style={{ borderColor: '#fecaca', color: '#ef4444' }}>
        {busy === 'cancel' ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
        Annuler
      </button>
    </div>
  )
}

function ConfirmatricePage() {
  const { role } = useStaffAuth()
  return (
    <StageBoard
      stage="confirmation"
      eyebrow="Service confirmation"
      title="Commandes à confirmer"
      emptyText="Aucune nouvelle commande à confirmer."
      summaryOpts={{ showHistory: true }}
      readOnly={!canAct(role, 'confirmation')}
      renderActions={ConfirmActions}
    />
  )
}

export default ConfirmatricePage
