import { useId, type SelectHTMLAttributes } from 'react'
import { controlClass } from './control-class'
import { Field } from './Field'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  help?: string | null
}

export function Select({ label, error, help, id, className = '', required, children, ...rest }: SelectProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${controlClass(Boolean(error))} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </Field>
  )
}
