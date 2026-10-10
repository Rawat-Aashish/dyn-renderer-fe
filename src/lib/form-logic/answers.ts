import type { Configuration, FormComponent } from '../../types/form.ts'

/**
 * Answers as the controls hold them, keyed by field code: a string for text, number, date and single choice
 * (numbers stay as typed), a list of strings for CHECKBOX and MULTISELECT, a boolean for TOGGLE.
 */
export type Answers = Record<string, unknown>

export interface ComponentNode {
  component: FormComponent
  /** The section this component sits in, if any. */
  parent: FormComponent | null
}

/** Every component in display order, sections followed by their children. */
export function walk(components: FormComponent[], parent: FormComponent | null = null): ComponentNode[] {
  return components.flatMap((component) => [{ component, parent }, ...walk(component.children, component)])
}

/** The server's definition: missing, null, "" or an empty list. A string of spaces is not empty. */
export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

function toControlValue(component: FormComponent): unknown {
  const value = component.defaultValue
  switch (component.componentType) {
    case 'CHECKBOX':
    case 'MULTISELECT':
      return Array.isArray(value) ? value.map(String) : []
    case 'TOGGLE':
      // A switch always shows on or off, so an untouched one is answered "off" rather than left missing.
      return value === true
    default:
      return value === null || value === undefined ? '' : String(value)
  }
}

export function initialAnswers(config: Configuration): Answers {
  const answers: Answers = {}
  for (const { component } of walk(config.components)) {
    if (component.componentType === 'SECTION' || component.componentType === 'HEADING') continue
    answers[component.fieldCode] = toControlValue(component)
  }
  return answers
}
