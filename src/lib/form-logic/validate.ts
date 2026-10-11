import type { Configuration, FormComponent, ValidationRule } from '../../types/form.ts'
import { isEmpty, walk, type Answers } from './answers.ts'
import type { FieldState } from './evaluate.ts'

export interface ValidationOutcome {
  /** One message per invalid field, in display order, keyed by field code. */
  errors: Record<string, string>
  /** What would be sent: non-empty answers of visible, editable fields, in each type's JSON shape. */
  payload: Record<string, unknown>
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const DECIMAL_TEXT = /^-?\d+(\.\d+)?$/

const REQUIRED = 'This field is required'
const NOT_AN_OPTION = 'Must be one of the available options'
const NOT_IN_FORMAT = 'Is not in the expected format'

function decimalPlacesOf(numeric: number): number {
  const text = String(numeric)
  const point = text.indexOf('.')
  return point === -1 || text.includes('e') ? 0 : text.length - point - 1
}

/** The format message for a non-empty answer, or null when its shape is acceptable. */
function formatError(component: FormComponent, value: unknown): string | null {
  switch (component.componentType) {
    case 'TEXT':
    case 'TEXTAREA':
    case 'DROPDOWN':
    case 'RADIO':
      return typeof value === 'string' ? null : 'Must be text'
    case 'EMAIL':
      // Deliberately lenient: the server has the final say on what a valid address is.
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+$/.test(value) ? null : 'Must be a valid email address'
    case 'PHONE': {
      if (typeof value !== 'string' || !/^\+?[\d\s\-()]+$/.test(value)) return 'Must be a valid phone number'
      const digits = value.replace(/\D/g, '').length
      return digits >= 7 && digits <= 15 ? null : 'Must be a valid phone number'
    }
    case 'NUMBER':
      return typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? null : 'Must be a whole number'
    case 'DECIMAL': {
      const text = typeof value === 'string' ? value.trim() : ''
      if (!DECIMAL_TEXT.test(text) && !(text !== '' && Number.isFinite(Number(text)))) return 'Must be a number'
      // Judged on the number that is actually sent, so "1.50" counts as one decimal place.
      const places = component.properties.decimalPlaces ?? 2
      return decimalPlacesOf(Number(text)) <= places ? null : `Must have at most ${places} decimal places`
    }
    case 'CHECKBOX':
    case 'MULTISELECT':
      return Array.isArray(value) && value.every((item) => typeof item === 'string') ? null : 'Must be a list of option values'
    case 'TOGGLE':
      return typeof value === 'boolean' ? null : 'Must be true or false'
    case 'DATE':
      return typeof value === 'string' && DATE.test(value) && !Number.isNaN(Date.parse(value))
        ? null
        : 'Must be a date in the format yyyy-MM-dd'
    case 'DATETIME':
      return typeof value === 'string' && DATE_TIME.test(value) && !Number.isNaN(Date.parse(value))
        ? null
        : 'Must be a date and time in the format yyyy-MM-ddTHH:mm'
    default:
      return null
  }
}

// Letter escapes JavaScript understands. Any other (\A, \Z, \h, \R, \Q ...) is Java-only and would silently
// mean the plain letter in a non-unicode JS pattern, so such a pattern is left to the server.
const JS_LETTER_ESCAPES = new Set('dDwWsSbBnrtfvcxuk'.split(''))

const compiled = new Map<string, RegExp | null>()

/**
 * The server uses Java's full-match semantics, so the pattern must match the whole answer.
 * Returns null when the pattern cannot be reproduced faithfully in JavaScript; the server then decides.
 */
function compilePattern(source: string): RegExp | null {
  const known = compiled.get(source)
  if (known !== undefined) return known

  let body = source
  let flags = ''
  const leading = /^\(\?([a-zA-Z]+)\)/.exec(source)
  if (leading) {
    // Only i and s translate faithfully; (?x) comments and (?m) multi-line anchors do not.
    if (![...leading[1]].every((flag) => flag === 'i' || flag === 's')) {
      compiled.set(source, null)
      return null
    }
    flags = leading[1]
    body = source.slice(leading[0].length)
  }

  const wrapped = `^(?:${body})$`
  let regex: RegExp | null = null
  try {
    regex = new RegExp(wrapped, `${flags}u`)
  } catch {
    // Without the unicode flag \p{..} would match literal text, so only retry when the pattern has nothing
    // JavaScript would read differently from Java.
    const letters = [...body.matchAll(/\\([A-Za-z])/g)].map((match) => match[1])
    if (letters.every((letter) => JS_LETTER_ESCAPES.has(letter))) {
      try {
        regex = new RegExp(wrapped, flags)
      } catch {
        regex = null
      }
    }
  }

  compiled.set(source, regex)
  return regex
}

function ruleError(rule: ValidationRule, value: unknown): string | null {
  const own = rule.errorMessage || null
  const text = typeof value === 'string' ? value : ''
  switch (rule.ruleType) {
    case 'MIN_LENGTH':
      return text.length < Number(rule.ruleValue) ? (own ?? `Must be at least ${rule.ruleValue} characters`) : null
    case 'MAX_LENGTH':
      return text.length > Number(rule.ruleValue) ? (own ?? `Must be at most ${rule.ruleValue} characters`) : null
    case 'MIN':
      return Number(value) < Number(rule.ruleValue) ? (own ?? `Must be at least ${rule.ruleValue}`) : null
    case 'MAX':
      return Number(value) > Number(rule.ruleValue) ? (own ?? `Must be at most ${rule.ruleValue}`) : null
    case 'DATE_MIN':
      return Date.parse(text) < Date.parse(rule.ruleValue) ? (own ?? `Must be on or after ${rule.ruleValue}`) : null
    case 'DATE_MAX':
      return Date.parse(text) > Date.parse(rule.ruleValue) ? (own ?? `Must be on or before ${rule.ruleValue}`) : null
    case 'REGEX': {
      const pattern = compilePattern(rule.ruleValue)
      return pattern && !pattern.test(text) ? (own ?? NOT_IN_FORMAT) : null
    }
    default:
      return null
  }
}

function optionError(component: FormComponent, value: unknown): string | null {
  const type = component.componentType
  if (type !== 'DROPDOWN' && type !== 'RADIO' && type !== 'CHECKBOX' && type !== 'MULTISELECT') return null
  const allowed = new Set((component.properties.options ?? []).map((option) => option.value))
  const chosen = Array.isArray(value) ? (value as string[]) : [value as string]
  return chosen.every((item) => allowed.has(item)) ? null : NOT_AN_OPTION
}

function toJson(component: FormComponent, value: unknown): unknown {
  const type = component.componentType
  if (type === 'NUMBER' || type === 'DECIMAL') return Number((value as string).trim())
  return value
}

/** Checks the current answers the way the server will, and builds the payload that would be sent. */
export function validateAnswers(
  config: Configuration,
  answers: Answers,
  states: Map<string, FieldState>,
): ValidationOutcome {
  const errors: Record<string, string> = {}
  const payload: Record<string, unknown> = {}

  for (const { component } of walk(config.components)) {
    const type = component.componentType
    if (type === 'SECTION' || type === 'HEADING') continue
    const code = component.fieldCode
    const state = states.get(code)
    if (!state || !state.visible) continue

    // The server ignores whatever is sent for a read-only field and stores its default.
    if (component.isReadOnly) continue

    const value = answers[code]

    if (!state.enabled) {
      // Not validated and not stored, but still sent: another field's condition may read it.
      if (!isEmpty(value)) payload[code] = typeof value === 'string' && (type === 'NUMBER' || type === 'DECIMAL') ? Number(value) : value
      continue
    }

    if (isEmpty(value)) {
      if (state.required) errors[code] = REQUIRED
      continue
    }

    if (type === 'TOGGLE' && state.required && value !== true) {
      errors[code] = REQUIRED
      continue
    }

    const format = formatError(component, value)
    if (format) {
      errors[code] = format
      continue
    }

    const broken = component.validationRules.map((rule) => ruleError(rule, value)).find((message) => message !== null)
    if (broken) {
      errors[code] = broken
      continue
    }

    const option = optionError(component, value)
    if (option) {
      errors[code] = option
      continue
    }

    payload[code] = toJson(component, value)
  }

  return { errors, payload }
}
