import { useState } from 'react'
import { Loader2, Truck, CheckCircle2, PackageCheck, History } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import StageBoard, { PageHeader } from '../../Components/staff/StageBoard'
import ServiceHistory from '../../Components/staff/ServiceHistory'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct } from '../../Components/staff/staffConfig'

function LivraisonActions({ order, removeOne }) {
  const [busy, setBusy] = useState(null)   // 'send' | 'manual'

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

  const packNote = order.pipeline?.packagingNotes?.trim()

  return (
    <div className="space-y-3">
      {/* Consigne laissée par l'emballage */}
      {packNote && (
        <div className="p-3 rounded-xl" style={{ background: '#ecfeff' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"
            style={{ color: '#0e7490' }}>
            <PackageCheck size={12} /> Note de l'emballage
          </p>
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: '#0e7490' }}>
            {packNote}
          </p>
        </div>
      )}

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
  const [view, setView] = useState('todo')   // todo | historique

  const tabs = (
    <div className="flex flex-wrap gap-2">
      {[
        { key: 'todo',       label: 'À expédier', icon: Truck,   color: '#10b981' },
        { key: 'historique', label: 'Historique', icon: History, color: '#6b7280' },
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
        <PageHeader eyebrow="Service livraison" title="Historique" />
        {tabs}
        <ServiceHistory service="livraison" summaryOpts={{ showDesign: true }} />
      </div>
    )
  }

  return (
    <StageBoard
      headerExtra={tabs}
      stage="livraison"
      eyebrow="Service livraison"
      title="Commandes à expédier"
      emptyText="Aucune commande prête à expédier."
      summaryOpts={{ showDesign: true, showMaterials: true }}
      service="livraison"
      readOnly={!canAct(role, 'livraison')}
      actions={LivraisonActions}
    />
  )
}

export default LivraisonPage
