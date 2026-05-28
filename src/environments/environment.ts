import { EnvironmentEnum } from './environment.enum'

export const environment = {
  name: (import.meta.env.VITE_ENVIRONMENT ?? EnvironmentEnum.Local) as EnvironmentEnum,
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api-cal-y-canto',
}
