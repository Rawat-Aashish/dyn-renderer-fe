import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import type { Option } from '../../types/form'
import { controlClass } from './control-class'

interface ListboxSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  /** Shown while nothing is chosen. */
  placeholder?: string | null
  /** When set, an entry with this label and the empty value tops the list: the way to clear the choice. */
  clearLabel?: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

/** A single-choice dropdown with a styled list that opens above the page instead of being clipped by it. */
export function ListboxSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  clearLabel,
  disabled,
  invalid,
  describedBy,
}: ListboxSelectProps) {
  const selected = options.find((option) => option.value === value)
  const emptyLabel = placeholder || clearLabel || 'Select…'

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
        className={`${controlClass(Boolean(invalid))} flex cursor-pointer items-center justify-between gap-2 text-left data-open:border-accent-500 data-open:ring-2 data-open:ring-accent-100 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : emptyLabel}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-slate-500 transition-transform duration-150 group-data-open:rotate-180" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="z-50 max-h-64 w-(--button-width) overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg [--anchor-gap:6px] focus:outline-none"
      >
        {clearLabel !== undefined && (
          <ListboxOption
            value=""
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-500 data-focus:bg-accent-50"
          >
            {clearLabel}
          </ListboxOption>
        )}
        {options.map((option, index) => (
          <ListboxOption
            key={`${option.value}-${index}`}
            value={option.value}
            className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 data-focus:bg-accent-50 data-selected:bg-accent-100/60 data-selected:font-medium data-selected:text-accent-800"
          >
            <span className="truncate">{option.label}</span>
            <Check aria-hidden="true" className="invisible size-4 shrink-0 text-accent-600 group-data-selected:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
