import type { LoginCredentials, LoginResult } from '../../domain/auth.model'
import type { AuthOutputRepositoryInterface } from '../../domain/ports/auth.output-repository.interface'

export class AuthRepositoryMock implements AuthOutputRepositoryInterface {
  login(credentials: LoginCredentials): Promise<LoginResult> {
    if (
      credentials.email === 'admin@caly-canto.com' &&
      credentials.password === 'admin123'
    ) {
      return Promise.resolve({ accessToken: 'mock-token' })
    }

    return Promise.reject(new Error('Invalid credentials'))
  }
}
