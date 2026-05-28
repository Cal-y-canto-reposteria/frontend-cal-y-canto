import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthGuard } from '@/modules/guards/auth-guard'
import { AdminLayout } from '@/modules/admin/layout/admin-layout'
import { LoginPage } from '@/modules/admin/pages/login-page'
import { DashboardPage } from '@/modules/admin/pages/dashboard-page'
import { RecipesPage } from '@/modules/admin/pages/recipes-page'
import { CostsPage } from '@/modules/admin/pages/costs-page'
import { AccountingPage } from '@/modules/admin/pages/accounting-page'
import { ContactsPage } from '@/modules/admin/pages/contacts-page'
import { PublicLayout } from '@/modules/public/layout/public-layout'
import { HomePage } from '@/modules/public/pages/home-page'
import { ProductsPage } from '@/modules/public/pages/products-page'
import { ContactPage } from '@/modules/public/pages/contact-page'
import { RoutePathEnum } from '@/routes/route-path.enum'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: RoutePathEnum.Home, element: <HomePage /> },
      { path: RoutePathEnum.Products, element: <ProductsPage /> },
      { path: RoutePathEnum.Contact, element: <ContactPage /> },
    ],
  },
  { path: RoutePathEnum.AdminLogin, element: <LoginPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: RoutePathEnum.AdminDashboard, element: <DashboardPage /> },
          { path: RoutePathEnum.AdminRecipes, element: <RecipesPage /> },
          { path: RoutePathEnum.AdminCosts, element: <CostsPage /> },
          { path: RoutePathEnum.AdminAccounting, element: <AccountingPage /> },
          { path: RoutePathEnum.AdminContacts, element: <ContactsPage /> },
        ],
      },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
