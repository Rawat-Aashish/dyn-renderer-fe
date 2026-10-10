import { PALETTE_GROUPS, TYPE_LABELS } from '../../lib/component-meta'
import type { ComponentType } from '../../types/form'

export function Palette({ onPick }: { onPick: (type: ComponentType) => void }) {
  return (
    <aside aria-label="Add a component" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Add a field</h2>
      <div className="mt-3 space-y-4">
        {PALETTE_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">{group.title}</h3>
            <ul className="space-y-1.5">
              {group.types.map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => onPick(type)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    {TYPE_LABELS[type]}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}
