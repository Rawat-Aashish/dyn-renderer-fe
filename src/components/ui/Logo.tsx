/** The app mark and name, for dark backgrounds. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-white">
      <span className="flex size-8 items-center justify-center rounded-md bg-brand-500">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="size-4.5">
          <path d="M4 5h12M4 10h12M4 15h7" />
        </svg>
      </span>
      Form Builder
    </span>
  )
}
