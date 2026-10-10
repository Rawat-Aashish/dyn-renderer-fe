import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { FormPreview } from '../../components/form-renderer/FormPreview'
import { ErrorState, Spinner } from '../../components/ui/StateViews'
import { useFormDetail } from '../../hooks/useFormDetail'
import type { Configuration } from '../../types/form'

/** Preview of the working copy of a form. */
export function PreviewPage() {
  const formId = Number(useParams().id)
  const query = useFormDetail(formId)
  const form = query.data

  // The working copy has the same shape as a published configuration, so one renderer serves both.
  const config = useMemo<Configuration | null>(
    () =>
      form
        ? {
            name: form.name,
            code: form.code,
            description: form.description,
            category: form.category,
            version: form.currentVersion,
            components: form.components,
            conditions: form.conditions,
          }
        : null,
    [form],
  )

  if (query.isPending) return <Spinner label="Loading preview" />
  if (query.isError || !config) {
    return (
      <div>
        <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />
        <p className="text-center">
          <Link to="/admin/forms" className="text-sm font-medium text-brand-700 hover:underline">
            Back to all forms
          </Link>
        </p>
      </div>
    )
  }

  return (
    <FormPreview
      // A fresh preview each time the working copy changes, so stale answers never sit on a new structure.
      key={JSON.stringify([config.components, config.conditions])}
      config={config}
      backTo={`/admin/forms/${formId}`}
      source="working copy"
    />
  )
}
