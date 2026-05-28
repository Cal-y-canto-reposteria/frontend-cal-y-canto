import type { LoginCredentials, LoginResult } from '../auth.model'

export interface AuthInputServiceInterface {
  login(credentials: LoginCredentials): Promise<LoginResult>
}
