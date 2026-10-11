import { CircleCheck, TriangleAlert } from 'lucide-react'
import { flattenComponents, isChoice, isLayout } from '../../lib/component-meta'
import type { Condition, FormComponent } from '../../types/form'

interface FormOverviewProps {
  components: FormComponent[]
  conditions: Condition[]
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

/** What the form holds, and what is already known to block publishing. Shown while no field is selected. */
export function FormOverview({ components, conditions }: FormOverviewProps) {
  const flat = flattenComponents(components)
  const sections = flat.filter((component) => component.componentType === 'SECTION')
  const inputs = flat.filter((component) => !isLayout(component.componentType))
  const rules = flat.reduce((total, component) => total + component.validationRules.length, 0)

  // These are the problems the publish check is sure to find; the server runs the complete check.
  const emptySections = sections.filter((section) => section.children.length === 0)
  const noOptions = flat.filter(
    (component) => isChoice(component.componentType) && (component.properties.options ?? []).length === 0,
  )
  const checks: { ok: boolean; text: string }[] = [
    { ok: inputs.length > 0, text: inputs.length > 0 ? 'The form has input fields' : 'Add at least one input field' },
    {
      ok: emptySections.length === 0,
      text:
        emptySections.length === 0
          ? 'No empty sections'
          : `Empty section${emptySections.length > 1 ? 's' : ''}: ${emptySections.map((s) => s.fieldLabel).join(', ')}`,
    },
    {
      ok: noOptions.length === 0,
      text:
        noOptions.length === 0
          ? 'Every choice field has options'
          : `Add options to: ${noOptions.map((c) => c.fieldLabel).join(', ')}`,
    },
  ]

  return (
    <aside aria-label="Form overview" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Form overview</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Sections" value={sections.length} />
        <Stat label="Fields" value={inputs.length} />
        <Stat label="Validation rules" value={rules} />
        <Stat label="Conditions" value={conditions.length} />
      </div>

      <h3 className="mt-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Before you publish</h3>
      <ul className="mt-2 space-y-2">
        {checks.map((check) => (
          <li key={check.text} className="flex items-start gap-2 text-sm text-slate-700">
            {check.ok ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
            )}
            {check.text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">Publishing runs the complete check and lists anything else.</p>

      <p className="mt-5 text-xs text-slate-500">Select a field on the canvas to edit it.</p>
    </aside>
  )
}
