import { useMemo, useState } from 'react'
import { TYPE_LABELS } from '../../lib/component-meta'
import type { Condition, FormComponent } from '../../types/form'
import { Badge } from '../ui/Badge'
import { LogicTab } from './LogicTab'
import { SettingsForm } from './SettingsForm'
import { toDraft } from './settings-draft'
import { ValidationTab } from './ValidationTab'

interface PropertiesPanelProps {
  formId: number
  component: FormComponent
  /** The whole component tree, for choosing condition sources. */
  components: FormComponent[]
  sections: FormComponent[]
  conditions: Condition[]
  readOnly: boolean
}

type Tab = 'settings' | 'validation' | 'logic'

export function PropertiesPanel({ formId, component, components, sections, conditions, readOnly }: PropertiesPanelProps) {
  const [tab, setTab] = useState<Tab>('settings')

  // Rules, children and display order are edited elsewhere; they must not reset unsaved Settings edits.
  const settingsKey = useMemo(() => `${component.id}:${JSON.stringify(toDraft(component))}`, [component])

  const own = conditions.filter((condition) => condition.targetFieldCode === component.fieldCode)
  const controlled = {
    isVisible: own.some((c) => c.action === 'SHOW' || c.action === 'HIDE'),
    isDisabled: own.some((c) => c.action === 'ENABLE' || c.action === 'DISABLE'),
    isRequired: own.some((c) => c.action === 'MAKE_REQUIRED' || c.action === 'MAKE_OPTIONAL'),
  }
  const codeLocked = conditions.some(
    (condition) =>
      condition.targetFieldCode === component.fieldCode ||
      condition.rules.some((rule) => rule.sourceFieldCode === component.fieldCode),
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    {
      id: 'validation',
      label: component.validationRules.length > 0 ? `Validation (${component.validationRules.length})` : 'Validation',
    },
    { id: 'logic', label: own.length > 0 ? `Logic (${own.length})` : 'Logic' },
  ]

  return (
    <aside aria-label="Properties" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-0 p-4">
        <Badge tone="blue">{TYPE_LABELS[component.componentType]}</Badge>
        <h2 className="mt-1.5 truncate text-base font-semibold text-slate-900">{component.fieldLabel}</h2>
      </div>

      <div role="tablist" aria-label="Field properties" className="flex gap-1 border-y border-slate-200 px-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`tabpanel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              tab === item.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Kept mounted while hidden so unsaved Settings edits survive a look at another tab. */}
        <div role="tabpanel" id="tabpanel-settings" aria-labelledby="tab-settings" hidden={tab !== 'settings'}>
          <SettingsForm
            key={settingsKey}
            formId={formId}
            component={component}
            sections={sections}
            readOnly={readOnly}
            controlled={controlled}
            codeLocked={codeLocked}
          />
        </div>
        <div role="tabpanel" id="tabpanel-validation" aria-labelledby="tab-validation" hidden={tab !== 'validation'}>
          <ValidationTab formId={formId} component={component} readOnly={readOnly} />
        </div>
        <div role="tabpanel" id="tabpanel-logic" aria-labelledby="tab-logic" hidden={tab !== 'logic'}>
          <LogicTab formId={formId} component={component} components={components} conditions={conditions} readOnly={readOnly} />
        </div>
      </div>
    </aside>
  )
}
