# Arquitectura

## Principios

- **Separación por capas:** dominio independiente de React y de HTTP.
- **Inversión de dependencias:** la aplicación depende de puertos (interfaces), no de implementaciones concretas.
- **Inyección por entorno:** `providerFactory` elige implementación HTTP o mock según `VITE_ENVIRONMENT`.

## Capas

```
┌─────────────────────────────────────────────────────────┐
│  Adapters INPUT (React)                                 │
│  Páginas, layouts, AuthGuard                            │
└───────────────────────────┬─────────────────────────────┘
                            │ useAuthServices(), useProductServices()
┌───────────────────────────▼─────────────────────────────┐
│  Application                                            │
│  auth.service.ts, products.service.ts                   │
└───────────────────────────┬─────────────────────────────┘
                            │ puertos (interfaces)
┌───────────────────────────▼─────────────────────────────┐
│  Domain                                                 │
│  Modelos + input/output repository interfaces           │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Adapters OUTPUT                                        │
│  *-http.repository.ts | *.repository.mock.ts            │
└─────────────────────────────────────────────────────────┘
```

## Patrón por módulo

Cada bounded context en `src/modules/[modulo]/` sigue:

```
modules/[modulo]/
├── domain/
│   ├── [entidad].model.ts
│   └── ports/
│       ├── [modulo].input-service.interface.ts
│       └── [modulo].output-repository.interface.ts
├── application/
│   └── [modulo].service.ts
└── adapters/
    ├── input/              # Páginas React
    └── output/
        ├── repository.provider.ts         # selección por entorno
        ├── *-http.repository.ts           # implementación HTTP real
        └── *.repository.mock.ts           # implementación en memoria
```

## Paso del token en operaciones protegidas

El cliente no inyecta el token a nivel de infraestructura global. En su lugar, el token se pasa **explícitamente como argumento** desde la página → servicio → repositorio:

```ts
// ProductsInputServiceInterface
create(payload: CreateProductDTO, token: string): Promise<ProductModel>

// ProductsHttpRepository
async create(payload: CreateProductDTO, token: string) {
  return httpClient<ProductModel>(this.baseUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,          // httpClient añade: Authorization: Bearer <token>
  })
}
```

La página obtiene el token de `useAuth().token` y lo pasa al servicio.

## Infraestructura compartida (`src/common/`)

| Carpeta / archivo | Responsabilidad |
|-------------------|-----------------|
| `adapters/output/http/http-client.ts` | Cliente `fetch` con JSON y Bearer token opcional |
| `context/di-context.tsx` | Contenedor DI: instancia los servicios de aplicación y expone hooks |
| `context/auth-context.tsx` | Estado del JWT: `token`, `isAuthenticated`, `login()`, `logout()` |
| `guards/auth-guard.tsx` | Redirección a login si no hay sesión activa |
| `layout/public-layout.tsx` | Cabecera pública + footer con enlace «Acceso interno» |
| `layout/admin-layout.tsx` | Sidebar del panel + logout |
| `providers/repository-provider.factory.ts` | Selección de repositorio por `VITE_ENVIRONMENT` |

### `http-client.ts`

- URL: si `path` no empieza por `http`, concatena `environment.apiUrl + path`.
- Cabeceras siempre: `Content-Type: application/json`.
- Si se pasa `token`: añade `Authorization: Bearer <token>`.
- Respuesta `!ok`: lanza `Error` con el body de texto de la respuesta (o el status code).
- Respuesta `204`: devuelve `undefined` (tipado como `T`).

### `auth-context.tsx`

- Token persistido en `localStorage` clave `'cal-y-canto-auth-token'`.
- `login(token)`: guarda en `localStorage` y actualiza estado.
- `logout()`: elimina de `localStorage` y limpia estado.
- Inicialización lazy: `useState(() => localStorage.getItem(TOKEN_KEY))` — restaura sesión al recargar.

### `di-context.tsx`

Instancia servicios de aplicación una vez (memo) e inyecta los repositorios seleccionados por entorno:

```ts
const services = useMemo(() => ({
  auth: new AuthService(authRepository),
  products: new ProductsService(productsRepository),
}), [])
```

Hooks de consumo: `useAuthServices()`, `useProductServices()` (alias de `useDI().auth` / `useDI().products`).

### `repository-provider.factory.ts` (`providerFactory`)

```ts
// Si VITE_ENVIRONMENT === EnvironmentEnum.Mocked → usa mock
// Para cualquier otro valor → usa implementación por defecto (HTTP)
providerFactory({ [EnvironmentEnum.Mocked]: new MockImpl() }, new HttpImpl())
```

Solo el valor `mocked` tiene entrada en el mapa. El resto de valores (`local`, `development`, `production`) usan HTTP.

## Utilidad `cn()` (`src/lib/utils.ts`)

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Combina clases de Tailwind gestionando conflictos. Usada en componentes shadcn.

## Flujo de una petición (ejemplo: login)

1. `LoginPage` recoge email y password del formulario.
2. Llama a `useAuthServices().login({ email, password })`.
3. `AuthService.login()` delega en `AuthOutputRepositoryInterface`.
4. Con `local`/`development`/`production`: `AuthHttpRepository` → `POST /auth/login` → `{ accessToken }`.
5. La página extrae `accessToken` y llama a `useAuth().login(token)` → persiste en `localStorage`.
6. Redirección a `redirectPath` (dashboard o ruta `from` original).

## Flujo de una petición (ejemplo: crear producto)

1. Handler React obtiene `token` de `useAuth().token`.
2. Llama a `useProductServices().create(payload, token)`.
3. `ProductsService` delega en el repositorio pasando `token`.
4. `ProductsHttpRepository.create()` → `POST /products` con `Authorization: Bearer <token>`.
5. Respuesta → `ProductModel.fromApi()` normaliza campos.

## Arranque de la aplicación (`App.tsx`)

Orden de proveedores:

1. `AuthProvider` — contexto de sesión (token en localStorage).
2. `DIProvider` — servicios instanciados con repositorios por entorno.
3. `Suspense` + `AppRoutes` — rutas con lazy loading.

## Convenciones de código

| Concepto | Naming |
|----------|--------|
| Puerto de entrada | `*InputServiceInterface` |
| Puerto de salida | `*OutputRepositoryInterface` |
| Hook de consumo | `use*Services()` |
| Provider de repo | `repository.provider.ts` |
| Rutas lazy | import dinámico en `routes/routes.tsx` |

## Documentación adicional en el repo

- `.cursor/skills/hexagonal_architecture/` — guía detallada del patrón.
- `.cursor/skills/http-repositories-rest/` — contrato de repositorios REST.
- `.cursor/skills/react-lazy-loading/` — carga diferida de rutas.
