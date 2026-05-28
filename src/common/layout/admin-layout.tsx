import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@common/context/auth-context'
import { RoutePathEnum } from '@routes/route-path.enum'

const adminNavItems = [
  { label: 'Inicio', path: RoutePathEnum.AdminDashboard },
  { label: 'Recetas', path: RoutePathEnum.AdminRecipes },
  { label: 'Costos', path: RoutePathEnum.AdminCosts },
  { label: 'Contabilidad', path: RoutePathEnum.AdminAccounting },
  { label: 'Contactos', path: RoutePathEnum.AdminContacts },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate(RoutePathEnum.AdminLogin)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Panel interno</p>
            <h1 className="text-lg font-semibold text-stone-900">Cal y Canto</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border bg-white p-4 shadow-sm">
          <nav className="flex flex-col gap-2">
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-rose-50 hover:text-rose-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
