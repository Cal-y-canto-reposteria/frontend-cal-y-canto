import type { AuthInputServiceInterface } from '../domain/ports/auth.input-service.interface'
import type { AuthOutputRepositoryInterface } from '../domain/ports/auth.output-repository.interface'
import type { LoginCredentials } from '../domain/auth.model'

export class AuthService implements AuthInputServiceInterface {
  constructor(private readonly repository: AuthOutputRepositoryInterface) {}

  login(credentials: LoginCredentials) {
    return this.repository.login(credentials)
  }
}
