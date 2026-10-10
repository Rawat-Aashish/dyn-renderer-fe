import { keepPreviousData, useQuery } from '@tanstack/react-query'
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

function Count({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
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
  const versions = Array.from({ length: form.currentVersion }, (_, index) => index + 1).reverse()

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Count label="Started" value={data.startedCount} note="Everyone who opened the form, all versions" />
        <Count label="Submitted" value={data.submittedCount} note="Responses accepted, all versions" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
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
        {data.archived && <Badge tone="slate">Archived form</Badge>}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
