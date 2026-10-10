import { request } from '../api/client'
import type { Page } from '../types/api'
import type { Version, VersionDetail } from '../types/form'

export function listVersions(formId: number, page: number, size: number): Promise<Page<Version>> {
  return request<Page<Version>>(`/api/forms/${formId}/versions?page=${page}&size=${size}`)
}

export function getVersion(formId: number, version: number): Promise<VersionDetail> {
  return request<VersionDetail>(`/api/forms/${formId}/versions/${version}`)
}

export function createVersion(formId: number): Promise<Version> {
  return request<Version>(`/api/forms/${formId}/versions`, { method: 'POST' })
}

export function publishVersion(formId: number, version: number): Promise<VersionDetail> {
  return request<VersionDetail>(`/api/forms/${formId}/versions/${version}/publish`, { method: 'POST' })
}
