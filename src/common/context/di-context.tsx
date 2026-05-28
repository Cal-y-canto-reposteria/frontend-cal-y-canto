import { AuthService } from '@modules/auth/application/auth.service'
import { authRepository } from '@modules/auth/adapters/output/repository.provider'
import { ProductsService } from '@modules/products/application/products.service'
import { productsRepository } from '@modules/products/adapters/output/repository.provider'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import type { AuthInputServiceInterface } from '@modules/auth/domain/ports/auth.input-service.interface'
import type { ProductsInputServiceInterface } from '@modules/products/domain/ports/products.input-service.interface'

interface Services {
  auth: AuthInputServiceInterface
  products: ProductsInputServiceInterface
}

const DIContext = createContext<Services | undefined>(undefined)

export function DIProvider({ children }: { children: ReactNode }) {
  const services = useMemo(
    () => ({
      auth: new AuthService(authRepository),
      products: new ProductsService(productsRepository),
    }),
    [],
  )

  return <DIContext.Provider value={services}>{children}</DIContext.Provider>
}

export function useDI() {
  const context = useContext(DIContext)

  if (!context) {
    throw new Error('useDI must be used within DIProvider')
  }

  return context
}

export function useAuthServices() {
  return useDI().auth
}

export function useProductServices() {
  return useDI().products
}
