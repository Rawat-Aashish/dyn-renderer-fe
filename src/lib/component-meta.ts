import type { Action, ComponentType, FormComponent, Operator, RuleType } from '../types/form'

export const TYPE_LABELS: Record<ComponentType, string> = {
  TEXT: 'Text',
  TEXTAREA: 'Text area',
  NUMBER: 'Number',
  DECIMAL: 'Decimal',
  EMAIL: 'Email',
  PHONE: 'Phone',
  DROPDOWN: 'Dropdown',
  RADIO: 'Radio buttons',
  CHECKBOX: 'Checkboxes',
  MULTISELECT: 'Multi-select',
  TOGGLE: 'Toggle',
  DATE: 'Date',
  DATETIME: 'Date and time',
  SECTION: 'Section',
  HEADING: 'Heading',
}

export const PALETTE_GROUPS: { title: string; types: ComponentType[] }[] = [
  { title: 'Inputs', types: ['TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'EMAIL', 'PHONE', 'TOGGLE', 'DATE', 'DATETIME'] },
  { title: 'Choices', types: ['DROPDOWN', 'RADIO', 'CHECKBOX', 'MULTISELECT'] },
  { title: 'Layout', types: ['SECTION', 'HEADING'] },
]

export function isLayout(type: ComponentType): boolean {
  return type === 'SECTION' || type === 'HEADING'
}

export function isChoice(type: ComponentType): boolean {
  return type === 'DROPDOWN' || type === 'RADIO' || type === 'CHECKBOX' || type === 'MULTISELECT'
}

/** Types whose control has an empty state that a placeholder can describe. */
export function supportsPlaceholder(type: ComponentType): boolean {
  return ['TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'EMAIL', 'PHONE', 'DROPDOWN', 'MULTISELECT'].includes(type)
}

export const RULE_TYPES_BY_COMPONENT: Record<ComponentType, RuleType[]> = {
  TEXT: ['MIN_LENGTH', 'MAX_LENGTH', 'REGEX'],
  TEXTAREA: ['MIN_LENGTH', 'MAX_LENGTH', 'REGEX'],
  EMAIL: ['MIN_LENGTH', 'MAX_LENGTH'],
  PHONE: ['MIN_LENGTH', 'MAX_LENGTH', 'REGEX'],
  NUMBER: ['MIN', 'MAX'],
  DECIMAL: ['MIN', 'MAX'],
  DATE: ['DATE_MIN', 'DATE_MAX'],
  DATETIME: ['DATE_MIN', 'DATE_MAX'],
  DROPDOWN: [],
  RADIO: [],
  CHECKBOX: [],
  MULTISELECT: [],
  TOGGLE: [],
  SECTION: [],
  HEADING: [],
}

/** Every component in the tree, sections followed by their children. */
export function flattenComponents(components: FormComponent[]): FormComponent[] {
  return components.flatMap((component) => [component, ...flattenComponents(component.children)])
}

export function findComponent(components: FormComponent[], id: number | null): FormComponent | undefined {
  if (id === null) return undefined
  return flattenComponents(components).find((component) => component.id === id)
}

const EQUALITY_TYPES: ComponentType[] = [
  'TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'EMAIL', 'PHONE', 'DROPDOWN', 'RADIO', 'TOGGLE', 'DATE', 'DATETIME',
]
const CONTAINS_TYPES: ComponentType[] = ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'CHECKBOX', 'MULTISELECT']
const COMPARABLE_TYPES: ComponentType[] = ['NUMBER', 'DECIMAL', 'DATE', 'DATETIME']

/** The operators a condition rule may use when the source field has this type. */
export function operatorsFor(type: ComponentType): Operator[] {
  if (isLayout(type)) return []
  const operators: Operator[] = []
  if (EQUALITY_TYPES.includes(type)) operators.push('EQUALS', 'NOT_EQUALS')
  if (CONTAINS_TYPES.includes(type)) operators.push('CONTAINS')
  if (COMPARABLE_TYPES.includes(type)) operators.push('GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL')
  operators.push('IS_EMPTY', 'IS_NOT_EMPTY')
  return operators
}

export function operatorLabel(operator: Operator, sourceType: ComponentType): string {
  const date = sourceType === 'DATE' || sourceType === 'DATETIME'
  switch (operator) {
    case 'EQUALS': return 'equals'
    case 'NOT_EQUALS': return 'does not equal'
    case 'CONTAINS': return 'contains'
    case 'GREATER_THAN': return date ? 'is after' : 'is greater than'
    case 'LESS_THAN': return date ? 'is before' : 'is less than'
    case 'GREATER_THAN_OR_EQUAL': return date ? 'is on or after' : 'is at least'
    case 'LESS_THAN_OR_EQUAL': return date ? 'is on or before' : 'is at most'
    case 'IS_EMPTY': return 'is empty'
    case 'IS_NOT_EMPTY': return 'is not empty'
  }
}

export function needsValue(operator: Operator): boolean {
  return operator !== 'IS_EMPTY' && operator !== 'IS_NOT_EMPTY'
}

/** A target can have at most one condition per pair; the pair decides which property it controls. */
export const CONDITION_PAIRS = [
  {
    id: 'visibility',
    title: 'Visibility',
    hint: "Show or hide this field depending on other fields' answers.",
    actions: ['SHOW', 'HIDE'] as Action[],
    flag: 'isVisible' as const,
  },
  {
    id: 'enabled',
    title: 'Enabled',
    hint: "Let people fill in this field, or lock it, depending on other fields' answers.",
    actions: ['ENABLE', 'DISABLE'] as Action[],
    flag: 'isDisabled' as const,
  },
  {
    id: 'required',
    title: 'Required',
    hint: "Make this field required or optional depending on other fields' answers.",
    actions: ['MAKE_REQUIRED', 'MAKE_OPTIONAL'] as Action[],
    flag: 'isRequired' as const,
  },
]
export type ConditionPair = (typeof CONDITION_PAIRS)[number]

export const ACTION_LABELS: Record<Action, string> = {
  SHOW: 'Show',
  HIDE: 'Hide',
  ENABLE: 'Enable',
  DISABLE: 'Disable',
  MAKE_REQUIRED: 'Make required',
  MAKE_OPTIONAL: 'Make optional',
}
