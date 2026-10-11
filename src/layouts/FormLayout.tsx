import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Archive, Copy, Eye, FilePlus2, History, Inbox, Link2, Pencil, Rocket, ScrollText, SquarePen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
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

const TABS = [
  { to: '', label: 'Builder', icon: SquarePen, end: true },
  { to: 'versions', label: 'Versions', icon: History, end: false },
  { to: 'submissions', label: 'Submissions', icon: Inbox, end: false },
  { to: 'audit', label: 'Audit log', icon: ScrollText, end: false },
]

const previewLinkClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Header and tabs shared by every screen under /admin/forms/:id. */
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

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/f/${form.code}`)
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
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/forms/${form.id}/preview`} className={previewLinkClass}>
              <Eye aria-hidden="true" className="size-3.5" />
              Preview
            </Link>
            {isLive && (
              <Button size="sm" variant="secondary" onClick={copyLink}>
                <Link2 aria-hidden="true" className="size-3.5" />
                Copy link
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setAction('clone')}>
              <Copy aria-hidden="true" className="size-3.5" />
              Clone
            </Button>
            {!locked && (
              <Button size="sm" variant="secondary" onClick={() => setAction('edit')}>
                <Pencil aria-hidden="true" className="size-3.5" />
                Edit details
              </Button>
            )}
            {!form.archived && !everPublished && (
              <Button size="sm" variant="secondary" onClick={() => setAction('delete')}>
                <Trash2 aria-hidden="true" className="size-3.5" />
                Delete
              </Button>
            )}
            {!form.archived && everPublished && (
              <Button size="sm" variant="secondary" onClick={() => setAction('archive')}>
                <Archive aria-hidden="true" className="size-3.5" />
                Archive
              </Button>
            )}
            {!form.archived && form.status === 'DRAFT' && (
              <Button size="sm" onClick={() => setPublishing(true)}>
                <Rocket aria-hidden="true" className="size-3.5" />
                Publish
              </Button>
            )}
            {!form.archived && form.status === 'PUBLISHED' && (
              <Button size="sm" onClick={() => setAction('newVersion')}>
                <FilePlus2 aria-hidden="true" className="size-3.5" />
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

        <nav aria-label="Form sections" className="flex gap-1 border-t border-slate-200 px-3">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <tab.icon aria-hidden="true" className="size-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <Outlet />
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
