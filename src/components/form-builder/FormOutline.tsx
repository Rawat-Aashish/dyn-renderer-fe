import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { TYPE_ICONS } from '../../lib/component-icons'
import type { FormComponent } from '../../types/form'

interface FormOutlineProps {
  components: FormComponent[]
  selectedId: number | null
  onSelect: (id: number) => void
  onCollapseAll: () => void
  onExpandAll: () => void
  hasSections: boolean
}

/** A compact index of the whole form: click an entry to jump to it and select it. */
export function FormOutline({ components, selectedId, onSelect, onCollapseAll, onExpandAll, hasSections }: FormOutlineProps) {
  function item(component: FormComponent, nested: boolean) {
    const Icon = TYPE_ICONS[component.componentType]
    const selected = component.id === selectedId
    return (
      <li key={component.id}>
        <button
          type="button"
          onClick={() => onSelect(component.id)}
          aria-current={selected || undefined}
          className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand-600 ${
            nested ? 'pl-7' : 'pl-2'
          } ${
            selected
              ? 'bg-brand-50 font-medium text-brand-700'
              : component.componentType === 'SECTION'
                ? 'font-medium text-slate-800 hover:bg-white'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Icon aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{component.fieldLabel}</span>
        </button>
        {component.children.length > 0 && <ul>{component.children.map((child) => item(child, true))}</ul>}
      </li>
    )
  }

  return (
    <nav aria-label="Form outline" className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="mb-1 flex items-center justify-between px-2 pt-1">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Outline</h2>
        {hasSections && (
          <span className="flex">
            <button
              type="button"
              title="Collapse all sections"
              aria-label="Collapse all sections"
              onClick={onCollapseAll}
              className="grid size-6 place-items-center rounded text-slate-500 hover:bg-white hover:text-slate-900"
            >
              <ChevronsDownUp aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              title="Expand all sections"
              aria-label="Expand all sections"
              onClick={onExpandAll}
              className="grid size-6 place-items-center rounded text-slate-500 hover:bg-white hover:text-slate-900"
            >
              <ChevronsUpDown aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        )}
      </div>
      <ul className="max-h-[calc(100vh-11rem)] overflow-y-auto">{components.map((component) => item(component, false))}</ul>
    </nav>
  )
}
