import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { toFieldCode } from '../../lib/format'
import { TYPE_LABELS } from '../../lib/component-meta'
import { addComponent } from '../../services/component.service'
import type { ComponentType, FormComponent } from '../../types/form'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Alert } from '../ui/StateViews'

export interface Adding {
  type: ComponentType
  /** The section it goes into, or null for the top level of the form. */
  parent: FormComponent | null
}

interface AddComponentDialogProps {
  formId: number
  /** What is being added; the dialog is open while this is set. */
  adding: Adding | null
  existingCodes: Set<string>
  onClose: () => void
  onAdded: (component: FormComponent) => void
}

export function AddComponentDialog({ formId, adding, existingCodes, onClose, onAdded }: AddComponentDialogProps) {
  const title = adding
    ? `Add ${TYPE_LABELS[adding.type].toLowerCase()}${adding.parent ? ` to ${adding.parent.fieldLabel}` : ''}`
    : ''
  return (
    <Dialog open={adding !== null} title={title} onClose={onClose}>
      {adding && (
        <AddBody formId={formId} adding={adding} existingCodes={existingCodes} onClose={onClose} onAdded={onAdded} />
      )}
    </Dialog>
  )
}

function uniqueCode(base: string, taken: Set<string>): string {
  if (!base || !taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

function AddBody({
  formId,
  adding,
  existingCodes,
  onClose,
  onAdded,
}: Omit<AddComponentDialogProps, 'adding'> & { adding: Adding }) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [codeEdited, setCodeEdited] = useState(false)

  const mutation = useMutation({
    meta: { toast: 'Field added' },
    mutationFn: () =>
      addComponent(formId, {
        fieldCode: code.trim(),
        fieldLabel: label,
        componentType: adding.type,
        parentSectionId: adding.parent?.id,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: formKey(formId) })
      onClose()
      onAdded(created)
    },
  })

  const errors = fieldErrorsOf(mutation.error)
  const hasFieldErrors = Object.keys(errors).length > 0

  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4">
      {mutation.isError && !hasFieldErrors && <Alert>{messageOf(mutation.error)}</Alert>}
      <Input
        label="Label"
        required
        autoFocus
        value={label}
        maxLength={255}
        onChange={(event) => {
          setLabel(event.target.value)
          if (!codeEdited) setCode(uniqueCode(toFieldCode(event.target.value), existingCodes))
        }}
        error={errors.fieldLabel}
      />
      <Input
        label="Field code"
        required
        value={code}
        maxLength={100}
        autoComplete="off"
        className="font-mono text-xs"
        onChange={(event) => {
          setCode(event.target.value)
          setCodeEdited(true)
        }}
        error={errors.fieldCode}
        help="Names this field in answers and conditions. It cannot be changed while a condition uses it."
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Add
        </Button>
      </div>
    </form>
  )
}
