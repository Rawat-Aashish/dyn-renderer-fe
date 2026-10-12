import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/StateViews'
import { useFormDetail } from '../../hooks/useFormDetail'
import { formatDateTime } from '../../lib/format'
import { listSubmissions } from '../../services/submission.service'

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <p className="text-sm text-slate-600">
      <span className="text-lg font-semibold text-slate-900">{value.toLocaleString()}</span> {label}
    </p>
  )
}

export function SubmissionsPage() {
  const formId = Number(useParams().id)
  const { data: form } = useFormDetail(formId)
  const [page, setPage] = useState(0)
  const [version, setVersion] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['submissions', formId, { page, version }],
    queryFn: () => listSubmissions(form!.code, { page, size: 20, version }),
    enabled: Boolean(form),
    placeholderData: keepPreviousData,
  })

  if (!form || query.isPending) return <Spinner label="Loading submissions" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />

  const data = query.data
  const hasRatings = (data.ratingCount ?? 0) > 0
  const versions = Array.from({ length: form.currentVersion }, (_, index) => index + 1).reverse()

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <div className="w-48">
            <Select
              label="Version"
              value={version === null ? '' : String(version)}
              onChange={(event) => {
                setVersion(event.target.value === '' ? null : Number(event.target.value))
                setPage(0)
              }}
            >
              <option value="">All versions</option>
              {versions.map((number) => (
                <option key={number} value={number}>
                  Version {number}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-4">
            {data.archived && <Badge tone="slate">Archived form</Badge>}
            <Figure value={data.startedCount} label="started" />
            <div aria-hidden="true" className="h-6 w-px bg-slate-200" />
            <Figure value={data.submittedCount} label="submitted" />
            {hasRatings && (
              <>
                <div aria-hidden="true" className="h-6 w-px bg-slate-200" />
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-semibold text-slate-900">{data.averageRating}</span>
                  average from {data.ratingCount} {data.ratingCount === 1 ? 'rating' : 'ratings'}
                </p>
              </>
            )}
          </div>
        </div>

        {data.items.length === 0 ? (
          <EmptyState
            title="No submissions"
            message={
              version === null
                ? 'Responses will appear here once someone submits the published form.'
                : `Nobody has submitted version ${version}.`
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Response</th>
                    <th scope="col" className="px-4 py-3">Version</th>
                    <th scope="col" className="px-4 py-3">Started</th>
                    <th scope="col" className="px-4 py-3">Submitted</th>
                    {hasRatings && <th scope="col" className="px-4 py-3">Rating</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((submission) => (
                    <tr key={submission.id} className="transition-colors duration-150 hover:bg-brand-50/60">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/forms/${formId}/submissions/${submission.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          #{submission.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">v{submission.version}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(submission.startedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(submission.submittedAt)}</td>
                      {hasRatings && (
                        <td className="px-4 py-3 text-slate-600">
                          {submission.rating != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                              {submission.rating}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not rated</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
