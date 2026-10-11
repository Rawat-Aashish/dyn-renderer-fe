import { Children, isValidElement, useId, type ChangeEvent, type ReactElement, type ReactNode, type SelectHTMLAttributes } from 'react'
import type { Option } from '../../types/form'
import { Field } from './Field'
import { ListboxSelect } from './ListboxSelect'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  error?: string
  help?: string | null
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((part) => (typeof part === 'string' || typeof part === 'number' ? String(part) : ''))
    .join('')

/**
 * Written like a native select (`<option>` children, `onChange` with `event.target.value`) so every existing
 * use keeps working, but drawn as the styled list instead of the browser's own popup.
 */
export function Select({ label, error, help, id, required, children, value, onChange, disabled }: SelectProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const options: Option[] = Children.toArray(children)
    .filter((child): child is ReactElement<{ value?: string | number; children?: ReactNode }> => isValidElement(child))
    .map((child) => ({
      value: String(child.props.value ?? textOf(child.props.children)),
      label: textOf(child.props.children),
    }))

  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <ListboxSelect
        id={inputId}
        value={value === undefined ? '' : String(value)}
        options={options}
        disabled={disabled}
        invalid={Boolean(error)}
        describedBy={error ? `${inputId}-error` : undefined}
        onChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
      />
    </Field>
  )
}
