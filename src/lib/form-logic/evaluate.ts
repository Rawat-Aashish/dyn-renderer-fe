import type { Condition, ConditionRule, Configuration, FormComponent } from '../../types/form.ts'
import { isEmpty, walk, type Answers } from './answers.ts'

export interface FieldState {
  visible: boolean
  enabled: boolean
  required: boolean
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : String(value)
}

function toMoment(value: unknown): number {
  return Date.parse(asText(value))
}

function equalsValue(type: FormComponent['componentType'], value: unknown, expected: string): boolean {
  if (type === 'NUMBER' || type === 'DECIMAL') {
    const a = Number(asText(value))
    const b = Number(expected)
    return Number.isFinite(a) && Number.isFinite(b) && a === b
  }
  if (type === 'DATE' || type === 'DATETIME') {
    const a = toMoment(value)
    const b = Date.parse(expected)
    return !Number.isNaN(a) && !Number.isNaN(b) && a === b
  }
  return asText(value).toLowerCase() === expected.toLowerCase()
}

/** Negative, zero or positive; null when the two cannot be compared. */
function compareValues(type: FormComponent['componentType'], value: unknown, expected: string): number | null {
  let a: number
  let b: number
  if (type === 'NUMBER' || type === 'DECIMAL') {
    a = Number(asText(value))
    b = Number(expected)
  } else if (type === 'DATE' || type === 'DATETIME') {
    a = toMoment(value)
    b = Date.parse(expected)
  } else {
    return null
  }
  return Number.isNaN(a) || Number.isNaN(b) ? null : a - b
}

function ruleMatches(rule: ConditionRule, source: FormComponent, value: unknown): boolean {
  if (rule.operator === 'IS_EMPTY') return isEmpty(value)
  // Every other operator, NOT_EQUALS included, is false when the source has no answer.
  if (isEmpty(value)) return false
  if (rule.operator === 'IS_NOT_EMPTY') return true

  const expected = rule.value ?? ''
  const type = source.componentType
  switch (rule.operator) {
    case 'EQUALS':
      return equalsValue(type, value, expected)
    case 'NOT_EQUALS':
      return !equalsValue(type, value, expected)
    case 'CONTAINS':
      return Array.isArray(value)
        ? value.map(asText).includes(expected)
        : asText(value).toLowerCase().includes(expected.toLowerCase())
    case 'GREATER_THAN':
    case 'LESS_THAN':
    case 'GREATER_THAN_OR_EQUAL':
    case 'LESS_THAN_OR_EQUAL': {
      const difference = compareValues(type, value, expected)
      if (difference === null) return false
      if (rule.operator === 'GREATER_THAN') return difference > 0
      if (rule.operator === 'LESS_THAN') return difference < 0
      if (rule.operator === 'GREATER_THAN_OR_EQUAL') return difference >= 0
      return difference <= 0
    }
    default:
      return false
  }
}

/**
 * Decides visibility, enabled state and required state of every component from the current answers,
 * following "How the server decides each field" in handover/submissions.md.
 */
export function evaluateStates(config: Configuration, answers: Answers): Map<string, FieldState> {
  const nodes = walk(config.components)
  const byCode = new Map(nodes.map((node) => [node.component.fieldCode, node]))
  const conditionsByTarget = new Map<string, Condition[]>()
  for (const condition of config.conditions) {
    const list = conditionsByTarget.get(condition.targetFieldCode) ?? []
    list.push(condition)
    conditionsByTarget.set(condition.targetFieldCode, list)
  }

  const visibility = new Map<string, boolean>()
  const inProgress = new Set<string>()

  function conditionFor(code: string, actions: string[]): Condition | undefined {
    return conditionsByTarget.get(code)?.find((condition) => actions.includes(condition.action))
  }

  function isVisible(code: string): boolean {
    const known = visibility.get(code)
    if (known !== undefined) return known
    const node = byCode.get(code)
    // A condition cycle is refused by the server; this only keeps a malformed configuration from looping.
    if (!node || inProgress.has(code)) return true
    inProgress.add(code)

    let visible: boolean
    if (node.parent && !isVisible(node.parent.fieldCode)) {
      visible = false
    } else {
      const condition = conditionFor(code, ['SHOW', 'HIDE'])
      visible = condition ? decide(condition, 'SHOW') : node.component.isVisible
    }

    inProgress.delete(code)
    visibility.set(code, visible)
    return visible
  }

  // What a condition reads: a hidden source counts as empty, a read-only one is read as its default.
  function answerOf(code: string): unknown {
    const node = byCode.get(code)
    if (!node || !isVisible(code)) return undefined
    return node.component.isReadOnly ? node.component.defaultValue : answers[code]
  }

  function decide(condition: Condition, positiveAction: string): boolean {
    const matched = (rule: ConditionRule) => {
      const source = byCode.get(rule.sourceFieldCode)
      return source ? ruleMatches(rule, source.component, answerOf(rule.sourceFieldCode)) : false
    }
    const matches = condition.logicalOperator === 'AND' ? condition.rules.every(matched) : condition.rules.some(matched)
    return condition.action === positiveAction ? matches : !matches
  }

  const states = new Map<string, FieldState>()
  for (const { component } of nodes) {
    const code = component.fieldCode
    const enabledCondition = conditionFor(code, ['ENABLE', 'DISABLE'])
    const requiredCondition = conditionFor(code, ['MAKE_REQUIRED', 'MAKE_OPTIONAL'])
    states.set(code, {
      visible: isVisible(code),
      enabled: enabledCondition ? decide(enabledCondition, 'ENABLE') : !component.isDisabled,
      required: requiredCondition ? decide(requiredCondition, 'MAKE_REQUIRED') : component.isRequired,
    })
  }
  return states
}
