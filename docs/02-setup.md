# Instalación y desarrollo

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- npm 9+

Para trabajar contra el API real, el backend debe estar en ejecución (ver `services-cal-y-canto/docs/02-setup.md`).

## Instalación

```bash
cd frontend-cal-y-canto
npm install
cp .env.example .env
```

Edita `.env` según el entorno (ver [06-environment.md](./06-environment.md)).

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite en el puerto **5173** |
| `npm run build` | Compilación TypeScript + build de producción |
| `npm run preview` | Previsualización del build de producción |
| `npm run lint` | ESLint sobre el código fuente |

## Desarrollo local (con backend)

1. Levanta el backend: `npm run start:dev` en `services-cal-y-canto`.
2. Configura en `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api-cal-y-canto
   VITE_ENVIRONMENT=local
   ```
3. Inicia el frontend: `npm run dev`.
4. Abre `http://localhost:5173`.

## Desarrollo sin backend (mocks)

```env
VITE_ENVIRONMENT=mocked
```

Con `mocked`, auth y products usan repositorios en memoria definidos en `*.repository.mock.ts`. No hace falta API ni base de datos.

## Alias de importación (Vite)

Configurados en `vite.config.ts`:

| Alias | Ruta |
|-------|------|
| `@` | `src/` |
| `@common` | `src/common/` |
| `@modules` | `src/modules/` |
| `@routes` | `src/routes/` |
| `@environments` | `src/environments/` |

## Build de producción

```bash
npm run build
```

La salida queda en `dist/`. Despliega ese directorio en cualquier hosting estático (Netlify, Vercel, S3, etc.) configurando las variables `VITE_*` en el pipeline de build.
