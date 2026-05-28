# Rutas y navegación

## Definición

Las rutas se configuran en `src/routes/routes.tsx` con `createBrowserRouter`. Los paths están centralizados en `src/routes/route-path.enum.ts`.

## Mapa de rutas

| Path | Componente | Layout | Auth |
|------|------------|--------|------|
| `/` | `HomePage` | `PublicLayout` | No |
| `/productos` | `ProductsPage` | `PublicLayout` | No |
| `/contacto` | `ContactPage` | `PublicLayout` | No |
| `/panel/login` | `LoginPage` | — | No |
| `/panel` | `DashboardPage` | `AdminLayout` | Sí |
| `/panel/recetas` | `RecipesPage` | `AdminLayout` | Sí |
| `/panel/costos` | `CostsPage` | `AdminLayout` | Sí |
| `/panel/contabilidad` | `AccountingPage` | `AdminLayout` | Sí |
| `/panel/contactos` | `ContactsPage` | `AdminLayout` | Sí |

## Layouts

### `PublicLayout`

Cabecera con enlaces a inicio, productos y contacto. Usado por las rutas públicas.

### `AdminLayout`

- Cabecera con título «Panel interno» y botón **Cerrar sesión**.
- Sidebar con navegación entre secciones del panel.
- Área principal con `<Outlet />` para la página activa.

## Protección de rutas

Las rutas bajo `/panel/*` (excepto `/panel/login`) están envueltas en `AuthGuard`:

- Si no hay token en contexto → redirección a `/panel/login` con `state.from` para volver tras login.
- Si hay token → renderiza `AdminLayout` y la página hija.

El token se persiste en `localStorage` bajo la clave `cal-y-canto-auth-token`.

## Lazy loading

Todas las páginas se importan con `React.lazy()` para dividir el bundle por ruta. `App.tsx` usa `Suspense` con fallback «Cargando...».

## Añadir una ruta

1. Añadir constante en `RoutePathEnum`.
2. Crear lazy import y entrada en el array de `createBrowserRouter`.
3. Si es ruta admin, colocarla como hijo de `AuthGuard` + `AdminLayout`.
4. Actualizar navegación en `public-layout.tsx` o `admin-layout.tsx` si aplica.
