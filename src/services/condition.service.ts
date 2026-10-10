import { request } from '../api/client'
import type { Condition, ConditionRequest } from '../types/form'

export function addCondition(formId: number, body: ConditionRequest): Promise<Condition> {
  return request<Condition>(`/api/forms/${formId}/conditions`, { method: 'POST', body })
}

export function updateCondition(formId: number, conditionId: number, body: ConditionRequest): Promise<Condition> {
  return request<Condition>(`/api/forms/${formId}/conditions/${conditionId}`, { method: 'PUT', body })
}

export function deleteCondition(formId: number, conditionId: number): Promise<null> {
  return request<null>(`/api/forms/${formId}/conditions/${conditionId}`, { method: 'DELETE' })
}
