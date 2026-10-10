import { useCallback, useEffect, useMemo, useState } from 'react'
import { initialAnswers, type Answers } from '../lib/form-logic/answers.ts'
import { evaluateStates, type FieldState } from '../lib/form-logic/evaluate.ts'
import { validateAnswers } from '../lib/form-logic/validate.ts'
import type { Configuration } from '../types/form'

interface Options {
  /** Answers restored from an earlier visit; otherwise every field starts at its default. */
  initialAnswers?: Answers
  onAnswersChange?: (answers: Answers) => void
}

export interface FormFiller {
  answers: Answers
  states: Map<string, FieldState>
  /** Messages to show now: after a field was left or a submit was tried, plus the server's. */
  errors: Record<string, string>
  setAnswer: (code: string, value: unknown) => void
  touch: (code: string) => void
  /** Checks everything. Returns the payload when it would be accepted; otherwise shows the messages and returns null. */
  attemptSubmit: () => Record<string, unknown> | null
  /** Shows the server's per-field messages; each clears as soon as that field is edited. */
  applyServerErrors: (errors: Record<string, string>) => void
}

export function useFormFiller(config: Configuration, options: Options = {}): FormFiller {
  const { onAnswersChange } = options
  const [answers, setAnswers] = useState<Answers>(() => options.initialAnswers ?? initialAnswers(config))
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  const states = useMemo(() => evaluateStates(config, answers), [config, answers])
  const outcome = useMemo(() => validateAnswers(config, answers, states), [config, answers, states])

  const errors = useMemo(() => {
    const shown: Record<string, string> = {}
    for (const [code, message] of Object.entries(outcome.errors)) {
      if (attempted || touched.has(code)) shown[code] = message
    }
    return { ...shown, ...serverErrors }
  }, [outcome.errors, attempted, touched, serverErrors])

  const setAnswer = useCallback(
    (code: string, value: unknown) => {
      setAnswers((current) => ({ ...current, [code]: value }))
      setServerErrors((current) => {
        if (!(code in current)) return current
        const next = { ...current }
        delete next[code]
        return next
      })
    },
    [],
  )

  useEffect(() => {
    onAnswersChange?.(answers)
  }, [answers, onAnswersChange])

  const touch = useCallback((code: string) => {
    setTouched((current) => (current.has(code) ? current : new Set(current).add(code)))
  }, [])

  const attemptSubmit = useCallback(() => {
    setAttempted(true)
    const [first] = Object.keys(outcome.errors)
    if (first === undefined) return outcome.payload

    const element = document.getElementById(`field-${first}`)
    const target = element?.matches('input, select, textarea, button')
      ? element
      : element?.querySelector<HTMLElement>('input, select, textarea, button')
    target?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return null
  }, [outcome])

  const applyServerErrors = useCallback((next: Record<string, string>) => setServerErrors(next), [])

  return { answers, states, errors, setAnswer, touch, attemptSubmit, applyServerErrors }
}
