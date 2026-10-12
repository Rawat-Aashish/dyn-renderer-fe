import { request } from '../api/client'
import type { StartResult, SubmitResult, UploadedFile } from '../types/submission'

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

/** Uploads one file for one FILE_UPLOAD field; uploading again for the same field replaces the earlier file. */
export function uploadFile(code: string, token: string, fieldCode: string, file: File): Promise<UploadedFile> {
  const body = new FormData()
  body.append('token', token)
  body.append('fieldCode', fieldCode)
  body.append('file', file)
  return request<UploadedFile>(`/api/forms/${encodeURIComponent(code)}/submissions/files`, {
    method: 'POST',
    body,
    auth: false,
  })
}

/** The visitor's one rating of a form they have submitted. */
export function submitRating(code: string, token: string, rating: number): Promise<null> {
  return request<null>(`/api/forms/${encodeURIComponent(code)}/submissions/rating`, {
    method: 'POST',
    body: { token, rating },
    auth: false,
  })
}
