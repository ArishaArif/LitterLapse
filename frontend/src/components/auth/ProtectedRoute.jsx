import { Navigate, Outlet } from 'react-router-dom'
import { getSession, getRole, clearSession } from '../../lib/auth'

const ALLOWED_ROLES = ['admin', 'reviewer']

function ProtectedRoute({ requiredRole }) {
  const session = getSession()
  if (!session) {
    return <Navigate to="/login" replace />
  }
  const role = getRole()
  if (!ALLOWED_ROLES.includes(role)) {
    clearSession()
    return <Navigate to="/login" replace />
  }
  if (requiredRole && role !== requiredRole.trim().toLowerCase()) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default ProtectedRoute
