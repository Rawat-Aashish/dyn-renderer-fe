import { request } from '../api/client'
import type { Page } from '../types/api'
import type { Form, FormDetail, FormInput, FormListParams } from '../types/form'

export function listForms(params: FormListParams): Promise<Page<Form>> {
  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    archived: String(params.archived),
  })
  if (params.status) query.set('status', params.status)
  if (params.search.trim()) query.set('search', params.search.trim())
  return request<Page<Form>>(`/api/forms?${query}`)
}

export function getForm(id: number): Promise<FormDetail> {
  return request<FormDetail>(`/api/forms/${id}`)
}

export function createForm(input: FormInput): Promise<Form> {
  return request<Form>('/api/forms', { method: 'POST', body: input })
}

export function updateForm(id: number, input: FormInput): Promise<Form> {
  return request<Form>(`/api/forms/${id}`, { method: 'PUT', body: input })
}

export function deleteForm(id: number): Promise<null> {
  return request<null>(`/api/forms/${id}`, { method: 'DELETE' })
}

export function archiveForm(id: number): Promise<Form> {
  return request<Form>(`/api/forms/${id}/archive`, { method: 'POST' })
}
