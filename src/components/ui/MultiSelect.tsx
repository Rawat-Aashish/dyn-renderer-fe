import { useEffect, useRef, useState } from 'react'
import type { Option } from '../../types/form'
import { controlClass } from './control-class'

interface MultiSelectProps {
  id: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  onBlur?: () => void
  placeholder?: string | null
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

/** A dropdown of checkboxes with the chosen values shown as chips; the native multi-select is poor to use. */
export function MultiSelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  invalid,
  describedBy,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onBlur])

  const selected = options.filter((option) => value.includes(option.value))

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  return (
    <div ref={root} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        className={`${controlClass(Boolean(invalid))} flex min-h-[2.375rem] items-center justify-between gap-2 text-left`}
      >
        <span className="flex flex-wrap gap-1">
          {selected.length > 0 ? (
            selected.map((option) => (
              <span key={option.value} className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {option.label}
              </span>
            ))
          ) : (
            <span className="text-slate-400">{placeholder || 'Select…'}</span>
          )}
        </span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-4 shrink-0 text-slate-500">
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-md">
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-slate-500">No options yet</p>
          ) : (
            options.map((option, index) => (
              <label
                key={`${option.value}-${index}`}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-800 hover:bg-brand-50"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className="size-4 rounded border-slate-300 accent-brand-600"
                />
                {option.label}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}
