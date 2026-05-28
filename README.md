# Frontend Cal y Canto

Web pública y panel administrativo para la repostería Cal y Canto.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- React Router v7

## Estructura

```
src/
├── modules/
│   ├── public/      # Web para clientes
│   ├── admin/       # Panel interno (/panel)
│   ├── shared/      # Contextos y utilidades compartidas
│   └── guards/      # Protección de rutas privadas
├── routes/
├── services/
└── environments/
```

## Scripts

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env` y ajusta `VITE_API_URL` si el backend corre en otro puerto.

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
