import { ClipboardList } from 'lucide-react'

/** The app mark and name, for dark backgrounds. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-white">
      <span className="flex size-8 items-center justify-center rounded-md bg-brand-500">
        <ClipboardList aria-hidden="true" className="size-[1.125rem]" />
      </span>
      Form Builder
    </span>
  )
}
