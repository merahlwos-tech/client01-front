// src/Components/staff/OrderDetailModal.jsx
// Détail complet d'une commande, ouvert depuis la liste.
// Les actions du service sont injectées via `children`.

import { X } from 'lucide-react'
import OrderSummary from './OrderSummary'
import TagPicker from './TagPicker'
import NotesThread from './NotesThread'
import CancelOrderButton from './CancelOrderButton'
import { NAVY, shortRef } from './staffConfig'

/* `onCancelled` : passer un callback suffit à donner au service le droit
   d'annuler la commande. Tous les panels l'utilisent. */
function OrderDetailModal({
  order, onClose, summaryOpts = {}, tagScope, onTagsChanged,
  showNotes = true, notesReadOnly = false, onCancelled, children,
}) {
  if (!order) return null

  return (
    /* C'est la CARTE qui défile, pas l'arrière-plan : sinon l'en-tête collant
       se fige sous le bord de l'écran et le contenu défile visiblement
       au-dessus de lui. `overflow-hidden` garantit que rien ne dépasse des
       coins arrondis. */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(30,27,75,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-full overflow-y-auto overflow-x-hidden"
        onClick={e => e.stopPropagation()}>

        {/* En-tête collant */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="min-w-0">
            <p className="font-black text-sm truncate" style={{ color: NAVY }}>
              {order.customerInfo?.firstName} {order.customerInfo?.lastName}
            </p>
            <p className="text-[11px] text-gray-400 font-mono">#{shortRef(order._id)}</p>
          </div>
          <button onClick={onClose} title="Fermer"
            className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <OrderSummary order={order} {...summaryOpts} />

          {/* Notes partagées entre tous les services */}
          {showNotes && (
            <div className="pt-4 border-t border-gray-100">
              <NotesThread order={order} onChanged={onTagsChanged} readOnly={notesReadOnly} />
            </div>
          )}

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

          {/* Annulation — chaque service peut sortir une commande du circuit */}
          {onCancelled && (
            <div className="pt-4 border-t border-gray-100">
              <CancelOrderButton order={order} onCancelled={onCancelled} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
