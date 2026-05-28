---
name: http-repositories-rest
description: Repositorios HTTP REST para Cal y Canto. Usar al crear adapters/output, http repositories, providerFactory y conexión con la API NestJS.
---

# Repositorios HTTP REST (Cal y Canto)

Guía para adaptadores de salida HTTP en el frontend hexagonal.

## Stack

- Cliente: `src/common/adapters/output/http/http-client.ts`
- Base URL: `environment.apiUrl` (ej. `http://localhost:8000/api-cal-y-canto`)
- Provider: `providerFactory` en `src/common/providers/repository-provider.factory.ts`

## Estructura por módulo

```
modules/[modulo]/adapters/output/
├── [modulo]-http.repository.ts
├── [modulo].repository.mock.ts
└── repository.provider.ts
```

## Patrón HTTP repository

```typescript
import { httpClient } from '@common/adapters/output/http/http-client'
import { environment } from '@environments/environment'

export class ProductsHttpRepository implements ProductsOutputRepositoryInterface {
  private readonly baseUrl = `${environment.apiUrl}/products`

  findAll(): Promise<ProductModel[]> {
    return httpClient<ProductModel[]>(this.baseUrl)
  }
}
```

## Provider por entorno

```typescript
import { providerFactory } from '@common/providers/repository-provider.factory'
import { EnvironmentEnum } from '@environments/environment.enum'

export const productsRepository = providerFactory(
  {
    [EnvironmentEnum.Mocked]: new ProductsRepositoryMock(),
  },
  new ProductsHttpRepository(),
)
```

## Reglas

1. La UI **nunca** llama `fetch` directo; usa `use*Services()` del DI context.
2. El servicio de aplicación implementa el **input port** y delega al **output port**.
3. Los mocks viven en `adapters/output` y se activan con `VITE_ENVIRONMENT=mocked`.
4. Autenticación: pasar token con `httpClient(path, { token })` desde `useAuth()`.
