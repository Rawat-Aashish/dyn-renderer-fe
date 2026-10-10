export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errors?: Record<string, string>
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}
