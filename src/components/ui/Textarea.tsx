import { useId, type TextareaHTMLAttributes } from 'react'
import { controlClass } from './control-class'
import { Field } from './Field'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  help?: string | null
}

export function Textarea({ label, error, help, id, className = '', required, ...rest }: TextareaProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Field label={label} htmlFor={inputId} error={error} help={help} required={required}>
      <textarea
        id={inputId}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${controlClass(Boolean(error))} ${className}`}
        {...rest}
      />
    </Field>
  )
}
