import { useState, useEffect, useCallback } from 'react'
import {
  Users, Loader2, UserPlus, Trash2, KeyRound, Power, Eye, EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { ROLE_LABELS, NAVY, PURPLE } from '../../Components/staff/staffConfig'
import { PageHeader } from '../../Components/staff/StageBoard'

// Rôles créables (on exclut 'admin' qui est le compte .env legacy)
const CREATABLE_ROLES = ['superadmin', 'chef_production', 'confirmatrice', 'designer', 'insolation', 'production', 'emballage']

function AddUserForm({ onAdded }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'confirmatrice', fullName: '' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) return toast.error('Identifiant et mot de passe requis')
    setSaving(true)
    try {
      await staffApi.post('/users', {
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        fullName: form.fullName.trim(),
      })
      toast.success('Compte créé')
      setForm({ username: '', password: '', role: 'confirmatrice', fullName: '' })
      onAdded()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const field = 'w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors'

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <UserPlus size={17} style={{ color: PURPLE }} />
        </div>
        <p className="font-black text-sm" style={{ color: NAVY }}>Créer un compte de service</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400">Identifiant *</label>
          <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            placeholder="ex : sara.conf" autoComplete="off" className={field} style={{ color: NAVY }} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400">Nom affiché</label>
          <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            placeholder="ex : Sara B." className={field} style={{ color: NAVY }} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400">Mot de passe *</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••" autoComplete="new-password" className={`${field} pr-10`} style={{ color: NAVY }} />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5 text-gray-400">Service (rôle) *</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className={field} style={{ color: NAVY }}>
            {CREATABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: PURPLE }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        Créer le compte
      </button>
    </form>
  )
}

function UserRow({ user, onChanged }) {
  const [busy, setBusy] = useState(false)

  const toggleActive = async () => {
    setBusy(true)
    try {
      await staffApi.patch(`/users/${user._id}`, { active: !user.active })
      toast.success(user.active ? 'Compte désactivé' : 'Compte activé')
      onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setBusy(false) }
  }

  const resetPassword = async () => {
    const pw = window.prompt(`Nouveau mot de passe pour « ${user.username} » :`)
    if (!pw) return
    try {
      await staffApi.patch(`/users/${user._id}`, { password: pw })
      toast.success('Mot de passe mis à jour')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Supprimer le compte « ${user.username} » ?`)) return
    try {
      await staffApi.delete(`/users/${user._id}`)
      toast.success('Compte supprimé'); onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#f0f0f4', opacity: user.active ? 1 : 0.55 }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: NAVY }}>
          {user.fullName || user.username}
          {!user.active && <span className="ml-2 text-xs font-bold" style={{ color: '#ef4444' }}>· désactivé</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">@{user.username}</p>
      </div>
      <span className="flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
        {ROLE_LABELS[user.role] || user.role}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={toggleActive} disabled={busy} title={user.active ? 'Désactiver' : 'Activer'}
          className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
        </button>
        <button onClick={resetPassword} title="Réinitialiser le mot de passe"
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
          <KeyRound size={14} />
        </button>
        <button onClick={remove} title="Supprimer"
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function UsersPage() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await staffApi.get('/users')
      setUsers(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur chargement comptes')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader eyebrow="Administration" title="Comptes de service" count={loading ? null : users.length} />

      <AddUserForm onAdded={load} />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5" style={{ color: PURPLE }}>
          <Users size={13} /> Comptes existants
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun compte créé pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => <UserRow key={u._id} user={u} onChanged={load} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
