import { useId, type InputHTMLAttributes } from 'react'
import { controlClass } from './control-class'
import { Field } from './Field'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  help?: string | null
}

export function Input({ label, error, help, id, className = '', required, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${controlClass(Boolean(error))} ${className}`}
        {...rest}
      />
    </Field>
  )
}
