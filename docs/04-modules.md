# Módulos

Cada carpeta en `src/modules/` es un **bounded context**. La tabla indica el estado de integración con el backend.

| Módulo | Ruta UI | Servicio en DI | Integración API | Notas |
|--------|---------|----------------|-----------------|-------|
| `home` | `/` | No | No | Landing pública |
| `products` | `/productos` | Sí | Sí (GET + POST) | Catálogo con mock y HTTP |
| `contact` | `/contacto` | No | No | Formulario de contacto (UI) |
| `auth` | `/panel/login` | Sí | Sí (POST login) | JWT con mock y HTTP |
| `dashboard` | `/panel` | No | No | Placeholder admin |
| `recipes` | `/panel/recetas` | Sí | Sí (CRUD) | Admin recetas con mock y HTTP |
| `costs` | `/panel/costos` | No | No | Placeholder admin |
| `accounting` | `/panel/contabilidad` | No | No | Placeholder admin |
| `contacts` | `/panel/contactos` | No | No | Placeholder admin |

---

## Módulo `auth`

### Dominio

- `LoginCredentials`: `{ email: string, password: string }`
- `LoginResult`: `{ accessToken: string }`
- `AuthInputServiceInterface`: `login(credentials): Promise<LoginResult>`
- `AuthOutputRepositoryInterface`: misma firma que el input (el repo delega directo al API)

### Servicio (`AuthService`)

```ts
login(credentials: LoginCredentials) {
  return this.repository.login(credentials)
}
```

No aplica lógica de negocio adicional — delega al repositorio.

### Implementaciones

| Implementación | Activa cuando | Comportamiento |
|----------------|---------------|----------------|
| `AuthHttpRepository` | `VITE_ENVIRONMENT` ≠ `mocked` | `POST /auth/login` |
| `AuthRepositoryMock` | `VITE_ENVIRONMENT=mocked` | Acepta solo `admin@caly-canto.com` / `admin123` → `{ accessToken: 'mock-token' }` |

**Credenciales del mock:** `admin@caly-canto.com` / `admin123`

### Página (`LoginPage`)

1. Si ya hay sesión → redirige a `redirectPath` (`location.state.from` o dashboard).
2. Submit: llama a `authServices.login()` → guarda token vía `useAuth().login()` → navega al dashboard.
3. Error: muestra `'Credenciales inválidas o servicio no disponible.'`

---

## Módulo `products`

### Dominio

```ts
class ProductModel {
  id: number
  name: string
  description?: string | null
  price: number          // número (normalizado desde API con fromApi())
  isActive: boolean
}
```

`ProductModel.fromApi(data)` — normaliza `price` a número y `isActive` con default `true`.

`CreateProductDTO`: `{ name, description?, price, isActive? }`

### Puertos

- `ProductsInputServiceInterface`: `findAll()`, `findById(id)`, `create(payload, token)`
- `ProductsOutputRepositoryInterface`: misma firma

> Nota: `token` se pasa **explícitamente** en `create()` y no se inyecta globalmente. Ver [03-architecture.md](./03-architecture.md).

### Servicio (`ProductsService`)

Delega directamente al repositorio sin lógica adicional.

### Implementaciones

| Implementación | Activa cuando | Comportamiento |
|----------------|---------------|----------------|
| `ProductsHttpRepository` | `VITE_ENVIRONMENT` ≠ `mocked` | GET/POST sobre `/products` |
| `ProductsRepositoryMock` | `VITE_ENVIRONMENT=mocked` | Array en RAM (3 productos precargados) |

**Datos del mock (3 productos):**

| id | name | price (COP) |
|----|------|-------------|
| 1 | Torta de vainilla | 85 000 |
| 2 | Cupcakes surtidos (caja 6 uds) | 36 000 |
| 3 | Brownie clásico | 12 000 |

**Diferencia en `findById`:**
- **HTTP:** `GET /products/:id` → `404` del backend → el cliente lanza `Error` con el body de respuesta.
- **Mock:** busca en array → si no encuentra, `Promise.reject(new Error('Product {id} not found'))`.

### Página (`ProductsPage`)

- Carga productos al montar con `useEffect`.
- Estados: `loading`, `error`, `products`.
- Los precios se formatean con `toLocaleString('es-CO')` — **moneda COP** (pesos colombianos).
- Layout: grid `md:grid-cols-3` con `Card` components de shadcn.

---

## Módulos solo UI (panel admin)

`dashboard`, `recipes`, `costs`, `accounting`, `contacts` son vistas React dentro de `AdminLayout` sin servicios registrados en `DIProvider`.

### Patrón para implementar un módulo nuevo del panel

1. Crear estructura hexagonal en `src/modules/[nombre]/`:
   ```
   domain/
     [entidad].model.ts
     ports/
       [nombre].input-service.interface.ts
       [nombre].output-repository.interface.ts
   application/
     [nombre].service.ts
   adapters/
     input/[nombre]-page/
     output/
       repository.provider.ts
       *-http.repository.ts
       *.repository.mock.ts
   ```
2. Registrar el servicio en `di-context.tsx`:
   ```ts
   const services = useMemo(() => ({
     ...
     [nombre]: new [Nombre]Service([nombre]Repository),
   }), [])
   ```
3. Añadir hook de consumo `use[Nombre]Services()` en `di-context.tsx`.
4. Conectar la página con el hook.
5. Actualizar esta tabla y `07-api-integration.md` si consume API.
