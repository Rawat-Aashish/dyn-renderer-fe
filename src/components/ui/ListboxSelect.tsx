import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import type { Option } from '../../types/form'
import { controlClass } from './control-class'

interface ListboxSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string | null
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

/** A single-choice dropdown with a styled list. The empty entry at the top is how a choice is cleared. */
export function ListboxSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  invalid,
  describedBy,
}: ListboxSelectProps) {
  const selected = options.find((option) => option.value === value)
  const emptyLabel = placeholder || 'Select…'

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        id={id}
        aria-labelledby={`${id}-label ${id}`}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        // Headless UI submits the surrounding form on Enter here, like a native select would. In a stepped
        // form that would skip a step just for opening the list, so Enter opens it instead.
        onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.click()
          }
        }}
        className={`${controlClass(Boolean(invalid))} flex cursor-pointer items-center justify-between gap-2 text-left data-[open]:border-accent-500 data-[open]:ring-2 data-[open]:ring-accent-100 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : emptyLabel}</span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-4 shrink-0 text-slate-500">
          <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="z-50 max-h-64 w-(--button-width) overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg [--anchor-gap:6px] focus:outline-none"
      >
        <ListboxOption
          value=""
          className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-500 data-[focus]:bg-accent-50"
        >
          {emptyLabel}
        </ListboxOption>
        {options.map((option, index) => (
          <ListboxOption
            key={`${option.value}-${index}`}
            value={option.value}
            className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 data-[focus]:bg-accent-50 data-[selected]:font-medium data-[selected]:text-accent-800"
          >
            {option.label}
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="invisible size-3.5 shrink-0 text-accent-600 group-data-[selected]:visible"
            >
              <path d="M2.5 6.5l2.5 2.5 4.5-5" />
            </svg>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
