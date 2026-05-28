import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { RoutePathEnum } from '@/routes/route-path.enum'
import { useAuth } from '@/modules/shared/context/auth-context'

export function AuthGuard() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={RoutePathEnum.AdminLogin}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
