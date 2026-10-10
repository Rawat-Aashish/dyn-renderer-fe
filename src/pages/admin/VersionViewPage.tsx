import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError, messageOf } from '../../api/client'
import { BuilderScreen } from '../../components/form-builder/BuilderScreen'
import { Alert, ErrorState, Spinner } from '../../components/ui/StateViews'
import { getVersion } from '../../services/version.service'

const previewLinkClass = 'font-medium text-brand-700 hover:underline'

/** A frozen version shown in the builder with every control switched off. */
export function VersionViewPage() {
  const params = useParams()
  const formId = Number(params.id)
  const version = Number(params.version)
  const query = useQuery({
    queryKey: ['version', formId, version],
    queryFn: () => getVersion(formId, version),
    enabled: Number.isInteger(version),
  })

  if (!Number.isInteger(version) || (query.error instanceof ApiError && query.error.status === 404)) {
    return <ErrorState message="This version does not exist." />
  }
  if (query.isPending) return <Spinner label="Loading version" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />

  const detail = query.data
  if (!detail.configuration) {
    return (
      <Alert tone="info">
        Version {version} is still a draft, so it has no frozen snapshot yet.{' '}
        <Link to={`/admin/forms/${formId}`} className={previewLinkClass}>
          Open it in the builder
        </Link>
        .
      </Alert>
    )
  }

  const { configuration } = detail
  return (
    <BuilderScreen
      formId={formId}
      components={configuration.components}
      conditions={configuration.conditions}
      readOnly
      notice={
        <Alert tone="info">
          Version {version} ({detail.status === 'PUBLISHED' ? 'live' : 'superseded'}) is a frozen snapshot and cannot be
          changed.{' '}
          <Link to={`/admin/forms/${formId}/versions/${version}/preview`} className={previewLinkClass}>
            Preview it
          </Link>
          .
        </Alert>
      }
    />
  )
}
