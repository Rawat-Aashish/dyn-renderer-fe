import { useCallback, useEffect, useMemo, useState } from 'react'
import { planSteps, resolveStepKey, stepKeyFor, type Step } from '../lib/form-logic/steps.ts'
import { focusField } from '../lib/focus-field'
import type { Configuration } from '../types/form'
import type { FormFiller } from './useFormFiller'

export interface StepFlowState {
  step: string
  reached: string[]
}

interface Options {
  /** What an earlier visit left behind. Unknown or missing values fall back to the first step. */
  initial?: { step?: string; reached?: string[] }
  onChange?: (state: StepFlowState) => void
}

export type Direction = 'none' | 'forward' | 'back'

export interface StepFlow {
  steps: Step[]
  step: Step | null
  index: number
  isFirst: boolean
  isLast: boolean
  /** The next step has been reached before, so the visitor may step forward without having just come back from it. */
  canForward: boolean
  /** How the current step was entered, to pick the transition. */
  direction: Direction
  /** A field is waiting to be focused once its step has mounted; the step heading should not take focus. */
  focusPending: boolean
  /** Next / forward arrow: checks the current step, then moves on. */
  advance: () => void
  /** Back arrow: never checks. */
  back: () => void
  /** Final Submit: the payload when the whole form passes; otherwise moves to the first step with a problem. */
  submit: () => Record<string, unknown> | null
  /** Takes the visitor to the step that holds a field (used for the server's messages). */
  reveal: (code: string) => void
}

/** Walks a form one step at a time on top of useFormFiller, which keeps owning answers and checks. */
export function useStepFlow(config: Configuration, filler: FormFiller, options: Options = {}): StepFlow {
  const { onChange } = options
  const [currentKey, setCurrentKey] = useState<string | null>(options.initial?.step ?? null)
  const [reached, setReached] = useState<string[]>(options.initial?.reached ?? [])
  const [direction, setDirection] = useState<Direction>('none')
  const [pendingFocus, setPendingFocus] = useState<string | null>(null)

  const plan = useMemo(() => planSteps(config, filler.states), [config, filler.states])
  const { steps } = plan
  const key = resolveStepKey(plan, currentKey)
  const index = key === null ? -1 : steps.findIndex((step) => step.key === key)
  const step = index === -1 ? null : steps[index]
  const next = index === -1 ? undefined : steps[index + 1]

  const reachedKeys = useMemo(() => {
    const set = new Set(reached)
    if (key) set.add(key)
    return set
  }, [reached, key])

  useEffect(() => {
    if (key) onChange?.({ step: key, reached: [...reachedKeys] })
  }, [key, reachedKeys, onChange])

  // Focus a field in a step that was only just mounted (a jump back from Submit or from a server message).
  useEffect(() => {
    if (pendingFocus === null) return
    const frame = requestAnimationFrame(() => {
      focusField(pendingFocus)
      setPendingFocus(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingFocus, key])

  const advance = useCallback(() => {
    if (!step || !next) return
    filler.touchMany(step.codes)
    const firstBroken = step.codes.find((code) => code in filler.allErrors)
    if (firstBroken !== undefined) {
      focusField(firstBroken)
      return
    }
    setReached((current) => [...new Set([...current, step.key, next.key])])
    setDirection('forward')
    setCurrentKey(next.key)
  }, [step, next, filler])

  const back = useCallback(() => {
    const previous = steps[index - 1]
    if (!previous) return
    setDirection('back')
    setCurrentKey(previous.key)
  }, [steps, index])

  const reveal = useCallback(
    (code: string) => {
      const target = stepKeyFor(steps, code)
      if (!target) return
      if (target === key) {
        focusField(code)
        return
      }
      setDirection(steps.findIndex((candidate) => candidate.key === target) < index ? 'back' : 'forward')
      setCurrentKey(target)
      setPendingFocus(code)
    },
    [steps, key, index],
  )

  const submit = useCallback(() => {
    const payload = filler.attemptSubmit()
    if (payload) return payload
    const [first] = Object.keys(filler.allErrors)
    if (first !== undefined) reveal(first)
    return null
  }, [filler, reveal])

  return {
    steps,
    step,
    index,
    isFirst: index <= 0,
    isLast: index === -1 || index === steps.length - 1,
    canForward: next !== undefined && reachedKeys.has(next.key),
    direction,
    focusPending: pendingFocus !== null,
    advance,
    back,
    submit,
    reveal,
  }
}
