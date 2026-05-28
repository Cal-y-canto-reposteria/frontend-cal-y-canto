# Frontend Cal y Canto

Web pública y panel administrativo para la repostería Cal y Canto.

**Documentación completa:** [docs/](./docs/README.md)

## Desarrollo de features (OpenSpec)

Las especificaciones y el plan de implementación se gestionan en el hub central **[cal-y-canto-agent-docs](https://github.com/Cal-y-canto-reposteria/cal-y-canto-agent-docs)** con [OpenSpec](https://www.npmjs.com/package/@fission-ai/openspec).

| Paso | Dónde | Acción |
|------|--------|--------|
| Diseño | `cal-y-canto-agent-docs` | `/opsx:propose <nombre>` — genera proposal, specs, design y tasks |
| Código | Este repo (`frontend-cal-y-canto`) | `/opsx:apply` — tareas marcadas `[frontend]` |
| Cierre | `cal-y-canto-agent-docs` | `/opsx:archive <nombre>` |

**Guía completa:** [docs/openspec-guide.md](https://github.com/Cal-y-canto-reposteria/cal-y-canto-agent-docs/blob/main/docs/openspec-guide.md) — conducto regular, comandos CLI, reglas de apply/archive y capacidades del framework.

Ramas multi-repo (desde el hub):

```bash
cd ../cal-y-canto-agent-docs
./scripts/branch-all feature/<nombre-change> --create
```

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- React Router v7
- **Arquitectura hexagonal** (referencia: task-manager-mf)

## Documentación

| Tema | Enlace |
|------|--------|
| Índice | [docs/README.md](./docs/README.md) |
| Instalación | [docs/02-setup.md](./docs/02-setup.md) |
| Arquitectura | [docs/03-architecture.md](./docs/03-architecture.md) |
| Módulos y rutas | [docs/04-modules.md](./docs/04-modules.md), [docs/05-routing.md](./docs/05-routing.md) |
| API | [docs/07-api-integration.md](./docs/07-api-integration.md) |

## Estructura

```
docs/                          # Documentación del proyecto
src/
├── common/                      # Infraestructura compartida
│   ├── adapters/output/http/    # Cliente HTTP
│   ├── context/                 # DI + Auth
│   ├── guards/
│   ├── layout/
│   └── providers/               # providerFactory por entorno
├── modules/                     # Bounded contexts
│   ├── auth/
│   ├── products/
│   ├── home/
│   ├── contact/
│   ├── dashboard/
│   ├── recipes/
│   ├── costs/
│   ├── accounting/
│   └── contacts/
├── routes/
└── components/ui/               # shadcn
```

### Patrón por módulo

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
    ├── input/                   # React (páginas, hooks)
    └── output/                  # HTTP + mocks + repository.provider.ts
```

Flujo: **UI → `use*Services()` → Application Service → Repository → API**

## Skills de arquitectura

En `.cursor/skills/`:

- `hexagonal_architecture/` — guía principal
- `http-repositories-rest/` — repositorios HTTP REST
- `react-lazy-loading/` — rutas lazy

## Scripts

```bash
npm install
cp .env.example .env
npm run dev
```

Variables:

- `VITE_API_URL` — URL del backend
- `VITE_ENVIRONMENT` — `local` | `mocked` | `development` | `production`

Con `mocked` se usan repositorios en memoria sin backend.

## Rutas

| Ruta | Acceso |
|------|--------|
| `/` | Público |
| `/productos` | Público |
| `/contacto` | Público |
| `/panel/login` | Login interno |
| `/panel/*` | Requiere autenticación |

## Repositorio

[frontend-cal-y-canto](https://github.com/Cal-y-canto-reposteria/frontend-cal-y-canto)
