import { DragDropContext, Draggable, Droppable, type DraggableProvidedDragHandleProps, type DropResult } from '@hello-pangea/dnd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react'
import { messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { TYPE_ICONS } from '../../lib/component-icons'
import { TYPE_LABELS } from '../../lib/component-meta'
import { reorderComponents } from '../../services/component.service'
import type { ComponentType, FormComponent, FormDetail } from '../../types/form'
import { Badge } from '../ui/Badge'
import { Alert } from '../ui/StateViews'
import { AddFieldMenu } from './AddFieldMenu'

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
  /** Adds a field of a type, last inside the given section (null for the top level). Absent when read-only. */
  onAdd?: (type: ComponentType, parentSectionId: number | null) => void
  /** Sections that are folded shut. */
  collapsed: ReadonlySet<number>
  onToggleSection: (id: number) => void
  /** Asks to delete a component. Absent when read-only. */
  onDelete?: (component: FormComponent) => void
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
      <GripVertical aria-hidden="true" className="size-4" />
    </span>
  )
}

export function Canvas({
  formId,
  components,
  selectedId,
  onSelect,
  readOnly,
  errorCodes,
  logicCodes,
  onAdd,
  collapsed,
  onToggleSection,
  onDelete,
}: CanvasProps) {
  const queryClient = useQueryClient()

  const reorder = useMutation({
    meta: { toast: 'Order saved' },
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
                  const open = !collapsed.has(component.id)
                  const childFailed = isSection && component.children.some((child) => errorCodes?.has(child.fieldCode))
                  const TypeIcon = TYPE_ICONS[component.componentType]
                  return (
                    <div ref={drag.innerRef} {...drag.draggableProps} id={`canvas-item-${component.id}`} className="mb-2">
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
                        {isSection && (
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={`section-body-${component.id}`}
                            aria-label={`${open ? 'Collapse' : 'Expand'} ${component.fieldLabel}`}
                            onClick={() => onToggleSection(component.id)}
                            className={`grid w-8 shrink-0 place-items-center text-slate-500 transition-colors duration-150 hover:text-slate-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
                              readOnly ? 'rounded-l-lg' : ''
                            }`}
                          >
                            {open ? (
                              <ChevronDown aria-hidden="true" className="size-4" />
                            ) : (
                              <ChevronRight aria-hidden="true" className="size-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelect(component.id)}
                          aria-current={selected || undefined}
                          className={`flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pr-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 ${
                            readOnly && !isSection ? 'pl-4' : 'pl-1'
                          } rounded-lg`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <TypeIcon aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
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
                          </span>
                          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                            {(failed || (childFailed && !open)) && <Badge tone="amber">Needs fixing</Badge>}
                            {isSection && !open && (
                              <Badge>
                                {component.children.length} {component.children.length === 1 ? 'field' : 'fields'}
                              </Badge>
                            )}
                            {component.isRequired && <Badge tone="blue">Required</Badge>}
                            {component.isReadOnly && <Badge>Read-only</Badge>}
                            {component.isDisabled && <Badge>Disabled</Badge>}
                            {!component.isVisible && <Badge>Hidden</Badge>}
                            {logicCodes?.has(component.fieldCode) && <Badge tone="green">Logic</Badge>}
                            <Badge>{TYPE_LABELS[component.componentType]}</Badge>
                          </span>
                        </button>
                        {onDelete && (
                          <button
                            type="button"
                            aria-label={`Delete ${component.fieldLabel}`}
                            title="Delete"
                            onClick={() => onDelete(component)}
                            className="grid w-10 shrink-0 place-items-center rounded-r-lg text-slate-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>

                      {isSection && open && (
                        <div id={`section-body-${component.id}`} className="mt-2 ml-6 border-l-2 border-brand-100 pl-3">
                          {component.children.length === 0 && readOnly && (
                            <p className="mb-2 rounded-md border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500">
                              This section is empty.
                            </p>
                          )}
                          {renderList(`section-${component.id}`, component.children)}
                          {onAdd && (
                            <AddFieldMenu
                              allowSection={false}
                              heading={
                                component.children.length === 0
                                  ? 'This section is empty. Add its first field:'
                                  : 'Add to this section:'
                              }
                              onPick={(type) => onAdd(type, component.id)}
                            />
                          )}
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
