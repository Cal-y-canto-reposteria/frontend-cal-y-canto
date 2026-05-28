# Visión general

## Propósito

Aplicación web para la repostería **Cal y Canto** con dos áreas:

1. **Sitio público** — Presentación, catálogo de productos y formulario de contacto.
2. **Panel interno** — Gestión operativa (dashboard, recetas, costos, contabilidad, contactos) tras autenticación.

## Stack tecnológico

| Tecnología | Versión / notas |
|------------|-----------------|
| React | 19 |
| TypeScript | ~5.7 |
| Vite | 6 |
| React Router | 7 |
| Tailwind CSS | 4 |
| shadcn/ui + Base UI | Componentes UI |
| Lucide React | Iconos |

## Arquitectura

El frontend sigue **arquitectura hexagonal** (puertos y adaptadores), alineada con el backend y con el proyecto de referencia `task-manager-mf`.

- **Dominio:** modelos y puertos (interfaces).
- **Aplicación:** servicios que orquestan casos de uso.
- **Adaptadores de entrada:** páginas React, hooks.
- **Adaptadores de salida:** repositorios HTTP y mocks.

## Estructura del repositorio

```
frontend-cal-y-canto/
├── docs/                    # Esta documentación
├── public/                  # Assets estáticos
├── src/
│   ├── common/              # Infraestructura compartida
│   ├── components/ui/       # Componentes shadcn
│   ├── environments/        # Configuración por entorno
│   ├── modules/             # Bounded contexts
│   └── routes/              # Definición de rutas
├── .env.example
├── package.json
└── vite.config.ts
```

## Integración con el backend

El proyecto consume la API de `services-cal-y-canto` bajo el prefijo `/api-cal-y-canto`. Los módulos **auth** y **products** están conectados al API; el resto del panel son vistas preparadas para futura integración.
