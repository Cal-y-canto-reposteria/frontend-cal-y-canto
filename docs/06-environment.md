# Variables de entorno

## Archivo `.env`

Copia desde `.env.example`:

```env
VITE_API_URL=http://localhost:8000/api-cal-y-canto
VITE_ENVIRONMENT=local
```

Solo las variables con prefijo `VITE_` están expuestas al código del cliente (restricción de Vite).

## Variables

| Variable | Descripción | Valor por defecto (código) |
|----------|-------------|---------------------------|
| `VITE_API_URL` | URL base del API (incluye prefijo `/api-cal-y-canto`) | `http://localhost:8000/api-cal-y-canto` |
| `VITE_ENVIRONMENT` | Modo de implementación de repositorios | `local` |

## Valores de `VITE_ENVIRONMENT`

Definidos en `src/environments/environment.enum.ts`:

| Valor | Comportamiento |
|-------|----------------|
| `local` | Repositorios HTTP (implementación por defecto en `providerFactory`) |
| `development` | Igual que local (HTTP por defecto) |
| `production` | HTTP contra API de producción |
| `mocked` | Repositorios en memoria (`AuthRepositoryMock`, `ProductsRepositoryMock`) |

La lógica de selección está en `src/common/providers/repository-provider.factory.ts`: solo `mocked` tiene entrada explícita en el mapa; el resto usa la implementación por defecto (HTTP).

## Objeto `environment`

`src/environments/environment.ts` centraliza:

```ts
export const environment = {
  name: import.meta.env.VITE_ENVIRONMENT,
  apiUrl: import.meta.env.VITE_API_URL,
}
```

Usado por `http-client.ts` y repositorios HTTP.

## Entornos recomendados

### Desarrollo con API local

```env
VITE_API_URL=http://localhost:8000/api-cal-y-canto
VITE_ENVIRONMENT=local
```

### Sin backend

```env
VITE_ENVIRONMENT=mocked
```

### Producción

Configurar en el CI/CD del hosting:

```env
VITE_API_URL=https://api.tudominio.com/api-cal-y-canto
VITE_ENVIRONMENT=production
```
