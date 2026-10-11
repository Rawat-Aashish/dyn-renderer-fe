import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { FormFiller } from '../../hooks/useFormFiller'
import type { StepFlow } from '../../hooks/useStepFlow'
import type { Configuration } from '../../types/form'
import { Button } from '../ui/Button'
import { FormRenderer } from './FormRenderer'

interface SteppedFormProps {
  config: Configuration
  filler: FormFiller
  flow: StepFlow
  /** Called on the last step, after the form is asked to submit. The page decides what submitting does. */
  onSubmit: () => void
  submitting?: boolean
  /** Shown above the button, e.g. a general error or a preview result. */
  notice?: ReactNode
}

const navButton =
  'grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600'

/** One step of the form at a time, with a small top row, progress, back/forward arrows and the Next / Submit button. */
export function SteppedForm({ config, filler, flow, onSubmit, submitting = false, notice }: SteppedFormProps) {
  const { steps, step, index, isFirst, isLast, canForward, direction } = flow
  const multiStep = steps.length > 1
  const stepKey = step?.key ?? null
  const bodyRef = useRef<HTMLDivElement>(null)
  const previousKey = useRef<string | null>(stepKey)

  // Moving to another step: bring its heading into view and focus it, unless a field is about to be focused.
  useEffect(() => {
    if (previousKey.current !== null && previousKey.current !== stepKey && !flow.focusPending) {
      bodyRef.current?.focus({ preventScroll: true })
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    }
    previousKey.current = stepKey
  }, [stepKey, flow.focusPending])

  const transition = direction === 'forward' ? 'step-in-forward' : direction === 'back' ? 'step-in-back' : ''
  const position = multiStep ? `Step ${index + 1} of ${steps.length}` : ''

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (isLast) onSubmit()
        else flow.advance()
      }}
      className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200 sm:px-6 sm:py-5"
    >
      <div className="flex items-center justify-between gap-3">
        {!isFirst ? (
          <button type="button" aria-label="Previous section" onClick={flow.back} className={navButton}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <span aria-hidden="true" className="size-8 shrink-0" />
        )}
        <p className="min-w-0 truncate text-center text-[11px] font-medium tracking-wide text-slate-500">
          {config.name}
          {position && <span className="text-slate-400"> · </span>}
          {position}
        </p>
        {canForward ? (
          <button type="button" aria-label="Next section" onClick={flow.advance} className={navButton}>
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <span aria-hidden="true" className="size-8 shrink-0" />
        )}
      </div>

      {multiStep && (
        <progress
          className="form-progress mt-3"
          value={index + 1}
          max={steps.length}
          aria-label={`${position}`}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {multiStep && step ? `${position}${step.title ? `: ${step.title}` : ''}` : ''}
      </p>

      <div className="mt-5 overflow-x-clip">
        <div key={stepKey ?? 'empty'} className={transition}>
          {step && (
            <>
              <div ref={bodyRef} tabIndex={-1} className="mb-4 outline-none">
                {isFirst && config.description && (
                  <p className="mb-2 text-xs leading-relaxed text-slate-500">{config.description}</p>
                )}
                {step.title && <h2 className="text-lg font-semibold tracking-tight text-slate-900">{step.title}</h2>}
                {step.intro && <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.intro}</p>}
              </div>
              <FormRenderer
                components={step.components}
                answers={filler.answers}
                states={filler.states}
                errors={filler.errors}
                onChange={filler.setAnswer}
                onBlur={filler.touch}
              />
            </>
          )}
        </div>

        {notice && <div className="mt-4">{notice}</div>}

        <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full">
          {isLast ? 'Submit' : 'Next'}
        </Button>
      </div>
    </form>
  )
}
