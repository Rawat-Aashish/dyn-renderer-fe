import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { formKey } from '../../hooks/useFormDetail'
import { findComponent, flattenComponents } from '../../lib/component-meta'
import { deleteComponent } from '../../services/component.service'
import { useBuilderStore } from '../../stores/builder.store'
import type { Condition, FormComponent } from '../../types/form'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { AddComponentDialog, type Adding } from './AddComponentDialog'
import { AddFieldMenu } from './AddFieldMenu'
import { Canvas } from './Canvas'
import { FormOutline } from './FormOutline'
import { FormOverview } from './FormOverview'
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
  const collapsedIds = useBuilderStore((state) => state.collapsed)
  const select = useBuilderStore((state) => state.select)
  const setPublishErrors = useBuilderStore((state) => state.setPublishErrors)
  const toggleSection = useBuilderStore((state) => state.toggleSection)
  const expandSection = useBuilderStore((state) => state.expandSection)
  const setCollapsed = useBuilderStore((state) => state.setCollapsed)
  const reset = useBuilderStore((state) => state.reset)
  const [adding, setAdding] = useState<Adding | null>(null)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const [deleting, setDeleting] = useState<FormComponent | null>(null)
  const queryClient = useQueryClient()

  const remove = useMutation({
    meta: { toast: 'Deleted' },
    mutationFn: (component: FormComponent) => deleteComponent(formId, component.id),
    onSuccess: async (_data, component) => {
      await queryClient.invalidateQueries({ queryKey: formKey(formId) })
      if (useBuilderStore.getState().selectedId === component.id) select(null)
    },
  })

  const publishErrors = useMemo(
    () => (publishState?.formId === formId ? publishState.errors : {}),
    [publishState, formId],
  )

  // Selection and unsaved-edit state belong to one form on one screen.
  useEffect(() => reset, [reset, formId])

  // A form opens with its sections folded, so a long form reads as a list of parts. Sections added afterwards
  // are not in this list and start open, ready to be filled.
  const [initiallyFolded] = useState(() =>
    components.filter((component) => component.componentType === 'SECTION').map((section) => section.id),
  )
  useEffect(() => setCollapsed(initiallyFolded), [initiallyFolded, setCollapsed])

  const flat = useMemo(() => flattenComponents(components), [components])
  const sections = useMemo(() => flat.filter((component) => component.componentType === 'SECTION'), [flat])
  const existingCodes = useMemo(() => new Set(flat.map((component) => component.fieldCode)), [flat])
  const logicCodes = useMemo(() => new Set(conditions.map((condition) => condition.targetFieldCode)), [conditions])
  const collapsed = useMemo(() => new Set(collapsedIds), [collapsedIds])
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

  /** Selects a component, opening the section it is in first so it is not hidden. */
  const goTo = useCallback(
    (id: number) => {
      const parent = flat.find((component) => component.id === id)?.parentSectionId
      if (parent) expandSection(parent)
      select(id)
      requestAnimationFrame(() =>
        document.getElementById(`canvas-item-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
      )
    },
    [flat, expandSection, select],
  )

  const showOutline = components.length > 0

  return (
    <div>
      {notice && <div className="mb-4">{notice}</div>}
      {Object.keys(publishErrors).length > 0 && (
        <div className="mb-4">
          <PublishProblems
            problems={publishErrors}
            components={flat}
            onSelect={(component) => guarded(() => goTo(component.id))}
            onDismiss={() => setPublishErrors(formId, {})}
          />
        </div>
      )}

      <div
        className={`grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] ${
          showOutline ? 'xl:grid-cols-[13rem_minmax(0,1fr)_22rem]' : ''
        }`}
      >
        {showOutline && (
          <div className="hidden xl:sticky xl:top-18 xl:block">
            <FormOutline
              components={components}
              selectedId={selectedId}
              onSelect={(id) => guarded(() => goTo(id))}
              hasSections={sections.length > 0}
              onCollapseAll={() => setCollapsed(sections.map((section) => section.id))}
              onExpandAll={() => setCollapsed([])}
            />
          </div>
        )}

        <section aria-label="Form canvas" className="min-w-0 space-y-3">
          {components.length === 0 && readOnly && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
              This form has no fields.
            </p>
          )}
          {components.length > 0 && (
            <Canvas
              formId={formId}
              components={components}
              selectedId={selectedId}
              onSelect={(id) => guarded(() => goTo(id))}
              readOnly={readOnly}
              errorCodes={errorCodes}
              logicCodes={logicCodes}
              collapsed={collapsed}
              onToggleSection={toggleSection}
              onDelete={readOnly ? undefined : (component) => guarded(() => setDeleting(component))}
              onAdd={
                readOnly
                  ? undefined
                  : (type, parentSectionId) =>
                      guarded(() =>
                        setAdding({ type, parent: sections.find((section) => section.id === parentSectionId) ?? null }),
                      )
              }
            />
          )}
          {!readOnly && (
            <AddFieldMenu
              allowSection
              heading={components.length === 0 ? 'Start building the form. Add your first field:' : 'Add to the form:'}
              onPick={(type) => guarded(() => setAdding({ type, parent: null }))}
            />
          )}
        </section>

        <div className="lg:sticky lg:top-18 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
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
            <FormOverview components={components} conditions={conditions} />
          )}
        </div>
      </div>

      <AddComponentDialog
        formId={formId}
        adding={adding}
        existingCodes={existingCodes}
        onClose={() => setAdding(null)}
        onAdded={(created) => goTo(created.id)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={deleting?.componentType === 'SECTION' ? 'Delete this section?' : 'Delete this field?'}
        confirmLabel={deleting?.componentType === 'SECTION' ? 'Delete section' : 'Delete field'}
        danger
        onConfirm={() => remove.mutateAsync(deleting!)}
        onClose={() => setDeleting(null)}
      >
        <p>
          <strong>{deleting?.fieldLabel}</strong>
          {deleting?.componentType === 'SECTION'
            ? ' will be removed from this draft. A section must be empty before it can be deleted.'
            : ' and its validation rules will be removed from this draft.'}
        </p>
      </ConfirmDialog>

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
