# Integración con el API

## URL base

Todas las peticiones relativas se resuelven contra `environment.apiUrl` (`VITE_API_URL`), que incluye el prefijo global del backend: `/api-cal-y-canto`.

```ts
// environment.ts
export const environment = {
  name: import.meta.env.VITE_ENVIRONMENT,
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api-cal-y-canto',
}
```

## Cliente HTTP (`src/common/adapters/output/http/http-client.ts`)

Función genérica `httpClient<T>(path, options?)`:

| Comportamiento | Detalle |
|----------------|---------|
| URL | Si `path` no empieza por `http`, concatena `environment.apiUrl + path` |
| Cabecera siempre | `Content-Type: application/json` |
| Cabecera opcional | `Authorization: Bearer <token>` (si se pasa `token`) |
| Error HTTP | Lanza `Error` con el body de texto de la respuesta, o el status si el body está vacío |
| `204 No Content` | Retorna `undefined` (tipado como `T`) |

```ts
// Firma
async function httpClient<T>(path: string, options?: RequestOptions): Promise<T>

// Options
type RequestOptions = RequestInit & { token?: string | null }
```

## Formato de errores del API

El backend retorna siempre este formato cuando hay error:

```json
{
  "statusCode": 400,
  "message": "descripción del error",
  "error": "ValidationException"
}
```

El `httpClient` lee el body con `response.text()` y lo lanza como `Error.message`. Si la UI necesita parsear el JSON del error para mostrar un mensaje concreto:

```ts
try {
  await productServices.findAll()
} catch (err) {
  // err.message puede ser el JSON string del error del backend
  try {
    const parsed = JSON.parse((err as Error).message)
    console.error(parsed.message, parsed.statusCode)
  } catch {
    // body no era JSON (error de red, etc.)
    console.error((err as Error).message)
  }
}
```

## Endpoints consumidos actualmente

### `POST /auth/login`

| | |
|-|-|
| Auth | No |
| Body | `{ email: string, password: string }` |
| Respuesta `200` | `{ accessToken: string }` |
| Error `401` | Credenciales incorrectas |
| Error `400` | Validación del body |

Implementación: `AuthHttpRepository.login()`.

### `GET /products`

| | |
|-|-|
| Auth | No |
| Respuesta `200` | `ProductModel[]` |

Implementación: `ProductsHttpRepository.findAll()` → normaliza con `ProductModel.fromApi()`.

### `GET /products/:id`

| | |
|-|-|
| Auth | No |
| Respuesta `200` | `ProductModel` |
| Error `404` | Producto no encontrado |

Implementación: `ProductsHttpRepository.findById(id)` → normaliza con `ProductModel.fromApi()`.

### `POST /products`

| | |
|-|-|
| Auth | **Sí** — Bearer JWT |
| Body | `{ name, description?, price, isActive? }` |
| Respuesta `201` | `ProductModel` creado |
| Error `401` | Sin token o token inválido |
| Error `400` | Validación de DTO |

Implementación: `ProductsHttpRepository.create(payload, token)`.

## Normalización de datos — `ProductModel.fromApi()`

El API puede retornar `price` como `Decimal` (string numérico). El frontend lo normaliza:

```ts
static fromApi(data: ProductModel): ProductModel {
  return new ProductModel({
    id: data.id,
    name: data.name,
    description: data.description,
    price: Number(data.price),      // convierte Decimal string → number
    isActive: data.isActive ?? true,
  })
}
```

Los precios son en **pesos colombianos (COP)** y se formatean en las vistas con:

```ts
product.price.toLocaleString('es-CO')
// Ejemplo: 85000 → "85.000"
```

## Autenticación en el panel

1. Usuario ingresa credenciales en `/panel/login`.
2. `AuthService` → `POST /auth/login` → `{ accessToken }`.
3. `useAuth().login(token)` persiste en `localStorage` (`cal-y-canto-auth-token`).
4. Las operaciones protegidas obtienen el token de `useAuth().token` y lo pasan al servicio/repositorio.
5. `httpClient` agrega `Authorization: Bearer <token>` automáticamente.

## CORS

El backend tiene `enableCors({ origin: true })`. El dev server en `5173` puede llamar al API en `8000` sin configuración extra en Vite.

## Swagger del backend

Documentación interactiva disponible cuando el backend está levantado:

```
http://localhost:8000/api-cal-y-canto/docs
```

Ver `services-cal-y-canto/docs/09-openapi.md` para la guía de decoradores Swagger.

## Endpoints no consumidos aún (panel)

Módulos con endpoints en el backend pero sin cliente HTTP en el frontend:

| Módulo | Endpoint backend | Respuesta actual |
|--------|-----------------|------------------|
| `recipes` | `GET /recipes` | `{ message: "Recipes module ready for implementation" }` |
| `costs` | `GET /costs` | `{ message: "Costs module ready for implementation" }` |
| `accounting` | `GET /accounting` | `{ message: "Accounting module ready for implementation" }` |
| `contacts` | `GET /contacts` | `{ message: "Contacts module ready for implementation" }` |

Todos requieren Bearer JWT. Al implementar, añadir repositorio HTTP siguiendo el patrón de `products` y registrar en `DIProvider`.
