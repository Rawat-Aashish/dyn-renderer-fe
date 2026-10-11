import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { toFormCode } from '../../lib/format'
import { createForm, updateForm } from '../../services/form.service'
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
}

export function FormDialog({ open, onClose, form }: FormDialogProps) {
  return (
    <Dialog open={open} title={form ? 'Edit form details' : 'New form'} onClose={onClose}>
      <FormDialogBody form={form} onClose={onClose} />
    </Dialog>
  )
}

function FormDialogBody({ form, onClose }: { form?: Form; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState(form?.name ?? '')
  const [code, setCode] = useState(form?.code ?? '')
  const [codeEdited, setCodeEdited] = useState(false)
  const [description, setDescription] = useState(form?.description ?? '')
  const [category, setCategory] = useState(form?.category ?? '')

  const mutation = useMutation({
    meta: { toast: form ? 'Details saved' : 'Form created' },
    mutationFn: () => {
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
      {hasOwnerlessError && <Alert>{messageOf(mutation.error)}</Alert>}
      <Input
        label="Name"
        required
        value={name}
        maxLength={255}
        autoFocus
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
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {form ? 'Save changes' : 'Create form'}
        </Button>
      </div>
    </form>
  )
}
