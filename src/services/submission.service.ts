import { request } from '../api/client'
import type { Page } from '../types/api'
import type { AuditEntry, Submission, SubmissionList } from '../types/submission'

export function listSubmissions(
  formCode: string,
  params: { page: number; size: number; version: number | null },
): Promise<SubmissionList> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size) })
  if (params.version !== null) query.set('version', String(params.version))
  return request<SubmissionList>(`/api/forms/${encodeURIComponent(formCode)}/submissions?${query}`)
}

export function getSubmission(submissionId: number): Promise<Submission> {
  return request<Submission>(`/api/submissions/${submissionId}`)
}

export function listAudit(formId: number, page: number, size: number): Promise<Page<AuditEntry>> {
  return request<Page<AuditEntry>>(`/api/forms/${formId}/audit?page=${page}&size=${size}`)
}
