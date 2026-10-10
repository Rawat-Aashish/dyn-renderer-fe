import { DragDropContext, Draggable, Droppable, type DraggableProvidedDragHandleProps, type DropResult } from '@hello-pangea/dnd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { TYPE_LABELS } from '../../lib/component-meta'
import { reorderComponents } from '../../services/component.service'
import type { FormComponent, FormDetail } from '../../types/form'
import { Badge } from '../ui/Badge'
import { Alert } from '../ui/StateViews'

interface CanvasProps {
  formId: number
  components: FormComponent[]
  selectedId: number | null
  onSelect: (id: number) => void
  readOnly: boolean
  /** Field codes that publishing refused; they get an error marker. */
  errorCodes?: ReadonlySet<string>
  /** Field codes that a condition controls; they get a Logic marker. */
  logicCodes?: ReadonlySet<string>
}

interface ReorderVars {
  parentId: number | null
  ids: number[]
}

function applyOrder(components: FormComponent[], parentId: number | null, ids: number[]): FormComponent[] {
  const sort = (list: FormComponent[]) =>
    ids.map((id) => list.find((component) => component.id === id)).filter((c): c is FormComponent => c !== undefined)
  if (parentId === null) return sort(components)
  return components.map((component) =>
    component.id === parentId ? { ...component, children: sort(component.children) } : component,
  )
}

function Grip(props: DraggableProvidedDragHandleProps | null) {
  return (
    <span
      {...props}
      className="flex shrink-0 cursor-grab items-center self-stretch rounded-l-lg px-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:cursor-grabbing"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
        <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
        <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
        <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
      </svg>
    </span>
  )
}

export function Canvas({ formId, components, selectedId, onSelect, readOnly, errorCodes, logicCodes }: CanvasProps) {
  const queryClient = useQueryClient()

  const reorder = useMutation({
    mutationFn: ({ parentId, ids }: ReorderVars) => reorderComponents(formId, parentId, ids),
    onMutate: async ({ parentId, ids }) => {
      await queryClient.cancelQueries({ queryKey: formKey(formId) })
      const previous = queryClient.getQueryData<FormDetail>(formKey(formId))
      queryClient.setQueryData<FormDetail>(formKey(formId), (old) =>
        old ? { ...old, components: applyOrder(old.components, parentId, ids) } : old,
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(formKey(formId), context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  })

  function handleDragEnd(result: DropResult) {
    const { source, destination, type } = result
    if (!destination || destination.index === source.index) return
    const parentId = type === 'root' ? null : Number(type.replace('section-', ''))
    const list = parentId === null ? components : (components.find((c) => c.id === parentId)?.children ?? [])
    const ids = list.map((component) => component.id)
    const [moved] = ids.splice(source.index, 1)
    ids.splice(destination.index, 0, moved)
    reorder.mutate({ parentId, ids })
  }

  function renderList(listId: string, items: FormComponent[]) {
    return (
      <Droppable droppableId={listId} type={listId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-brand-50/70' : ''}`}
          >
            {items.map((component, index) => (
              <Draggable key={component.id} draggableId={String(component.id)} index={index} isDragDisabled={readOnly}>
                {(drag, dragSnapshot) => {
                  const selected = component.id === selectedId
                  const failed = errorCodes?.has(component.fieldCode) ?? false
                  const isSection = component.componentType === 'SECTION'
                  return (
                    <div ref={drag.innerRef} {...drag.draggableProps} className="mb-2">
                      <div
                        className={`flex items-stretch rounded-lg border bg-white shadow-sm transition-shadow duration-150 ${
                          failed
                            ? 'border-red-400 ring-2 ring-red-100'
                            : selected
                              ? 'border-brand-500 ring-2 ring-brand-100'
                              : 'border-slate-200 hover:border-slate-300'
                        } ${dragSnapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        {!readOnly && Grip(drag.dragHandleProps)}
                        <button
                          type="button"
                          onClick={() => onSelect(component.id)}
                          aria-current={selected || undefined}
                          className={`flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pr-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
                            readOnly ? 'pl-4' : 'pl-1'
                          } rounded-lg`}
                        >
                          <span className="min-w-0">
                            <span
                              className={`block truncate text-sm text-slate-900 ${
                                component.componentType === 'HEADING' ? 'text-base font-semibold' : 'font-medium'
                              }`}
                            >
                              {component.fieldLabel}
                            </span>
                            <span className="block truncate font-mono text-xs text-slate-500">{component.fieldCode}</span>
                          </span>
                          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                            {failed && <Badge tone="amber">Needs fixing</Badge>}
                            {component.isRequired && <Badge tone="blue">Required</Badge>}
                            {component.isReadOnly && <Badge>Read-only</Badge>}
                            {component.isDisabled && <Badge>Disabled</Badge>}
                            {!component.isVisible && <Badge>Hidden</Badge>}
                            {logicCodes?.has(component.fieldCode) && <Badge tone="green">Logic</Badge>}
                            <Badge>{TYPE_LABELS[component.componentType]}</Badge>
                          </span>
                        </button>
                      </div>

                      {isSection && (
                        <div className="mt-2 ml-6 border-l-2 border-brand-100 pl-3">
                          {component.children.length === 0 && (
                            <p className="mb-2 rounded-md border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500">
                              This section is empty. Add a field, then choose this section in the field&apos;s settings.
                            </p>
                          )}
                          {renderList(`section-${component.id}`, component.children)}
                        </div>
                      )}
                    </div>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    )
  }

  return (
    <div>
      {reorder.isError && (
        <div className="mb-3">
          <Alert>The order could not be saved, so it was put back. {messageOf(reorder.error)}</Alert>
        </div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>{renderList('root', components)}</DragDropContext>
    </div>
  )
}
