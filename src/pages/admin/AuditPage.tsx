import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/StateViews'
import { formatDateTime } from '../../lib/format'
import { listAudit } from '../../services/submission.service'
import type { AuditAction } from '../../types/submission'

const PHRASES: Record<AuditAction, string> = {
  FORM_CREATED: 'Form created',
  FORM_CLONED: 'Form cloned',
  FORM_UPDATED: 'Details updated',
  VERSION_CREATED: 'New version created',
  VERSION_PUBLISHED: 'Version published',
  FORM_ARCHIVED: 'Form archived',
}

export function AuditPage() {
  const formId = Number(useParams().id)
  const [page, setPage] = useState(0)
  const query = useQuery({
    queryKey: ['audit', formId, page],
    queryFn: () => listAudit(formId, page, 20),
    placeholderData: keepPreviousData,
  })

  if (query.isPending) return <Spinner label="Loading audit log" />
  if (query.isError) return <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {query.data.items.length === 0 ? (
        <EmptyState title="Nothing recorded yet" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">What happened</th>
                  <th scope="col" className="px-4 py-3">Version</th>
                  <th scope="col" className="px-4 py-3">By</th>
                  <th scope="col" className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{PHRASES[entry.action] ?? entry.action}</td>
                    <td className="px-4 py-3 text-slate-600">v{entry.versionNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.userName}
                      <span className="block text-xs text-slate-500">{entry.userEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.createdAt)}</td>
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
        </>
      )}
    </div>
  )
}
