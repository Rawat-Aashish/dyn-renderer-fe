import { TriangleAlert } from 'lucide-react'
import { TYPE_LABELS } from '../../lib/component-meta'
import type { FormComponent } from '../../types/form'

interface PublishProblemsProps {
  problems: Record<string, string>
  components: FormComponent[]
  onSelect: (component: FormComponent) => void
  onDismiss: () => void
}

/** Everything publishing refused, at once; each field problem jumps to its component. */
export function PublishProblems({ problems, components, onSelect, onDismiss }: PublishProblemsProps) {
  const { form, ...fields } = problems
  const entries = Object.entries(fields)

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div>
            <h2 className="text-sm font-semibold text-red-800">The form cannot be published yet</h2>
            <p className="mt-0.5 text-sm text-red-700">Fix these, then publish again. Nothing was published.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-red-800">
        {form && (
          <li>
            <span className="font-medium">Form:</span> {form}
          </li>
        )}
        {entries.map(([code, message]) => {
          const component = components.find((candidate) => candidate.fieldCode === code)
          return (
            <li key={code}>
              {component ? (
                <button
                  type="button"
                  onClick={() => onSelect(component)}
                  className="font-medium text-red-900 underline underline-offset-2 hover:text-red-700"
                >
                  {component.fieldLabel}
                </button>
              ) : (
                <span className="font-medium">{code}</span>
              )}
              <span className="ml-1 font-mono text-xs text-red-700">
                {component ? `${code} · ${TYPE_LABELS[component.componentType]}` : ''}
              </span>
              <span className="block sm:inline sm:before:content-[':_']">{message}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
