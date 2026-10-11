import {
  Eye,
  History,
  Inbox,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  SquarePen,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useMatch } from 'react-router-dom'
import { useFormDetail } from '../../hooks/useFormDetail'
import { useUiStore } from '../../stores/ui.store'

interface ItemProps {
  to: string
  label: string
  icon: LucideIcon
  collapsed: boolean
  end?: boolean
  nested?: boolean
}

function Item({ to, label, icon: Icon, collapsed, end, nested }: ItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
          collapsed ? 'justify-center px-0' : nested ? 'pr-3 pl-9' : 'px-3'
        } ${isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'}`
      }
    >
      <Icon aria-hidden="true" className="size-[1.125rem] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

/** The app's modules. Inside a form it also lists that form's own sections, which used to be the tab row. */
export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggle = useUiStore((state) => state.toggleSidebar)
  const match = useMatch({ path: '/admin/forms/:id', end: false })
  const formId = Number(match?.params.id)
  const form = useFormDetail(formId)
  const inForm = match !== null && Number.isInteger(formId)
  const base = `/admin/forms/${formId}`

  return (
    <aside
      aria-label="Main navigation"
      className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 motion-reduce:transition-none md:flex ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Item to="/admin/forms" end label="Forms" icon={LayoutList} collapsed={collapsed} />

        {inForm && (
          <div className="pt-2">
            {!collapsed && (
              <p className="truncate px-3 pb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {form.data?.name ?? 'This form'}
              </p>
            )}
            {collapsed && <div aria-hidden="true" className="mx-2 mb-2 border-t border-slate-200" />}
            <div className="space-y-1">
              <Item to={base} end label="Builder" icon={SquarePen} collapsed={collapsed} nested />
              <Item to={`${base}/preview`} label="Preview" icon={Eye} collapsed={collapsed} nested />
              <Item to={`${base}/versions`} label="Versions" icon={History} collapsed={collapsed} nested />
              <Item to={`${base}/submissions`} label="Submissions" icon={Inbox} collapsed={collapsed} nested />
              <Item to={`${base}/audit`} label="Audit log" icon={ScrollText} collapsed={collapsed} nested />
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="size-[1.125rem]" />
          ) : (
            <>
              <PanelLeftClose aria-hidden="true" className="size-[1.125rem]" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
