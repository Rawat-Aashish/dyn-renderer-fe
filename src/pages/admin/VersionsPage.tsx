import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { ErrorState, Spinner } from '../../components/ui/StateViews'
import { formatDateTime } from '../../lib/format'
import { listVersions } from '../../services/version.service'
import type { VersionStatus } from '../../types/form'

const TONES: Record<VersionStatus, BadgeTone> = { DRAFT: 'amber', PUBLISHED: 'green', SUPERSEDED: 'slate' }
const LABELS: Record<VersionStatus, string> = { DRAFT: 'Draft', PUBLISHED: 'Live', SUPERSEDED: 'Superseded' }
const linkClass = 'font-medium text-brand-700 hover:underline'

export function VersionsPage() {
  const formId = Number(useParams().id)
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['versions', formId, page],
    queryFn: () => listVersions(formId, page, 20),
    placeholderData: keepPreviousData,
  })

  if (query.isPending) return <Spinner label="Loading versions" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Version</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Published</th>
              <th scope="col" className="px-4 py-3">Created</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {query.data.items.map((version) => (
              <tr key={version.id}>
                <td className="px-4 py-3 font-medium text-slate-900">Version {version.versionNumber}</td>
                <td className="px-4 py-3">
                  <Badge tone={TONES[version.status]}>{LABELS[version.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(version.publishedAt)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(version.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {version.status === 'DRAFT' ? (
                    <Link to={`/admin/forms/${formId}`} className={linkClass}>
                      Open in builder
                    </Link>
                  ) : (
                    <span className="flex justify-end gap-4">
                      <Link to={`/admin/forms/${formId}/versions/${version.versionNumber}`} className={linkClass}>
                        View
                      </Link>
                      <Link to={`/admin/forms/${formId}/versions/${version.versionNumber}/preview`} className={linkClass}>
                        Preview
                      </Link>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={query.data.page}
        totalPages={query.data.totalPages}
        totalItems={query.data.totalItems}
        onChange={setPage}
      />
    </div>
  )
}
