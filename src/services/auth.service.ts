import { request } from '../api/client'
import type { LoginResult } from '../types/auth'

export function login(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}
