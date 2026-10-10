import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { messageOf } from '../../api/client'
import { FormDialog } from '../../components/forms/FormDialog'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { EmptyState, ErrorState, Spinner } from '../../components/ui/StateViews'
import { useDebounced } from '../../hooks/useDebounced'
import { formatDateTime } from '../../lib/format'
import { describeStatus } from '../../lib/form-status'
import { listForms } from '../../services/form.service'
import type { FormStatus } from '../../types/form'

const PAGE_SIZE = 20

export function FormListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FormStatus | ''>('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebounced(search, 300)

  const query = useQuery({
    queryKey: ['forms', { page, size: PAGE_SIZE, archived, status, search: debouncedSearch }],
    queryFn: () => listForms({ page, size: PAGE_SIZE, archived, status, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const filtered = Boolean(debouncedSearch || status)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forms</h1>
        <Button onClick={() => setCreating(true)}>New form</Button>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-72">
          <Input
            label="Search"
            type="search"
            placeholder="Name or code"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as FormStatus | '')
              setPage(0)
            }}
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </div>
        <div role="group" aria-label="Show" className="flex rounded-md border border-slate-300 bg-white p-0.5 shadow-sm">
          {[
            { value: false, label: 'Active' },
            { value: true, label: 'Archived' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={archived === option.value}
              onClick={() => {
                setArchived(option.value)
                setPage(0)
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                archived === option.value ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {query.isPending ? (
          <Spinner label="Loading forms" />
        ) : query.isError ? (
          <ErrorState message={messageOf(query.error)} onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title={filtered ? 'No forms match' : archived ? 'No archived forms' : 'No forms yet'}
            message={
              filtered
                ? 'Try a different search or status.'
                : archived
                  ? 'Forms you archive will appear here.'
                  : 'Create your first form to start building.'
            }
            action={!filtered && !archived && <Button onClick={() => setCreating(true)}>New form</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Code</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {query.data.items.map((form) => {
                    const info = describeStatus(form)
                    return (
                      <tr key={form.id} className="transition-colors duration-150 hover:bg-brand-50/60">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/forms/${form.id}`}
                            className="font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                          >
                            {form.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{form.code}</td>
                        <td className="px-4 py-3 text-slate-600">{form.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={info.tone}>{info.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(form.updatedAt)}</td>
                      </tr>
                    )
                  })}
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

      <FormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
