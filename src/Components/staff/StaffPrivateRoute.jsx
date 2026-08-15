// src/Components/staff/StaffPrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { isSuperadmin } from './staffConfig'
import { NAVY } from './staffConfig'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: NAVY }}>
      <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin" />
    </div>
  )
}

// Mur d'authentification
export function StaffPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useStaffAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!isAuthenticated) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />
  }
  return children
}

// Contrôle par rôle : redirige vers l'accueil staff si le rôle n'est pas autorisé.
// Le superadmin (et le compte .env) passe toujours.
export function RoleRoute({ allow = [], children }) {
  const { role, loading } = useStaffAuth()
  if (loading) return <Spinner />
  if (isSuperadmin(role) || allow.includes(role)) return children
  return <Navigate to="/staff" replace />
}

export default StaffPrivateRoute
