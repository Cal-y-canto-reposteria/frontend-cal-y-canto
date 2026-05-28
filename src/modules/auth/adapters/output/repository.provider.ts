import { providerFactory } from '@common/providers/repository-provider.factory'
import { EnvironmentEnum } from '@environments/environment.enum'
import type { AuthOutputRepositoryInterface } from '../../domain/ports/auth.output-repository.interface'
import { AuthHttpRepository } from './auth-http.repository'
import { AuthRepositoryMock } from './auth.repository.mock'

export const authRepository = providerFactory<AuthOutputRepositoryInterface>(
  {
    [EnvironmentEnum.Mocked]: new AuthRepositoryMock(),
  },
  new AuthHttpRepository(),
)
