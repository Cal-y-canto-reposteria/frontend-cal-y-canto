import { EnvironmentEnum } from '@environments/environment.enum'

export function providerFactory<T>(
  implementations: Partial<Record<EnvironmentEnum, T>>,
  defaultImplementation: T,
): T {
  const currentEnvironment = (import.meta.env.VITE_ENVIRONMENT ??
    EnvironmentEnum.Local) as EnvironmentEnum

  return implementations[currentEnvironment] ?? defaultImplementation
}
