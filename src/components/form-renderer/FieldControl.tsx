import type { ComponentType, Option } from '../../types/form'
import { ChoiceTile } from '../ui/ChoiceTile'
import { controlClass } from '../ui/control-class'
import { ListboxSelect } from '../ui/ListboxSelect'
import { MultiSelect } from '../ui/MultiSelect'

export interface FieldControlProps {
  type: ComponentType
  id: string
  /** string for text, number, date and single choice; string[] for CHECKBOX and MULTISELECT; boolean for TOGGLE */
  value: unknown
  onChange: (value: unknown) => void
  onBlur?: () => void
  options?: Option[]
  placeholder?: string | null
  decimalPlaces?: number
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  /** Radio buttons cannot be unselected by themselves; this adds a Clear link. */
  clearable?: boolean
}

const asString = (value: unknown): string => (typeof value === 'string' ? value : '')
const asStrings = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : [])

/** The input for one component type. Used for default values in the builder and for answers in the renderer. */
export function FieldControl({
  type,
  id,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder,
  decimalPlaces = 2,
  disabled,
  invalid,
  describedBy,
  clearable,
}: FieldControlProps) {
  const ariaProps = {
    'aria-invalid': invalid ? true : undefined,
    'aria-describedby': describedBy,
  }
  const className = controlClass(Boolean(invalid))

  // A group counts as "left" only when focus moves outside it, not on every arrow key between its options.
  const groupBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.()
  }

  switch (type) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
      return (
        <input
          id={id}
          type={type === 'EMAIL' ? 'email' : type === 'PHONE' ? 'tel' : 'text'}
          value={asString(value)}
          placeholder={placeholder ?? undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={className}
          {...ariaProps}
        />
      )

    case 'TEXTAREA':
      return (
        <textarea
          id={id}
          rows={3}
          value={asString(value)}
          placeholder={placeholder ?? undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={className}
          {...ariaProps}
        />
      )

    case 'NUMBER':
    case 'DECIMAL':
      return (
        <input
          id={id}
          type="number"
          inputMode={type === 'NUMBER' ? 'numeric' : 'decimal'}
          step={type === 'NUMBER' ? 1 : decimalPlaces === 0 ? 1 : 1 / 10 ** decimalPlaces}
          value={asString(value)}
          placeholder={placeholder ?? undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          // A number is typed, not nudged: the arrow keys and the mouse wheel must not change it.
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
          }}
          onWheel={(event) => event.currentTarget.blur()}
          onBlur={onBlur}
          className={className}
          {...ariaProps}
        />
      )

    case 'DATE':
    case 'DATETIME':
      return (
        <input
          id={id}
          type={type === 'DATE' ? 'date' : 'datetime-local'}
          value={asString(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`${className} enabled:cursor-pointer`}
          {...ariaProps}
        />
      )

    case 'DROPDOWN':
      return (
        <ListboxSelect
          id={id}
          value={asString(value)}
          options={options}
          placeholder={placeholder}
          clearLabel={placeholder || 'Select…'}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(next) => {
            onChange(next)
            // Choosing is leaving the field: show its message now, not when the focus happens to move.
            onBlur?.()
          }}
        />
      )

    case 'MULTISELECT':
      return (
        <MultiSelect
          id={id}
          options={options}
          value={asStrings(value)}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
        />
      )

    case 'RADIO':
      return (
        <div
          id={id}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          onBlur={groupBlur}
          {...ariaProps}
          className="space-y-1.5"
        >
          {options.length === 0 && <p className="text-sm text-slate-500">No options yet</p>}
          {options.map((option, index) => (
            <ChoiceTile
              key={`${option.value}-${index}`}
              kind="radio"
              name={id}
              label={option.label}
              checked={asString(value) === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
          ))}
          {clearable && asString(value) !== '' && !disabled && (
            <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-accent-700 hover:underline">
              Clear
            </button>
          )}
        </div>
      )

    case 'CHECKBOX': {
      const chosen = asStrings(value)
      return (
        <div id={id} role="group" aria-labelledby={`${id}-label`} onBlur={groupBlur} {...ariaProps} className="space-y-1.5">
          {options.length === 0 && <p className="text-sm text-slate-500">No options yet</p>}
          {options.map((option, index) => (
            <ChoiceTile
              key={`${option.value}-${index}`}
              kind="checkbox"
              label={option.label}
              checked={chosen.includes(option.value)}
              disabled={disabled}
              onChange={() =>
                onChange(chosen.includes(option.value) ? chosen.filter((v) => v !== option.value) : [...chosen, option.value])
              }
            />
          ))}
        </div>
      )
    }

    case 'TOGGLE': {
      const on = value === true
      return (
        <div className="flex items-center gap-3">
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(!on)}
            onBlur={onBlur}
            {...ariaProps}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-50 ${
              on ? 'bg-accent-600' : 'bg-slate-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${on ? 'translate-x-6.5' : 'translate-x-1'}`}
            />
          </button>
          <span aria-hidden="true" className="text-sm text-slate-600">
            {on ? 'On' : 'Off'}
          </span>
        </div>
      )
    }

    default:
      return null
  }
}
