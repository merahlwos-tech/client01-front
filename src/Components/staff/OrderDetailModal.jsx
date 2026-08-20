// src/Components/staff/OrderDetailModal.jsx
// Détail complet d'une commande, ouvert depuis la liste.
// Les actions du service sont injectées via `children`.

import { X } from 'lucide-react'
import OrderSummary from './OrderSummary'
import TagPicker from './TagPicker'
import { NAVY, shortRef } from './staffConfig'

function OrderDetailModal({ order, onClose, summaryOpts = {}, tagScope, onTagsChanged, children }) {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(30,27,75,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4"
        onClick={e => e.stopPropagation()}>

        {/* En-tête collant */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="min-w-0">
            <p className="font-black text-sm truncate" style={{ color: NAVY }}>
              {order.customerInfo?.firstName} {order.customerInfo?.lastName}
            </p>
            <p className="text-[11px] text-gray-400 font-mono">#{shortRef(order._id)}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <OrderSummary order={order} {...summaryOpts} />

          {/* Étiquettes personnalisées du service */}
          {tagScope && (
            <div className="pt-4 border-t border-gray-100">
              <TagPicker order={order} scope={tagScope} onChanged={onTagsChanged} />
            </div>
          )}

          {/* Actions du service */}
          {children && (
            <div className="pt-4 border-t border-gray-100">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
