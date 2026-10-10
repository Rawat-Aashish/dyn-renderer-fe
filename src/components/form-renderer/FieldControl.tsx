import type { ComponentType, Option } from '../../types/form'
import { controlClass } from '../ui/control-class'
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
          rows={4}
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
          className={className}
          {...ariaProps}
        />
      )

    case 'DROPDOWN':
      return (
        <select
          id={id}
          value={asString(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={className}
          {...ariaProps}
        >
          <option value="">{placeholder || 'Select…'}</option>
          {options.map((option, index) => (
            <option key={`${option.value}-${index}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
        <div id={id} role="radiogroup" aria-labelledby={`${id}-label`} {...ariaProps} className="space-y-2">
          {options.length === 0 && <p className="text-sm text-slate-500">No options yet</p>}
          {options.map((option, index) => (
            <label key={`${option.value}-${index}`} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name={id}
                checked={asString(value) === option.value}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
                className="size-4 border-slate-300 accent-brand-600"
              />
              {option.label}
            </label>
          ))}
          {clearable && asString(value) !== '' && !disabled && (
            <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-brand-700 hover:underline">
              Clear
            </button>
          )}
        </div>
      )

    case 'CHECKBOX':
      return (
        <div id={id} role="group" aria-labelledby={`${id}-label`} {...ariaProps} className="space-y-2">
          {options.length === 0 && <p className="text-sm text-slate-500">No options yet</p>}
          {options.map((option, index) => {
            const chosen = asStrings(value)
            return (
              <label key={`${option.value}-${index}`} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={chosen.includes(option.value)}
                  disabled={disabled}
                  onChange={() =>
                    onChange(chosen.includes(option.value) ? chosen.filter((v) => v !== option.value) : [...chosen, option.value])
                  }
                  onBlur={onBlur}
                  className="size-4 rounded border-slate-300 accent-brand-600"
                />
                {option.label}
              </label>
            )
          })}
        </div>
      )

    case 'TOGGLE': {
      const on = value === true
      return (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={on}
          disabled={disabled}
          onClick={() => onChange(!on)}
          onBlur={onBlur}
          {...ariaProps}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50 ${
            on ? 'bg-brand-600' : 'bg-slate-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${on ? 'translate-x-5.5' : 'translate-x-0.5'}`}
          />
        </button>
      )
    }

    default:
      return null
  }
}
