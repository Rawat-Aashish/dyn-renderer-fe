import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { ApiError, messageOf } from '../api/client'
import { FormDialog } from '../components/forms/FormDialog'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Alert, ErrorState, Spinner } from '../components/ui/StateViews'
import { formKey, useFormDetail } from '../hooks/useFormDetail'
import { describeStatus, isLocked } from '../lib/form-status'
import { archiveForm, deleteForm } from '../services/form.service'
import { createVersion, publishVersion } from '../services/version.service'
import { useBuilderStore } from '../stores/builder.store'

const TABS = [
  { to: '', label: 'Builder', end: true },
  { to: 'versions', label: 'Versions', end: false },
  { to: 'submissions', label: 'Submissions', end: false },
  { to: 'audit', label: 'Audit log', end: false },
]

const previewLinkClass =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

/** Header and tabs shared by every screen under /admin/forms/:id. */
export function FormLayout() {
  const { id } = useParams()
  const formId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useFormDetail(formId)
  const setPublishErrors = useBuilderStore((state) => state.setPublishErrors)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [copied, setCopied] = useState(false)

  const refreshVersions = async () => {
    await queryClient.invalidateQueries({ queryKey: formKey(formId) })
    await queryClient.invalidateQueries({ queryKey: ['versions', formId] })
    await queryClient.invalidateQueries({ queryKey: ['version', formId] })
    await queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const remove = useMutation({
    mutationFn: () => deleteForm(formId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: formKey(formId) })
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
      navigate('/admin/forms')
    },
  })

  const archive = useMutation({
    mutationFn: () => archiveForm(formId),
    onSuccess: async (archived) => {
      queryClient.setQueryData(formKey(formId), (old: unknown) =>
        old && typeof old === 'object' ? { ...old, ...archived } : old,
      )
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
    },
  })

  const publish = useMutation({
    mutationFn: (version: number) => publishVersion(formId, version),
    onSuccess: refreshVersions,
  })

  const newVersion = useMutation({
    mutationFn: () => createVersion(formId),
    onSuccess: refreshVersions,
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

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        return
      }
      throw error
    }
  }

  return (
    <div>
      <Link to="/admin/forms" className="text-sm font-medium text-brand-700 hover:underline">
        ← All forms
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
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-brand-700 hover:underline"
                >
                  {publicLink}
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/admin/forms/${form.id}/preview`} className={previewLinkClass}>
              Preview
            </Link>
            {!locked && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit details
              </Button>
            )}
            {!form.archived && !everPublished && (
              <Button variant="secondary" onClick={() => setDeleting(true)}>
                Delete
              </Button>
            )}
            {!form.archived && everPublished && (
              <Button variant="secondary" onClick={() => setArchiving(true)}>
                Archive
              </Button>
            )}
            {!form.archived && form.status === 'DRAFT' && <Button onClick={() => setPublishing(true)}>Publish</Button>}
            {!form.archived && form.status === 'PUBLISHED' && (
              <Button onClick={() => setCreatingVersion(true)}>Create new version</Button>
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
                `-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>

      <FormDialog open={editing} onClose={() => setEditing(false)} form={form} />

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

      <ConfirmDialog
        open={creatingVersion}
        title="Create a new version?"
        confirmLabel="Create version"
        onConfirm={() => newVersion.mutateAsync()}
        onClose={() => setCreatingVersion(false)}
      >
        <p>
          A new draft is created from the current version so you can change it. Version {form.publishedVersion} stays
          live until you publish the draft, and a draft cannot be discarded once created.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting}
        title="Delete this form?"
        confirmLabel="Delete form"
        danger
        onConfirm={() => remove.mutateAsync()}
        onClose={() => setDeleting(false)}
      >
        <p>
          <strong>{form.name}</strong> and everything built in it will be removed permanently. This cannot be undone.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={archiving}
        title="Archive this form?"
        confirmLabel="Archive form"
        danger
        requireText={form.code}
        onConfirm={() => archive.mutateAsync()}
        onClose={() => setArchiving(false)}
      >
        <p>
          <strong>{form.name}</strong> will stop being public and can no longer be changed. Its name and code stay taken,
          and archiving cannot be undone. Versions, submissions and the audit log stay readable.
        </p>
      </ConfirmDialog>
    </div>
  )
}
