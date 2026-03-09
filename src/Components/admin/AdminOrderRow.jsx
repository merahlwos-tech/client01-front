import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const STATUS_OPTIONS = [
  { value: 'en attente',  label: 'En attente',  color: '#9ca3af' },
  { value: 'confirmé',    label: 'Confirmé',    color: '#3b82f6' },
  { value: 'en livraison',label: 'En livraison',color: '#f59e0b' },
  { value: 'livré',       label: 'Livré',       color: '#10b981' },
  { value: 'retour',      label: 'Retour',      color: '#f97316' },
  { value: 'annulé',      label: 'Annulé',      color: '#ef4444' },
]

function AdminOrderRow({ order, onUpdated }) {
  const [status, setStatus] = useState(order.status || 'en attente')
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)

  const handleStatusChange = e => {
    setStatus(e.target.value)
    setDirty(e.target.value !== order.status)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/orders/${order._id}`, { status })
      toast.success('Statut mis à jour')
      setDirty(false)
      onUpdated?.({ ...order, status })
    } catch {
      toast.error('Erreur mise à jour')
      setStatus(order.status)
      setDirty(false)
    } finally { setSaving(false) }
  }

  const createdAt = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

  const currentStatus = STATUS_OPTIONS.find(o => o.value === status)

  return (
    <tr style={{ borderBottom: '1px solid #f9fafb' }}
      className="hover:bg-gray-50 transition-colors">

      {/* Client */}
      <td className="px-4 py-3">
        <p className="font-bold text-sm" style={{ color: NAVY }}>
          {order.customerInfo.firstName} {order.customerInfo.lastName}
        </p>
        <p className="text-gray-400 text-xs mt-0.5">{order.customerInfo.phone}</p>
      </td>

      {/* Localisation */}
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-sm text-gray-600">{order.customerInfo.wilaya}</p>
        <p className="text-gray-400 text-xs">{order.customerInfo.commune}</p>
      </td>

      {/* Articles */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="space-y-1 max-w-[200px]">
          {order.items.map((item, i) => (
            <p key={i} className="text-xs text-gray-500 truncate">
              {item.quantity}× {item.name}
              <span className="text-gray-400 ml-1">({item.size})</span>
              {item.doubleSided && <span className="text-purple-400 ml-1">r-v</span>}
            </p>
          ))}
        </div>
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span className="font-black text-lg" style={{ color: PURPLE }}>
          {(order.total ?? 0).toLocaleString('fr-DZ')}
          <span className="text-xs font-normal text-gray-400 ml-1">DA</span>
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-xs whitespace-nowrap">
        {createdAt}
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <select value={status} onChange={handleStatusChange}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 outline-none
                       bg-white cursor-pointer transition-all appearance-none pr-6"
            style={{ borderColor: currentStatus?.color || '#e5e7eb', color: currentStatus?.color || NAVY }}>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {dirty && (
            <button onClick={handleSave} disabled={saving}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PURPLE }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default AdminOrderRow