import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { toFormCode } from '../../lib/format'
import { cloneForm, createForm, updateForm } from '../../services/form.service'
import type { Form } from '../../types/form'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Alert } from '../ui/StateViews'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  /** Present when editing; the code is then shown but locked. */
  form?: Form
  /** Present when cloning: a new form is made from this one's fields, rules and conditions. */
  cloneOf?: Form
}

export function FormDialog({ open, onClose, form, cloneOf }: FormDialogProps) {
  const title = cloneOf ? 'Clone form' : form ? 'Edit form details' : 'New form'
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <FormDialogBody form={form} cloneOf={cloneOf} onClose={onClose} />
    </Dialog>
  )
}

function FormDialogBody({ form, cloneOf, onClose }: { form?: Form; cloneOf?: Form; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const initialName = cloneOf ? `${cloneOf.name} (copy)` : (form?.name ?? '')
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState(cloneOf ? toFormCode(initialName) : (form?.code ?? ''))
  const [codeEdited, setCodeEdited] = useState(false)
  const [description, setDescription] = useState(form?.description ?? '')
  const [category, setCategory] = useState(form?.category ?? '')

  const mutation = useMutation({
    meta: { toast: cloneOf ? 'Form cloned' : form ? 'Details saved' : 'Form created' },
    mutationFn: () => {
      if (cloneOf) return cloneForm(cloneOf.id, { name, code })
      const details = { name, description: description || undefined, category: category || undefined }
      return form ? updateForm(form.id, details) : createForm({ ...details, code })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
      if (form) {
        queryClient.setQueryData(formKey(form.id), (old: unknown) =>
          old && typeof old === 'object' ? { ...old, ...saved } : old,
        )
        onClose()
      } else {
        onClose()
        navigate(`/admin/forms/${saved.id}`)
      }
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  const fieldErrors = fieldErrorsOf(mutation.error)
  // Anything the server rejected that no input on this dialog owns is shown at the top.
  const hasOwnerlessError = mutation.isError && Object.keys(fieldErrors).length === 0

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      {cloneOf && (
        <p className="text-sm leading-relaxed text-slate-600">
          A new draft is made from <strong>{cloneOf.name}</strong>: its description, category, fields, rules and
          conditions are copied. Versions, submissions and history are not.
        </p>
      )}
      {hasOwnerlessError && <Alert>{messageOf(mutation.error)}</Alert>}
      <Input
        label="Name"
        required
        value={name}
        maxLength={255}
        autoFocus
        onFocus={(event) => cloneOf && event.target.select()}
        onChange={(event) => {
          setName(event.target.value)
          if (!form && !codeEdited) setCode(toFormCode(event.target.value))
        }}
        error={fieldErrors.name}
      />
      <Input
        label="Code"
        required
        value={code}
        disabled={Boolean(form)}
        maxLength={50}
        onChange={(event) => {
          setCode(event.target.value)
          setCodeEdited(true)
        }}
        error={fieldErrors.code}
        help={
          form
            ? 'The code never changes.'
            : 'Used in the public link. 3 to 50 lowercase letters, digits and hyphens. It can never be changed.'
        }
      />
      {!cloneOf && (
        <>
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            error={fieldErrors.description}
          />
          <Input
            label="Category"
            value={category}
            maxLength={100}
            onChange={(event) => setCategory(event.target.value)}
            error={fieldErrors.category}
          />
        </>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {cloneOf ? 'Clone form' : form ? 'Save changes' : 'Create form'}
        </Button>
      </div>
    </form>
  )
}
