import { useState } from 'react'
import type { Answers } from '../../lib/form-logic/answers.ts'
import type { FieldState } from '../../lib/form-logic/evaluate.ts'
import type { Configuration, FormComponent } from '../../types/form'
import { Field } from '../ui/Field'
import { FieldControl } from './FieldControl'

interface FormRendererProps {
  config: Configuration
  answers: Answers
  states: Map<string, FieldState>
  errors: Record<string, string>
  onChange: (code: string, value: unknown) => void
  onBlur: (code: string) => void
}

/** Turns a configuration into a working form. It only displays; the answers and checks live in useFormFiller. */
export function FormRenderer({ config, answers, states, errors, onChange, onBlur }: FormRendererProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())

  function toggle(code: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(code)) next.add(code)
      return next
    })
  }

  function renderComponent(component: FormComponent) {
    const state = states.get(component.fieldCode)
    if (!state?.visible) return null
    const code = component.fieldCode

    if (component.componentType === 'HEADING') {
      return (
        <div key={component.id}>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{component.fieldLabel}</h2>
          {component.helpText && <p className="mt-1 text-sm text-slate-600">{component.helpText}</p>}
        </div>
      )
    }

    if (component.componentType === 'SECTION') {
      const folded = collapsed.has(code)
      const collapsible = component.properties.collapsible === true
      const bodyId = `section-${code}`
      return (
        <section key={component.id} className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{component.fieldLabel}</h2>
              {component.helpText && <p className="mt-0.5 text-sm text-slate-600">{component.helpText}</p>}
            </div>
            {collapsible && (
              <button
                type="button"
                aria-expanded={!folded}
                aria-controls={bodyId}
                onClick={() => toggle(code)}
                className="rounded-md px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                {folded ? 'Show' : 'Hide'}
              </button>
            )}
          </div>
          <div id={bodyId} hidden={folded} className="space-y-5 border-t border-slate-200 px-4 py-4">
            {component.children.map(renderComponent)}
          </div>
        </section>
      )
    }

    const id = `field-${code}`
    const error = errors[code]
    return (
      <Field
        key={component.id}
        label={component.fieldLabel}
        htmlFor={id}
        required={state.required}
        error={error}
        help={component.helpText}
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
          disabled={!state.enabled || component.isReadOnly}
          invalid={Boolean(error)}
          describedBy={error ? `${id}-error` : undefined}
          clearable={!state.required}
        />
      </Field>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{config.name}</h1>
        {config.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{config.description}</p>}
      </header>
      {config.components.map(renderComponent)}
    </div>
  )
}
