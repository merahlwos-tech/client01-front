import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Palette, Hammer, Package, Truck, CheckCheck, XCircle, Loader2, ArrowRight,
} from 'lucide-react'
import staffApi from '../../utils/staffApi'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { STAGES, ROLE_LABELS, canView, NAVY, PURPLE } from '../../Components/staff/staffConfig'

const STAGE_META = [
  { key: 'confirmation', to: '/staff/confirmation', icon: CheckCircle2 },
  { key: 'design',       to: '/staff/design',       icon: Palette },
  { key: 'production',   to: '/staff/production',    icon: Hammer },
  { key: 'emballage',    to: '/staff/emballage',     icon: Package },
  { key: 'livraison',    to: '/staff/livraison',     icon: Truck },
  { key: 'termine',      to: null,                   icon: CheckCheck },
  { key: 'annulee',      to: null,                   icon: XCircle },
]

function StaffHomePage() {
  const { user, role } = useStaffAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    staffApi.get('/workflow/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const username = user?.fullName || user?.username || ''

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PURPLE }}>
          {ROLE_LABELS[role] || role}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black italic" style={{ color: NAVY }}>
          Bonjour {username} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">Vue d'ensemble du pipeline de production</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {STAGE_META.map(({ key, to, icon: Icon }) => {
            const cfg = STAGES[key]
            const count = stats?.[key] ?? 0
            const viewable = to && canView(role, key)
            const CardInner = (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full transition-all"
                style={{ borderColor: viewable ? undefined : '#f0f0f4' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  {viewable && <ArrowRight size={15} className="text-gray-300" />}
                </div>
                <p className="text-2xl font-black mb-1" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{cfg.label}</p>
              </div>
            )
            return viewable
              ? <Link key={key} to={to} className="block hover:-translate-y-0.5 transition-transform">{CardInner}</Link>
              : <div key={key}>{CardInner}</div>
          })}
        </div>
      )}
    </div>
  )
}

export default StaffHomePage
