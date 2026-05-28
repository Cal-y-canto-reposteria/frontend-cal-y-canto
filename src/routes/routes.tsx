import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminLayout } from '@common/layout/admin-layout'
import { PublicLayout } from '@common/layout/public-layout'
import { AuthGuard } from '@common/guards/auth-guard'
import { RoutePathEnum } from '@routes/route-path.enum'

const HomePage = lazy(() =>
  import('@modules/home/adapters/input/home-page/home-page').then((module) => ({
    default: module.HomePage,
  })),
)

const ProductsPage = lazy(() =>
  import('@modules/products/adapters/input/products-page/products-page').then((module) => ({
    default: module.ProductsPage,
  })),
)

const ContactPage = lazy(() =>
  import('@modules/contact/adapters/input/contact-page/contact-page').then((module) => ({
    default: module.ContactPage,
  })),
)

const LoginPage = lazy(() =>
  import('@modules/auth/adapters/input/login-page/login-page').then((module) => ({
    default: module.LoginPage,
  })),
)

const DashboardPage = lazy(() =>
  import('@modules/dashboard/adapters/input/dashboard-page/dashboard-page').then(
    (module) => ({ default: module.DashboardPage }),
  ),
)

const RecipesPage = lazy(() =>
  import('@modules/recipes/adapters/input/recipes-page/recipes-page').then((module) => ({
    default: module.RecipesPage,
  })),
)

const CostsPage = lazy(() =>
  import('@modules/costs/adapters/input/costs-page/costs-page').then((module) => ({
    default: module.CostsPage,
  })),
)

const AccountingPage = lazy(() =>
  import('@modules/accounting/adapters/input/accounting-page/accounting-page').then(
    (module) => ({ default: module.AccountingPage }),
  ),
)

const ContactsPage = lazy(() =>
  import('@modules/contacts/adapters/input/contacts-page/contacts-page').then(
    (module) => ({ default: module.ContactsPage }),
  ),
)

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
