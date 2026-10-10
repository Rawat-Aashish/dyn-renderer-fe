import type { FormComponent } from '../types/form'

function formatDate(value: string, withTime: boolean): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/** A stored answer as a person would read it: option labels, Yes/No, readable dates. */
export function formatAnswer(component: FormComponent, value: unknown): string {
  const labelOf = (raw: unknown) => {
    const option = (component.properties.options ?? []).find((candidate) => candidate.value === raw)
    return option ? option.label : String(raw)
  }

  switch (component.componentType) {
    case 'TOGGLE':
      return value === true ? 'Yes' : value === false ? 'No' : String(value)
    case 'DROPDOWN':
    case 'RADIO':
      return labelOf(value)
    case 'CHECKBOX':
    case 'MULTISELECT':
      return Array.isArray(value) ? value.map(labelOf).join(', ') : labelOf(value)
    case 'DATE':
      return typeof value === 'string' ? formatDate(value, false) : String(value)
    case 'DATETIME':
      return typeof value === 'string' ? formatDate(value, true) : String(value)
    default:
      return String(value)
  }
}
