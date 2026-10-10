import type { Option } from '../../types/form'
import { Button } from '../ui/Button'
import { controlClass } from '../ui/control-class'

interface OptionsEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  function update(index: number, next: Option) {
    onChange(options.map((option, i) => (i === index ? next : option)))
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= options.length) return
    const next = [...options]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Options</p>
      {options.length === 0 && (
        <p className="mb-2 text-xs text-slate-500">No options yet. A choice field needs at least one to be published.</p>
      )}
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <input
              aria-label={`Option ${index + 1} label`}
              placeholder="Label"
              value={option.label}
              onChange={(event) => {
                const label = event.target.value
                // The value follows the label until it has been edited on its own.
                const followsLabel = option.value === '' || option.value === option.label
                update(index, { label, value: followsLabel ? label : option.value })
              }}
              className={`${controlClass(false)} min-w-0`}
            />
            <input
              aria-label={`Option ${index + 1} value`}
              placeholder="Value"
              value={option.value}
              onChange={(event) => update(index, { ...option, value: event.target.value })}
              className={`${controlClass(false)} min-w-0 font-mono text-xs`}
            />
            <button
              type="button"
              aria-label={`Move option ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move option ${index + 1} down`}
              disabled={index === options.length - 1}
              onClick={() => move(index, 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={`Remove option ${index + 1}`}
              onClick={() => onChange(options.filter((_, i) => i !== index))}
              className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-2" onClick={() => onChange([...options, { label: '', value: '' }])}>
        Add option
      </Button>
      <p className="mt-2 text-xs text-slate-500">
        Empty options and repeated values are accepted while drafting; publishing refuses them.
      </p>
    </div>
  )
}
