import { Navigate, Outlet } from 'react-router-dom'

const ADMIN_SESSION_KEY = 'memorial-admin-auth'

export default function AdminRoute() {
  const authenticated =
    sessionStorage.getItem(
      ADMIN_SESSION_KEY,
    ) === 'authenticated'

  if (!authenticated) {
    return (
      <Navigate
        to="/admin-login"
        replace
      />
    )
  }

  return <Outlet />
}