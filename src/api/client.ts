import { useAuthStore } from '../stores/auth.store'
import type { ApiResponse } from '../types/api'

const BASE_URL: string = import.meta.env.VITE_API_URL

export const GENERIC_ERROR = 'Something went wrong. Please try again.'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string>

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR
}

export function fieldErrorsOf(error: unknown): Record<string, string> {
  return (error instanceof ApiError && error.errors) || {}
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  /** false for the login call and the public form endpoints, which must never carry the admin token */
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const headers: Record<string, string> = {}
  const isForm = body instanceof FormData
  // A multipart body sets its own content type, boundary included.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const token = auth ? useAuthStore.getState().session?.token : undefined
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  let envelope: ApiResponse<T>
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
    envelope = (await response.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(0, GENERIC_ERROR)
  }

  if (response.ok && envelope.success) return envelope.data as T

  if (response.status === 401 && auth) {
    const signedInAgain = useAuthStore.getState().requireReauth()
    // Reads are safe to repeat after signing in; writes are left for the admin to press again.
    if (method === 'GET') {
      await signedInAgain
      return request<T>(path, options)
    }
  }

  throw new ApiError(
    response.status,
    response.status >= 500 ? GENERIC_ERROR : envelope.message,
    envelope.errors,
  )
}

/** A file download from an admin endpoint. Failures come back as the usual JSON envelope. */
export async function requestBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {}
  const token = useAuthStore.getState().session?.token
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers })
  } catch {
    throw new ApiError(0, GENERIC_ERROR)
  }
  if (response.ok) return response.blob()

  if (response.status === 401) void useAuthStore.getState().requireReauth()
  let message = GENERIC_ERROR
  try {
    const envelope = (await response.json()) as ApiResponse<null>
    if (response.status < 500) message = envelope.message
  } catch {
    // not JSON: keep the generic message
  }
  throw new ApiError(response.status, message)
}
