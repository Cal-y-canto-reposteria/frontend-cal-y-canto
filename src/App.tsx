import { Suspense } from 'react'
import { AuthProvider } from '@common/context/auth-context'
import { DIProvider } from '@common/context/di-context'
import { AppRoutes } from '@routes/routes'

export default function App() {
  return (
    <AuthProvider>
      <DIProvider>
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
          <AppRoutes />
        </Suspense>
      </DIProvider>
    </AuthProvider>
  )
}
