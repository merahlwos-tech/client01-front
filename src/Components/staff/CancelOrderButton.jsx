// src/Components/staff/CancelOrderButton.jsx
// Annulation d'une commande — disponible dans TOUS les services.
// Une commande annulée est définitivement supprimée un mois plus tard.

import { useState } from 'react'
import { Ban, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { CANCELLED_RETENTION_DAYS } from './staffConfig'

function CancelOrderButton({ order, onCancelled }) {
  const [busy, setBusy] = useState(false)

  const already = order?.pipeline?.stage === 'annulee'
  // Matières déjà déduites pour elle : l'annulation les remet en stock
  const hasMaterials = (order?.pipeline?.materialsUsed || []).length > 0

  const cancel = async () => {
    if (!window.confirm(
      'Annuler cette commande ?\n\n'
      + `Elle sortira du circuit et sera définitivement supprimée dans ${CANCELLED_RETENTION_DAYS} jours.`
      + (hasMaterials ? '\n\nSes matières seront remises en stock.' : '')
    )) return
    setBusy(true)
    try {
      const res = await staffApi.post(`/workflow/orders/${order._id}/cancel`)
      const returned = hasMaterials && (res.data?.pipeline?.materialsUsed || []).length === 0
      toast.success(returned ? 'Commande annulée — matières remises en stock' : 'Commande annulée')
      onCancelled?.(res.data, order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
      setBusy(false)
    }
  }

  if (already) {
    return (
      <p className="flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl"
        style={{ background: '#fef2f2', color: '#ef4444' }}>
        <Ban size={13} /> Commande annulée
      </p>
    )
  }

  return (
    <button onClick={cancel} disabled={busy}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-red-50 disabled:opacity-50"
      style={{ borderColor: '#fecaca', color: '#ef4444' }}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
      Annuler la commande
    </button>
  )
}

export default CancelOrderButton
