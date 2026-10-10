import { request } from '../api/client'
import type { RuleType, ValidationRule } from '../types/form'

export interface NewRule {
  ruleType: RuleType
  ruleValue: string
  errorMessage?: string
}

export function addRule(componentId: number, body: NewRule): Promise<ValidationRule> {
  return request<ValidationRule>(`/api/components/${componentId}/validations`, { method: 'POST', body })
}

export function updateRule(
  componentId: number,
  ruleId: number,
  body: { ruleValue: string; errorMessage?: string },
): Promise<ValidationRule> {
  return request<ValidationRule>(`/api/components/${componentId}/validations/${ruleId}`, { method: 'PUT', body })
}

export function deleteRule(componentId: number, ruleId: number): Promise<null> {
  return request<null>(`/api/components/${componentId}/validations/${ruleId}`, { method: 'DELETE' })
}
