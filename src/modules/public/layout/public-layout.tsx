import { Link, Outlet } from 'react-router-dom'
import { RoutePathEnum } from '@/routes/route-path.enum'

const navItems = [
  { label: 'Inicio', path: RoutePathEnum.Home },
  { label: 'Productos', path: RoutePathEnum.Products },
  { label: 'Contacto', path: RoutePathEnum.Contact },
]

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
      <header className="border-b border-amber-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to={RoutePathEnum.Home} className="text-xl font-semibold text-rose-900">
            Cal y Canto
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium text-stone-600 transition hover:text-rose-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-amber-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
          <p>Repostería artesanal con sabor casero.</p>
          <Link
            to={RoutePathEnum.AdminLogin}
            className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium text-stone-600 transition hover:bg-muted hover:text-foreground"
          >
            Acceso interno
          </Link>
        </div>
      </footer>
    </div>
  )
}
