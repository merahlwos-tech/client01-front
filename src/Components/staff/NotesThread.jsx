// src/Components/staff/NotesThread.jsx
// Fil de notes partagé : n'importe quel service peut écrire, tous les
// services voient les notes avec leur auteur.

import { useState } from 'react'
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { NAVY, PURPLE, ROLE_LABELS, isSuperadmin } from './staffConfig'

function NotesThread({ order, onChanged, readOnly = false }) {
  const { user, role } = useStaffAuth()
  const [text, setText]   = useState('')
  const [busy, setBusy]   = useState(false)

  const notes = order.pipeline?.notes || []

  const add = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const res = await staffApi.post(`/workflow/orders/${order._id}/notes`, { text: text.trim() })
      setText('')
      onChanged?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  const remove = async (note) => {
    try {
      const res = await staffApi.delete(`/workflow/orders/${order._id}/notes/${note._id}`)
      onChanged?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const canDelete = (note) =>
    isSuperadmin(role) || (note.by && note.by === user?.username)

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
        <MessageSquare size={12} /> Notes de l'équipe
        {notes.length > 0 && <span className="text-gray-300">({notes.length})</span>}
      </p>

      {/* Fil */}
      {notes.length > 0 && (
        <div className="space-y-2 mb-3">
          {notes.map(note => (
            <div key={note._id} className="group p-2.5 rounded-xl relative" style={{ background: '#f9fafb' }}>
              <p className="text-sm whitespace-pre-wrap break-words" style={{ color: NAVY }}>
                {note.text}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                <span className="font-bold" style={{ color: PURPLE }}>
                  {ROLE_LABELS[note.role] || note.role || 'Équipe'}
                </span>
                {note.by ? ` · ${note.by}` : ''}
                {' · '}
                {new Date(note.at).toLocaleString('fr-DZ', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {!readOnly && canDelete(note) && (
                <button onClick={() => remove(note)} title="Supprimer ma note"
                  className="absolute top-2 right-2 p-1 rounded-lg text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajout */}
      {!readOnly && (
        <form onSubmit={add} className="flex gap-2 items-end">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={500}
            placeholder="Ajouter une note visible par tous les services…"
            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />
          <button type="submit" disabled={busy || !text.trim()}
            className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
            style={{ background: PURPLE }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      )}

      {readOnly && notes.length === 0 && (
        <p className="text-xs text-gray-300 italic">Aucune note</p>
      )}
    </div>
  )
}

export default NotesThread
