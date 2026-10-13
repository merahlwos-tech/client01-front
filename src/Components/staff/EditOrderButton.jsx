// src/Components/staff/EditOrderButton.jsx
// Bouton « Modifier la commande », commun aux fiches où un service a ce droit.

import { Pencil } from 'lucide-react'
import { PURPLE } from './staffConfig'

function EditOrderButton({ order, onEdit, disabled = false }) {
  return (
    <button type="button" onClick={() => onEdit(order)} disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-purple-50 disabled:opacity-50"
      style={{ borderColor: 'rgba(124,58,237,0.3)', color: PURPLE }}>
      <Pencil size={14} /> Modifier la commande
    </button>
  )
}

export default EditOrderButton
