import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formKey } from '../../hooks/useFormDetail'
import { archiveForm, deleteForm } from '../../services/form.service'
import { createVersion } from '../../services/version.service'
import type { Form } from '../../types/form'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FormDialog } from './FormDialog'

export type FormAction = 'edit' | 'delete' | 'archive' | 'newVersion'

interface FormActionDialogsProps {
  form: Form
  /** Which dialog is open; null when none. */
  action: FormAction | null
  onClose: () => void
  /** Called after the form was deleted, e.g. to leave a screen that showed it. */
  onDeleted?: () => void
}

/** The edit / delete / archive / new-version dialogs, shared by the form screen and the forms list. */
export function FormActionDialogs({ form, action, onClose, onDeleted }: FormActionDialogsProps) {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: formKey(form.id) })
    await queryClient.invalidateQueries({ queryKey: ['versions', form.id] })
    await queryClient.invalidateQueries({ queryKey: ['version', form.id] })
    await queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const remove = useMutation({
    mutationFn: () => deleteForm(form.id),
    meta: { toast: 'Form deleted' },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: formKey(form.id) })
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
      onDeleted?.()
    },
  })
  const archive = useMutation({ mutationFn: () => archiveForm(form.id), meta: { toast: 'Form archived' }, onSuccess: refresh })
  const newVersion = useMutation({
    mutationFn: () => createVersion(form.id),
    meta: { toast: 'New version created' },
    onSuccess: refresh,
  })

  return (
    <>
      <FormDialog open={action === 'edit'} onClose={onClose} form={form} />

      <ConfirmDialog
        open={action === 'newVersion'}
        title="Create a new version?"
        confirmLabel="Create version"
        onConfirm={() => newVersion.mutateAsync()}
        onClose={onClose}
      >
        <p>
          A new draft is created from the current version so you can change it. Version {form.publishedVersion} stays
          live until you publish the draft, and a draft cannot be discarded once created.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'delete'}
        title="Delete this form?"
        confirmLabel="Delete form"
        danger
        onConfirm={() => remove.mutateAsync()}
        onClose={onClose}
      >
        <p>
          <strong>{form.name}</strong> and everything built in it will be removed permanently. This cannot be undone.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'archive'}
        title="Archive this form?"
        confirmLabel="Archive form"
        danger
        requireText={form.code}
        onConfirm={() => archive.mutateAsync()}
        onClose={onClose}
      >
        <p>
          <strong>{form.name}</strong> will stop being public and can no longer be changed. Its name and code stay taken,
          and archiving cannot be undone. Versions, submissions and the audit log stay readable.
        </p>
      </ConfirmDialog>
    </>
  )
}
