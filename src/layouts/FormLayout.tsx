import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Archive, Eye, FilePlus2, Link2, Pencil, Rocket, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError, messageOf } from '../api/client'
import { FormActionDialogs, type FormAction } from '../components/forms/FormActionDialogs'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Alert, ErrorState, Spinner } from '../components/ui/StateViews'
import { formKey, useFormDetail } from '../hooks/useFormDetail'
import { describeStatus, isLocked } from '../lib/form-status'
import { publishVersion } from '../services/version.service'
import { useBuilderStore } from '../stores/builder.store'
import type { FormOutletContext } from './form-outlet'

const previewLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Header shared by every screen under /admin/forms/:id. The form's sections live in the sidebar. */
export function FormLayout() {
  const { id } = useParams()
  const formId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useFormDetail(formId)
  const setPublishErrors = useBuilderStore((state) => state.setPublishErrors)
  const [action, setAction] = useState<FormAction | null>(null)
  const [publishing, setPublishing] = useState(false)

  const publish = useMutation({
    mutationFn: (version: number) => publishVersion(formId, version),
    meta: { toast: 'Form published' },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: formKey(formId) })
      await queryClient.invalidateQueries({ queryKey: ['versions', formId] })
      await queryClient.invalidateQueries({ queryKey: ['version', formId] })
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
    },
  })

  if (!Number.isInteger(formId) || (query.error instanceof ApiError && query.error.status === 404)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <ErrorState message="This form does not exist." />
        <p className="pb-10 text-center">
          <Link to="/admin/forms" className="text-sm font-medium text-brand-700 hover:underline">
            Back to all forms
          </Link>
        </p>
      </div>
    )
  }
  if (query.isPending) return <Spinner label="Loading form" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />

  const form = query.data
  const info = describeStatus(form)
  const locked = isLocked(form)
  const everPublished = form.publishedVersion !== null
  const isLive = everPublished && !form.archived
  const publicLink = `${window.location.origin}/f/${form.code}`
  const outletContext: FormOutletContext = { requestPublish: () => setPublishing(true) }

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink)
    toast.success('Link copied')
  }

  async function confirmPublish() {
    try {
      await publish.mutateAsync(form.currentVersion)
      setPublishErrors(formId, {})
    } catch (error) {
      // Every problem comes back together; they are shown against the fields in the builder.
      if (error instanceof ApiError && error.status === 400 && error.errors) {
        setPublishErrors(formId, error.errors)
        navigate(`/admin/forms/${formId}`)
        toast.error('The form cannot be published yet. See the problems above the form.')
        return
      }
      throw error
    }
  }

  return (
    <div>
      <Link to="/admin/forms" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All forms
      </Link>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{form.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-slate-600">{form.code}</span>
              <Badge tone={info.tone}>{info.label}</Badge>
              {form.category && <Badge tone="blue">{form.category}</Badge>}
            </div>
            {isLive && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-600">Public link</span>
                <a href={publicLink} target="_blank" rel="noreferrer" className="font-mono text-xs text-brand-700 hover:underline">
                  {publicLink}
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Link2 aria-hidden="true" className="size-3.5" />
                  Copy link
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/forms/${form.id}/preview`} className={previewLinkClass}>
              <Eye aria-hidden="true" className="size-4" />
              Preview
            </Link>
            {!locked && (
              <Button variant="secondary" onClick={() => setAction('edit')}>
                <Pencil aria-hidden="true" className="size-4" />
                Edit details
              </Button>
            )}
            {!form.archived && !everPublished && (
              <Button variant="secondary" onClick={() => setAction('delete')}>
                <Trash2 aria-hidden="true" className="size-4" />
                Delete
              </Button>
            )}
            {!form.archived && everPublished && (
              <Button variant="secondary" onClick={() => setAction('archive')}>
                <Archive aria-hidden="true" className="size-4" />
                Archive
              </Button>
            )}
            {!form.archived && form.status === 'DRAFT' && (
              <Button onClick={() => setPublishing(true)}>
                <Rocket aria-hidden="true" className="size-4" />
                Publish
              </Button>
            )}
            {!form.archived && form.status === 'PUBLISHED' && (
              <Button onClick={() => setAction('newVersion')}>
                <FilePlus2 aria-hidden="true" className="size-4" />
                Create new version
              </Button>
            )}
          </div>
        </div>

        {form.archived && (
          <div className="px-5 pb-4">
            <Alert tone="info">This form is archived. It is no longer public and can no longer be changed.</Alert>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Outlet context={outletContext} />
      </div>

      <FormActionDialogs
        form={form}
        action={action}
        onClose={() => setAction(null)}
        onDeleted={() => navigate('/admin/forms')}
      />

      <ConfirmDialog
        open={publishing}
        title={`Publish version ${form.currentVersion}?`}
        confirmLabel="Publish"
        onConfirm={confirmPublish}
        onClose={() => setPublishing(false)}
      >
        <p>
          The form goes live at its public link and becomes locked. It cannot be changed again until you create a new
          version, and publishing cannot be undone.
        </p>
        {everPublished && (
          <p className="mt-2">
            Version {form.publishedVersion} stops being the live version and becomes superseded. People who already
            started it can still submit it.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
