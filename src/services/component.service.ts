import { request } from '../api/client'
import type { ComponentRequest, FormComponent } from '../types/form'

export function addComponent(formId: number, body: ComponentRequest): Promise<FormComponent> {
  return request<FormComponent>(`/api/forms/${formId}/components`, { method: 'POST', body })
}

export function updateComponent(formId: number, componentId: number, body: ComponentRequest): Promise<FormComponent> {
  return request<FormComponent>(`/api/forms/${formId}/components/${componentId}`, { method: 'PUT', body })
}

export function deleteComponent(formId: number, componentId: number): Promise<null> {
  return request<null>(`/api/forms/${formId}/components/${componentId}`, { method: 'DELETE' })
}

export function reorderComponents(
  formId: number,
  parentSectionId: number | null,
  componentIds: number[],
): Promise<FormComponent[]> {
  return request<FormComponent[]>(`/api/forms/${formId}/components/reorder`, {
    method: 'PUT',
    body: { parentSectionId, componentIds },
  })
}
