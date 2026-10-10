import type { BadgeTone } from '../components/ui/Badge'
import type { Form } from '../types/form'

export interface FormStatusInfo {
  label: string
  tone: BadgeTone
}

export function describeStatus(form: Form): FormStatusInfo {
  if (form.archived) return { label: 'Archived', tone: 'slate' }
  if (form.status === 'PUBLISHED') return { label: `Published v${form.publishedVersion}`, tone: 'green' }
  if (form.publishedVersion !== null) {
    return { label: `Draft v${form.currentVersion} · v${form.publishedVersion} live`, tone: 'amber' }
  }
  return { label: `Draft v${form.currentVersion}`, tone: 'amber' }
}

/** Edits are possible only while the latest version is a draft and the form is not archived. */
export function isLocked(form: Form): boolean {
  return form.archived || form.status !== 'DRAFT'
}
