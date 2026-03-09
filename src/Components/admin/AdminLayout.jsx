import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'

const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Produits',  icon: Package },
  { to: '/admin/orders',   label: 'Commandes', icon: ClipboardList },
]

function AdminLayout() {
  const { logout }  = useAuth()
  const navigate    = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Déconnecté')
    navigate('/admin/login', { replace: true })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: `1px solid rgba(124,58,237,0.2)` }}>
        <img src="/logo.jpg" alt="BrandPack" className="w-9 h-9 rounded-full object-contain flex-shrink-0" />
        <div>
          <p className="text-white font-black italic text-base leading-none">BrandPack</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(124,58,237,0.7)' }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
              background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: isActive ? '#7c3aed' : 'rgba(255,255,255,0.55)',
              borderLeft: isActive ? `3px solid #7c3aed` : '3px solid transparent',
            })}>
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={12} style={{ opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-4" style={{ borderTop: `1px solid rgba(124,58,237,0.15)` }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                     text-sm font-semibold transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent' }}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f3ff' }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed h-full z-30 flex-shrink-0"
        style={{ background: NAVY, borderRight: `1px solid rgba(124,58,237,0.2)` }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(30,27,75,0.7)' }} />
          <aside className="absolute left-0 top-0 bottom-0 w-60"
            style={{ background: NAVY, borderRight: `1px solid rgba(124,58,237,0.2)` }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3"
          style={{ background: NAVY, borderBottom: `1px solid rgba(124,58,237,0.2)` }}>
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Menu size={20} />
          </button>
          <span className="text-white font-black italic">BrandPack Admin</span>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout