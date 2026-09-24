import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function CustomerAuthRoute() {
  const { authUser } = useApp()
  const location = useLocation()
  const token = localStorage.getItem('pustak-auth-token')

  if (!authUser || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
