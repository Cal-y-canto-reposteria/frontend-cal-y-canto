import type { LoginCredentials, LoginResult } from '../auth.model'

export interface AuthOutputRepositoryInterface {
  login(credentials: LoginCredentials): Promise<LoginResult>
}
