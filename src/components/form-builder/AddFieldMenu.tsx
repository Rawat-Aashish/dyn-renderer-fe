import { Plus } from 'lucide-react'
import { useState } from 'react'
import { TYPE_ICONS } from '../../lib/component-icons'
import { PALETTE_GROUPS, TYPE_LABELS } from '../../lib/component-meta'
import type { ComponentType } from '../../types/form'

const GROUP_LABELS: Record<string, string> = { Inputs: 'Input field', Choices: 'Choices', Layout: 'Layout' }

interface AddFieldMenuProps {
  onPick: (type: ComponentType) => void
  /** A section cannot sit inside another section, so menus inside a section leave it out. */
  allowSection: boolean
  heading: string
}

/**
 * Where a field is added from. It sits at the place the field will land: at the end of the form, or inside a
 * section, so there is no separate step of choosing the section afterwards.
 */
export function AddFieldMenu({ onPick, allowSection, heading }: AddFieldMenuProps) {
  const [open, setOpen] = useState<string | null>(null)
  const group = PALETTE_GROUPS.find((candidate) => candidate.title === open)
  const types = group?.types.filter((type) => allowSection || type !== 'SECTION') ?? []

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white/60 p-3">
      <p className="mb-2 text-xs font-medium text-slate-500">{heading}</p>
      <div className="flex flex-wrap gap-2">
        {PALETTE_GROUPS.map((item) => {
          const active = open === item.title
          return (
            <button
              key={item.title}
              type="button"
              aria-expanded={active}
              onClick={() => setOpen(active ? null : item.title)}
              className={`rounded-lg border-2 border-dashed px-3.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              <Plus aria-hidden="true" className="mr-1.5 inline size-4 align-text-bottom" />
              {GROUP_LABELS[item.title] ?? item.title}
            </button>
          )
        })}
      </div>

      {types.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-dashed border-slate-200 pt-3">
          {types.map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setOpen(null)
                onPick(type)
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <Icon aria-hidden="true" className="mr-1.5 inline size-4 align-text-bottom text-slate-400" />
              {TYPE_LABELS[type]}
            </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
