import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Option } from '../../types/form'
import { ChoiceTile } from './ChoiceTile'
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

/** Fires once when the popup goes from open to closed, which is when the field counts as "left". */
function CloseWatcher({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open) onClose?.()
    wasOpen.current = open
  }, [open, onClose])
  return null
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
  const selected = options.filter((option) => value.includes(option.value))

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  return (
    <Popover>
      {({ open }) => (
        <>
          <CloseWatcher open={open} onClose={onBlur} />
          <PopoverButton
            id={id}
            disabled={disabled}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedBy}
            className={`${controlClass(Boolean(invalid))} flex min-h-[2.375rem] cursor-pointer items-center justify-between gap-2 text-left data-[open]:border-accent-500 data-[open]:ring-2 data-[open]:ring-accent-100 disabled:cursor-not-allowed`}
          >
            <span className="flex flex-wrap gap-1.5">
              {selected.length > 0 ? (
                selected.map((option) => (
                  <span key={option.value} className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-800">
                    {option.label}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">{placeholder || 'Select…'}</span>
              )}
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
          </PopoverButton>
          {/* Anchored in a portal: it sits above the card and flips or shrinks near the screen edge instead of being clipped. */}
          <PopoverPanel
            anchor="bottom start"
            className="z-50 max-h-(--anchor-max-height) w-(--button-width) overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg [--anchor-gap:6px] focus:outline-none"
          >
            {options.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-slate-500">No options yet</p>
            ) : (
              options.map((option, index) => (
                <ChoiceTile
                  key={`${option.value}-${index}`}
                  kind="checkbox"
                  plain
                  label={option.label}
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
              ))
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
