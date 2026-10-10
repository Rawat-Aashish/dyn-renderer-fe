export interface LoginResult {
  token: string
  expiresIn: number
  firstName: string
  lastName: string | null
  email: string
  role: 'ADMIN'
}

export interface Session {
  token: string
  expiresAt: number
  firstName: string
  lastName: string | null
  email: string
}
