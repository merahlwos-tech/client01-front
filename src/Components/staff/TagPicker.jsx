// src/Components/staff/TagPicker.jsx
// Étiquettes personnalisées : chaque service crée les siennes, puis les
// applique aux commandes. `scope` = 'confirmatrice' | 'designer'.

import { useState, useEffect, useCallback } from 'react'
import { Tag as TagIcon, Plus, Trash2, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { NAVY, PURPLE } from './staffConfig'

const COLORS = [
  '#7c3aed', '#2563eb', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#6b7280',
]

function TagPicker({ order, scope, onChanged }) {
  const [tags, setTags]       = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])

  // Étiquettes déjà posées sur la commande
  const selected = (order.pipeline?.customTags || []).map(t => t._id || t)

  const load = useCallback(() => {
    staffApi.get('/tags', { params: { scope } })
      .then(r => setTags(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [scope])

  useEffect(() => { load() }, [load])

  /* Applique / retire une étiquette */
  const toggle = async (tagId) => {
    const next = selected.includes(tagId)
      ? selected.filter(id => id !== tagId)
      : [...selected, tagId]

    setBusy(true)
    try {
      const res = await staffApi.patch(`/workflow/orders/${order._id}/custom-tags`, { tagIds: next })
      onChanged?.(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  /* Crée une nouvelle étiquette */
  const create = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error('Nom requis')
    setBusy(true)
    try {
      const res = await staffApi.post('/tags', { name: newName.trim(), color: newColor, scope })
      setTags(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setCreating(false)
      toast.success('Étiquette créée')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  /* Supprime une étiquette du service */
  const remove = async (tag) => {
    if (!window.confirm(`Supprimer l'étiquette « ${tag.name} » ?\nElle sera retirée de toutes les commandes.`)) return
    try {
      await staffApi.delete(`/tags/${tag._id}`)
      setTags(prev => prev.filter(t => t._id !== tag._id))
      toast.success('Étiquette supprimée')
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
        <TagIcon size={12} /> Mes étiquettes
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={13} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => {
            const active = selected.includes(tag._id)
            return (
              <span key={tag._id} className="inline-flex items-center rounded-full overflow-hidden"
                style={{ background: active ? tag.color : tag.color + '1a' }}>
                <button onClick={() => toggle(tag._id)} disabled={busy}
                  className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-bold transition-all disabled:opacity-50"
                  style={{ color: active ? 'white' : tag.color }}>
                  {active && <Check size={11} />}
                  {tag.name}
                </button>
                <button onClick={() => remove(tag)} title="Supprimer l'étiquette"
                  className="pr-2 pl-0.5 py-1 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: active ? 'white' : tag.color }}>
                  <Trash2 size={10} />
                </button>
              </span>
            )
          })}
          {tags.length === 0 && (
            <span className="text-xs text-gray-300 italic">Aucune étiquette pour l'instant</span>
          )}
        </div>
      )}

      {/* Création */}
      {creating ? (
        <form onSubmit={create} className="space-y-2 p-3 rounded-xl" style={{ background: '#faf9ff' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus maxLength={30}
            placeholder="Nom de l'étiquette"
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400"
            style={{ color: NAVY }} />
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{ background: c, transform: newColor === c ? 'scale(1.2)' : 'none',
                         boxShadow: newColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="flex-1 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PURPLE }}>
              Créer
            </button>
            <button type="button" onClick={() => { setCreating(false); setNewName('') }}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold">
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-70"
          style={{ color: PURPLE }}>
          <Plus size={13} /> Créer une étiquette
        </button>
      )}
    </div>
  )
}

export default TagPicker
