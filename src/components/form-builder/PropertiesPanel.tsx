import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { formKey } from '../../hooks/useFormDetail'
import { TYPE_LABELS } from '../../lib/component-meta'
import { deleteComponent } from '../../services/component.service'
import { useBuilderStore } from '../../stores/builder.store'
import type { Condition, FormComponent } from '../../types/form'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
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
  const queryClient = useQueryClient()
  const select = useBuilderStore((state) => state.select)
  const [tab, setTab] = useState<Tab>('settings')
  const [deleting, setDeleting] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (!savedFlash) return
    const timer = setTimeout(() => setSavedFlash(false), 2000)
    return () => clearTimeout(timer)
  }, [savedFlash])

  const remove = useMutation({
    mutationFn: () => deleteComponent(formId, component.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: formKey(formId) })
      select(null)
    },
  })

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
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <Badge tone="blue">{TYPE_LABELS[component.componentType]}</Badge>
          <h2 className="mt-1.5 truncate text-base font-semibold text-slate-900">{component.fieldLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          {savedFlash && (
            <span role="status" className="text-xs font-medium text-emerald-700">
              Saved
            </span>
          )}
          {!readOnly && (
            <Button variant="secondary" onClick={() => setDeleting(true)}>
              Delete
            </Button>
          )}
        </div>
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
            onSaved={() => setSavedFlash(true)}
          />
        </div>
        <div role="tabpanel" id="tabpanel-validation" aria-labelledby="tab-validation" hidden={tab !== 'validation'}>
          <ValidationTab formId={formId} component={component} readOnly={readOnly} />
        </div>
        <div role="tabpanel" id="tabpanel-logic" aria-labelledby="tab-logic" hidden={tab !== 'logic'}>
          <LogicTab formId={formId} component={component} components={components} conditions={conditions} readOnly={readOnly} />
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        title="Delete this field?"
        confirmLabel="Delete field"
        danger
        onConfirm={() => remove.mutateAsync()}
        onClose={() => setDeleting(false)}
      >
        <p>
          <strong>{component.fieldLabel}</strong> and its validation rules will be removed from this draft.
        </p>
      </ConfirmDialog>
    </aside>
  )
}
