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

// Light to dark: the further along, the deeper the colour. Whole class names so Tailwind can see them.
const RAMP = ['bg-accent-200', 'bg-accent-300', 'bg-accent-400', 'bg-accent-500', 'bg-accent-600', 'bg-accent-700']

const navButton =
  'grid size-11 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-5">
      <path d={direction === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} />
    </svg>
  )
}

/** One step of the form at a time, with the header, progress, back/forward arrows and the Next / Submit button. */
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

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (isLast) onSubmit()
        else flow.advance()
      }}
      className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200"
    >
      <header className="bg-accent-700 px-5 pt-4 pb-7 text-white sm:px-8">
        <div className="flex min-h-11 items-center justify-between">
          {!isFirst ? (
            <button type="button" aria-label="Previous section" onClick={flow.back} className={navButton}>
              <Chevron direction="left" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-11" />
          )}
          {multiStep && (
            <p className="text-xs font-semibold tracking-wide text-accent-100 uppercase">
              Step {index + 1} of {steps.length}
            </p>
          )}
          {canForward ? (
            <button type="button" aria-label="Next section" onClick={flow.advance} className={navButton}>
              <Chevron direction="right" />
            </button>
          ) : (
            <span aria-hidden="true" className="size-11" />
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{config.name}</h1>
        {isFirst && config.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-accent-100">{config.description}</p>
        )}
      </header>

      {multiStep && (
        <div aria-hidden="true" className="flex gap-1.5 px-5 pt-5 sm:px-8">
          {steps.map((item, i) => (
            <span
              key={item.key}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= index ? RAMP[Math.round((i / (steps.length - 1)) * (RAMP.length - 1))] : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {multiStep && step ? `Step ${index + 1} of ${steps.length}${step.title ? `: ${step.title}` : ''}` : ''}
      </p>

      <div className="overflow-x-clip px-5 py-6 sm:px-8">
        <div key={stepKey ?? 'empty'} className={transition}>
          {step && (
            <>
              <div ref={bodyRef} tabIndex={-1} className="mb-6 outline-none">
                {step.title && <h2 className="text-xl font-semibold tracking-tight text-slate-900">{step.title}</h2>}
                {step.intro && <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.intro}</p>}
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

        {notice && <div className="mt-6">{notice}</div>}

        <Button type="submit" size="lg" loading={submitting} className="mt-8 w-full">
          {isLast ? 'Submit' : 'Next'}
        </Button>
      </div>
    </form>
  )
}
