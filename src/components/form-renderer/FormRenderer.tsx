import type { Answers } from '../../lib/form-logic/answers.ts'
import type { FieldState } from '../../lib/form-logic/evaluate.ts'
import type { FormComponent } from '../../types/form'
import { Field } from '../ui/Field'
import { FieldControl } from './FieldControl'

interface FormRendererProps {
  /** The components to show: one step's worth. Sections are steps, so they never appear in here. */
  components: FormComponent[]
  answers: Answers
  states: Map<string, FieldState>
  errors: Record<string, string>
  onChange: (code: string, value: unknown) => void
  onBlur: (code: string) => void
}

/** Turns components into working inputs. It only displays; the answers and checks live in useFormFiller. */
export function FormRenderer({ components, answers, states, errors, onChange, onBlur }: FormRendererProps) {
  return (
    <div className="space-y-4">
      {components.map((component) => {
        const state = states.get(component.fieldCode)
        if (!state?.visible) return null
        const code = component.fieldCode

        if (component.componentType === 'HEADING') {
          return (
            <div key={component.id}>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{component.fieldLabel}</h3>
              {component.helpText && <p className="mt-1 text-sm text-slate-600">{component.helpText}</p>}
            </div>
          )
        }

        const id = `field-${code}`
        const error = errors[code]
        const locked = component.isReadOnly || !state.enabled
        const note = locked
          ? component.isReadOnly
            ? "This value is fixed and can't be changed."
            : 'This field is not available for editing.'
          : undefined
        const describedBy = [error ? `${id}-error` : null, note ? `${id}-note` : null].filter(Boolean).join(' ')
        return (
          <Field
            key={component.id}
            label={component.fieldLabel}
            htmlFor={id}
            required={state.required}
            error={error}
            help={component.helpText}
            note={note}
          >
            <FieldControl
              type={component.componentType}
              id={id}
              value={answers[code]}
              onChange={(value) => onChange(code, value)}
              onBlur={() => onBlur(code)}
              options={component.properties.options}
              placeholder={component.placeholder}
              decimalPlaces={component.properties.decimalPlaces}
              disabled={locked}
              invalid={Boolean(error)}
              describedBy={describedBy || undefined}
              clearable={!state.required}
            />
          </Field>
        )
      })}
    </div>
  )
}
