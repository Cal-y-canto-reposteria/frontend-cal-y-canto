import { AuthProvider } from '@/modules/shared/context/auth-context'
import { AppRoutes } from '@/routes/routes'

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
