interface ChoiceTileProps {
  kind: 'checkbox' | 'radio'
  label: string
  checked: boolean
  disabled?: boolean
  name?: string
  onChange: () => void
  /** A plain row (no border or tint), for lists inside a dropdown panel. */
  plain?: boolean
}

/**
 * One option of a radio or checkbox group: a tile that tints when chosen, with a drawn box or dot.
 * The real input stays in the page (appearance-none), so it keeps keyboard, focus and form behaviour.
 */
export function ChoiceTile({ kind, label, checked, disabled, name, onChange, plain }: ChoiceTileProps) {
  const surface = plain
    ? 'rounded-md px-2 py-1.5 hover:bg-accent-50'
    : 'rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-accent-300 has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50'

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 text-sm text-slate-800 transition-colors duration-150 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-300 ${surface}`}
    >
      <span className="relative inline-grid size-5 shrink-0 place-items-center">
        <input
          type={kind}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className={`peer size-5 cursor-pointer appearance-none border-2 border-slate-300 bg-white outline-none transition-colors duration-150 checked:border-accent-600 disabled:cursor-not-allowed ${
            kind === 'checkbox' ? 'rounded-md checked:bg-accent-600' : 'rounded-full'
          }`}
        />
        {kind === 'checkbox' ? (
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
          >
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto size-2.5 scale-50 rounded-full bg-accent-600 opacity-0 transition duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          />
        )}
      </span>
      {label}
    </label>
  )
}
