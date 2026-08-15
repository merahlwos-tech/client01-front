import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckCircle2, Palette, Hammer, Package,
  Truck, Boxes, Users, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { NAVY, PURPLE, ROLE_LABELS, isSuperadmin, OPEN_ACCESS } from './staffConfig'

// Chaque lien déclare les rôles qui le voient. Le superadmin voit tout.
const NAV_ITEMS = [
  { to: '/staff',              label: 'Accueil',      icon: LayoutDashboard, end: true, roles: 'all' },
  { to: '/staff/confirmation', label: 'Confirmation', icon: CheckCircle2, roles: ['confirmatrice', 'chef_production'] },
  { to: '/staff/design',       label: 'Design',       icon: Palette,      roles: ['designer', 'chef_production'] },
  { to: '/staff/production',   label: 'Production',   icon: Hammer,       roles: ['production', 'chef_production'] },
  { to: '/staff/emballage',    label: 'Emballage',    icon: Package,      roles: ['emballage', 'chef_production'] },
  { to: '/staff/livraison',    label: 'Livraison',    icon: Truck,        roles: ['chef_production'] },
  { to: '/staff/stock',        label: 'Stock',        icon: Boxes,        roles: ['production', 'chef_production'] },
  { to: '/staff/users',        label: 'Comptes',      icon: Users,        roles: [] }, // superadmin only
]

function itemVisible(item, role) {
  if (isSuperadmin(role)) return true
  if (item.roles === 'all') return true
  return item.roles.includes(role)
}

function SidebarContent({ role, username, onClose, onLogout }) {
  const items = NAV_ITEMS.filter(i => itemVisible(i, role))
  return (
    <div className="flex flex-col h-full">
      {/* En-tête */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
        <p className="text-white font-black italic text-base leading-none">BrandPack</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(124,58,237,0.8)' }}>Atelier</p>
      </div>

      {/* Utilisateur */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
        <p className="text-white text-sm font-bold truncate">{username}</p>
        <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}>
          {ROLE_LABELS[role] || role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
              background:  isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              color:       isActive ? '#a78bfa' : 'rgba(255,255,255,0.55)',
              borderLeft:  isActive ? '3px solid #7c3aed' : '3px solid transparent',
              textDecoration: 'none',
            })}>
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={12} style={{ opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* Déconnexion — masquée en accès libre (aucune session à fermer) */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}>
        {OPEN_ACCESS ? (
          <p className="px-4 text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.75)' }}>
            ⚠️ Accès libre activé — aucune connexion requise.
          </p>
        ) : (
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent' }}>
          <LogOut size={16} /> Déconnexion
        </button>
        )}
      </div>
    </div>
  )
}

function StaffLayout() {
  const { logout, user, role } = useStaffAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Force LTR + français dans l'atelier
  useEffect(() => {
    const prevDir = document.documentElement.dir
    const prevLang = document.documentElement.lang
    document.documentElement.dir = 'ltr'
    document.documentElement.lang = 'fr'
    return () => { document.documentElement.dir = prevDir; document.documentElement.lang = prevLang }
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    toast.success('Déconnecté')
    navigate('/staff/login', { replace: true })
  }
  const closeSidebar = () => setSidebarOpen(false)
  const username = user?.fullName || user?.username || '—'

  return (
    <div dir="ltr" className="min-h-screen flex" style={{ background: '#f5f3ff' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed top-0 bottom-0 left-0 z-30"
        style={{ background: NAVY, borderRight: '1px solid rgba(124,58,237,0.2)' }}>
        <SidebarContent role={role} username={username} onClose={closeSidebar} onLogout={handleLogout} />
      </aside>

      {/* Drawer mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={closeSidebar}>
          <div className="absolute inset-0"
            style={{ background: 'rgba(30,27,75,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
          <aside className="absolute top-0 left-0 bottom-0 w-64 flex flex-col"
            style={{ background: NAVY, borderRight: '1px solid rgba(124,58,237,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={closeSidebar} className="absolute top-4 right-4 p-1.5 rounded-lg"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              <X size={18} />
            </button>
            <SidebarContent role={role} username={username} onClose={closeSidebar} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: NAVY, borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <Menu size={20} />
          </button>
          <span className="text-white font-black italic text-sm">BrandPack Atelier</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-3 sm:p-5 lg:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
