import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  help?: string | null
  required?: boolean
  children: ReactNode
}

/**
 * Label above, control, then the error (which replaces the help text while there is one).
 * The label has the id `${htmlFor}-label` so grouped controls can use aria-labelledby.
 */
export function Field({ label, htmlFor, error, help, required, children }: FieldProps) {
  return (
    <div>
      <label id={`${htmlFor}-label`} htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        help && <p className="mt-1.5 text-xs text-slate-500">{help}</p>
      )}
    </div>
  )
}
