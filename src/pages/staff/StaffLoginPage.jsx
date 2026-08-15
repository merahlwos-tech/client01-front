import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { NAVY, PURPLE } from '../../Components/staff/staffConfig'

function StaffLoginPage() {
  const { login } = useStaffAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/staff'

  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Identifiants requis'); return }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Connexion réussie')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (extra = '') =>
    `w-full px-4 py-3.5 rounded-xl border-2 text-sm outline-none transition-all bg-white/5
     text-white placeholder-white/20 border-white/10
     focus:border-purple-500 focus:bg-white/8 ${extra}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: NAVY }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: PURPLE, filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: PURPLE, filter: 'blur(100px)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <h1 className="font-black italic text-white text-2xl tracking-tight">BrandPack</h1>
          <p className="text-xs mt-1 font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Atelier — Espace personnel
          </p>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Identifiant
              </label>
              <input type="text" value={form.username} autoComplete="username"
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="votre identifiant" className={inputCls()} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} autoComplete="current-password"
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" className={inputCls('pr-12')} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-all mt-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: loading ? 'rgba(124,58,237,0.5)' : `linear-gradient(135deg, ${PURPLE}, #6d28d9)`, boxShadow: loading ? 'none' : `0 8px 24px rgba(124,58,237,0.4)` }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Accès réservé au personnel de l'atelier
        </p>
      </div>
    </div>
  )
}

export default StaffLoginPage
