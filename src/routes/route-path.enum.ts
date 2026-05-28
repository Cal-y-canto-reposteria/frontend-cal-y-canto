export const RoutePathEnum = {
  Home: '/',
  Products: '/productos',
  Contact: '/contacto',
  AdminLogin: '/panel/login',
  AdminDashboard: '/panel',
  AdminRecipes: '/panel/recetas',
  AdminAccounting: '/panel/contabilidad',
  AdminContacts: '/panel/contactos',
  AdminCosts: '/panel/costos',
} as const

export type RoutePath = (typeof RoutePathEnum)[keyof typeof RoutePathEnum]
