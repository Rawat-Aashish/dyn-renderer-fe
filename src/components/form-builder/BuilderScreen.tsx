import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { findComponent, flattenComponents } from '../../lib/component-meta'
import { useBuilderStore } from '../../stores/builder.store'
import type { ComponentType, Condition, FormComponent } from '../../types/form'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/StateViews'
import { AddComponentDialog } from './AddComponentDialog'
import { Canvas } from './Canvas'
import { Palette } from './Palette'
import { PropertiesPanel } from './PropertiesPanel'
import { PublishProblems } from './PublishProblems'

interface BuilderScreenProps {
  formId: number
  components: FormComponent[]
  conditions: Condition[]
  readOnly: boolean
  /** Shown above the columns, normally the reason the form is read-only. */
  notice?: ReactNode
}

export function BuilderScreen({ formId, components, conditions, readOnly, notice }: BuilderScreenProps) {
  const selectedId = useBuilderStore((state) => state.selectedId)
  const dirty = useBuilderStore((state) => state.settingsDirty)
  const publishState = useBuilderStore((state) => state.publishErrors)
  const select = useBuilderStore((state) => state.select)
  const setPublishErrors = useBuilderStore((state) => state.setPublishErrors)
  const reset = useBuilderStore((state) => state.reset)
  const [adding, setAdding] = useState<ComponentType | null>(null)
  const [pending, setPending] = useState<(() => void) | null>(null)

  const publishErrors = useMemo(
    () => (publishState?.formId === formId ? publishState.errors : {}),
    [publishState, formId],
  )

  // Selection and unsaved-edit state belong to one form on one screen.
  useEffect(() => reset, [reset, formId])

  const flat = useMemo(() => flattenComponents(components), [components])
  const sections = useMemo(() => flat.filter((component) => component.componentType === 'SECTION'), [flat])
  const existingCodes = useMemo(() => new Set(flat.map((component) => component.fieldCode)), [flat])
  const logicCodes = useMemo(() => new Set(conditions.map((condition) => condition.targetFieldCode)), [conditions])
  const errorCodes = useMemo(
    () => new Set(Object.keys(publishErrors).filter((code) => code !== 'form')),
    [publishErrors],
  )
  const selected = findComponent(components, selectedId)

  // Unsaved Settings edits: ask before anything replaces them.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function guarded(action: () => void) {
    if (dirty) setPending(() => action)
    else action()
  }

  return (
    <div>
      {notice && <div className="mb-4">{notice}</div>}
      {Object.keys(publishErrors).length > 0 && (
        <div className="mb-4">
          <PublishProblems
            problems={publishErrors}
            components={flat}
            onSelect={(component) => guarded(() => select(component.id))}
            onDismiss={() => setPublishErrors(formId, {})}
          />
        </div>
      )}

      <div
        className={`grid items-start gap-4 ${
          readOnly ? 'lg:grid-cols-[minmax(0,1fr)_24rem]' : 'lg:grid-cols-[13rem_minmax(0,1fr)_24rem]'
        }`}
      >
        {!readOnly && <Palette onPick={(type) => guarded(() => setAdding(type))} />}

        <section aria-label="Form canvas" className="min-w-0">
          {components.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white">
              <EmptyState
                title={readOnly ? 'This form has no fields' : 'Start with a field'}
                message={readOnly ? undefined : 'Pick a field type from the list on the left to add it to the form.'}
              />
            </div>
          ) : (
            <Canvas
              formId={formId}
              components={components}
              selectedId={selectedId}
              onSelect={(id) => guarded(() => select(id))}
              readOnly={readOnly}
              errorCodes={errorCodes}
              logicCodes={logicCodes}
            />
          )}
        </section>

        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          {selected ? (
            <PropertiesPanel
              key={selected.id}
              formId={formId}
              component={selected}
              components={components}
              sections={sections}
              conditions={conditions}
              readOnly={readOnly}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Select a field on the canvas to see and edit its settings.
            </div>
          )}
        </div>
      </div>

      <AddComponentDialog
        formId={formId}
        type={adding}
        existingCodes={existingCodes}
        onClose={() => setAdding(null)}
        onAdded={(created) => select(created.id)}
      />

      <ConfirmDialog
        open={pending !== null}
        title="Discard unsaved changes?"
        confirmLabel="Discard changes"
        danger
        onConfirm={async () => {
          pending?.()
        }}
        onClose={() => setPending(null)}
      >
        <p>The settings you edited have not been saved. Continuing will throw them away.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        confirmLabel="Leave"
        danger
        onConfirm={async () => {
          blocker.proceed?.()
        }}
        onClose={() => blocker.reset?.()}
      >
        <p>The settings you edited have not been saved. Leaving this page will throw them away.</p>
      </ConfirmDialog>
    </div>
  )
}
