# Documentación — Frontend Cal y Canto

Documentación del cliente web (sitio público + panel administrativo).

## Índice

| Documento | Contenido |
|-----------|-----------|
| [01-overview.md](./01-overview.md) | Propósito, stack y alcance del proyecto |
| [02-setup.md](./02-setup.md) | Instalación, scripts y puesta en marcha |
| [03-architecture.md](./03-architecture.md) | Arquitectura hexagonal, capas y flujo de datos |
| [04-modules.md](./04-modules.md) | Módulos, bounded contexts y estado de integración |
| [05-routing.md](./05-routing.md) | Rutas, layouts y protección de acceso |
| [06-environment.md](./06-environment.md) | Variables de entorno y modos de ejecución |
| [07-api-integration.md](./07-api-integration.md) | Consumo del backend, HTTP y autenticación |

## Referencia rápida

```bash
npm install
cp .env.example .env
npm run dev
```

- **Dev server:** `http://localhost:5173`
- **API (por defecto):** `http://localhost:8000/api-cal-y-canto`
- **Repositorio:** [frontend-cal-y-canto](https://github.com/Cal-y-canto-reposteria/frontend-cal-y-canto)

## Skills de arquitectura (Cursor)

En `.cursor/skills/` hay guías para mantener el patrón hexagonal, repositorios HTTP y lazy loading de rutas.
