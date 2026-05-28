import { httpClient } from '@common/adapters/output/http/http-client'
import type { LoginCredentials, LoginResult } from '../../domain/auth.model'
import type { AuthOutputRepositoryInterface } from '../../domain/ports/auth.output-repository.interface'

export class AuthHttpRepository implements AuthOutputRepositoryInterface {
  login(credentials: LoginCredentials) {
    return httpClient<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }
}
