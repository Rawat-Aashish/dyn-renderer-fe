import type { Configuration } from './form'

export interface StartResult {
  token: string
  formCode: string
  version: number
  startedAt: string
  configuration: Configuration
}

export interface SubmitResult {
  submissionId: number
  formCode: string
  version: number
  submittedAt: string
}

export interface Submission {
  id: number
  formId: number
  formCode: string
  formName: string
  archived: boolean
  version: number
  startedAt: string
  submittedAt: string
  /** Stored answers keyed by field code */
  data: Record<string, unknown>
}

export interface SubmissionList {
  formId: number
  formCode: string
  formName: string
  archived: boolean
  /** every start call for the form; not affected by the version filter */
  startedCount: number
  /** every accepted submission of the form; not affected by the version filter */
  submittedCount: number
  items: Submission[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export type AuditAction = 'FORM_CREATED' | 'FORM_CLONED' | 'FORM_UPDATED' | 'VERSION_CREATED' | 'VERSION_PUBLISHED' | 'FORM_ARCHIVED'

export interface AuditEntry {
  id: number
  action: AuditAction
  versionNumber: number
  userId: number
  userName: string
  userEmail: string
  createdAt: string
}
