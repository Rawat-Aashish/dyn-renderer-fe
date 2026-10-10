import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { FormPreview } from '../../components/form-renderer/FormPreview'
import { Alert, ErrorState, Spinner } from '../../components/ui/StateViews'
import { getVersion } from '../../services/version.service'

/** Preview of one published version, from its frozen configuration. */
export function VersionPreviewPage() {
  const params = useParams()
  const formId = Number(params.id)
  const version = Number(params.version)
  const query = useQuery({
    queryKey: ['version', formId, version],
    queryFn: () => getVersion(formId, version),
    enabled: Number.isInteger(version),
  })

  if (query.isPending) return <Spinner label="Loading preview" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />
  if (!query.data.configuration) {
    return (
      <Alert tone="info">
        Version {version} is still a draft.{' '}
        <Link to={`/admin/forms/${formId}/preview`} className="font-medium text-brand-700 hover:underline">
          Preview the working copy instead
        </Link>
        .
      </Alert>
    )
  }

  return (
    <FormPreview
      config={query.data.configuration}
      backTo={`/admin/forms/${formId}/versions/${version}`}
      source={`published version ${version}`}
    />
  )
}
