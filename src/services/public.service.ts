import { request } from '../api/client'
import type { StartResult, SubmitResult } from '../types/submission'

// These two endpoints are public: auth is switched off so an admin token in the same browser is never sent.
export function startSubmission(code: string): Promise<StartResult> {
  return request<StartResult>(`/api/forms/${encodeURIComponent(code)}/submissions/start`, {
    method: 'POST',
    auth: false,
  })
}

export function submitAnswers(code: string, token: string, data: Record<string, unknown>): Promise<SubmitResult> {
  return request<SubmitResult>(`/api/forms/${encodeURIComponent(code)}/submissions`, {
    method: 'POST',
    body: { token, data },
    auth: false,
  })
}
