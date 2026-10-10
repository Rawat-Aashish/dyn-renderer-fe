/** Timestamps arrive as local date-times without a zone; show them as the same wall-clock time. */
export function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** "Customer Feedback" -> "customer-feedback": lowercase, hyphenated, starting with a letter, at most 50 characters. */
export function toFormCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[^a-z]+/, '')
    .replace(/-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

/** "Date of birth" -> "date_of_birth": starts with a letter; letters, digits and underscores; at most 100. */
export function toFieldCode(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[^a-z]+/, '')
    .replace(/_+$/g, '')
    .slice(0, 100)
}
