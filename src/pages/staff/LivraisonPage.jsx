import { useState } from 'react'
import { Loader2, Truck, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct } from '../../Components/staff/staffConfig'

function LivraisonActions({ order, removeOne }) {
  const [busy, setBusy] = useState(null) // 'send' | 'manual'

  const deliver = async (mode) => {
    setBusy(mode)
    try {
      const body = mode === 'manual' ? { skipEcotrack: true } : {}
      const res = await staffApi.post(`/workflow/orders/${order._id}/deliver`, body)
      const tracking = res.data?._ecotrackResult?.tracking
      toast.success(tracking ? `Expédiée — tracking ${tracking}` : 'Commande marquée livrée')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur d\'envoi')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      {order.ecotrackTracking && (
        <p className="text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: '#ecfdf5', color: '#059669' }}>
          Déjà envoyée — tracking {order.ecotrackTracking}
        </p>
      )}
      <button onClick={() => deliver('send')} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: '#10b981' }}>
        {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
        Envoyer à la livraison
      </button>
      <button onClick={() => deliver('manual')} disabled={!!busy}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
        {busy === 'manual' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        Marquer livrée (sans envoi)
      </button>
    </div>
  )
}

function LivraisonPage() {
  const { role } = useStaffAuth()
  return (
    <StageBoard
      stage="livraison"
      eyebrow="Service livraison"
      title="Commandes à expédier"
      emptyText="Aucune commande prête à expédier."
      summaryOpts={{ showDesign: true, showMaterials: true, showHistory: true }}
      readOnly={!canAct(role, 'livraison')}
      actions={LivraisonActions}
    />
  )
}

export default LivraisonPage
