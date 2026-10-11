import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ApiError, messageOf } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { ErrorState, Spinner } from '../../components/ui/StateViews'
import { isEmpty, walk } from '../../lib/form-logic/answers.ts'
import { evaluateStates } from '../../lib/form-logic/evaluate.ts'
import { formatDateTime } from '../../lib/format'
import { formatAnswer } from '../../lib/format-answer'
import { getSubmission } from '../../services/submission.service'
import { getVersion } from '../../services/version.service'
import type { Configuration, FormComponent } from '../../types/form'

// Static class names so Tailwind can see them: how far a follow-up question is set in from its parent.
const INDENT = ['', 'ml-6', 'ml-12', 'ml-16']

interface AnswerRowProps {
  label: string
  code: string
  children: React.ReactNode
  /** 0 for an ordinary question; 1 or more for a question that only appears because of an earlier answer. */
  depth?: number
  /** The question this one follows up on. */
  followUpOf?: string
}

function AnswerRow({ label, children, depth = 0, followUpOf }: AnswerRowProps) {
  const row = (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">{label}</span>
        {followUpOf && <span className="mt-0.5 block text-xs text-slate-500">Follow-up to “{followUpOf}”</span>}
        {/* <span className="block font-mono text-xs text-slate-500">{code}</span> */}
      </dt>
      <dd className="min-w-0 text-sm whitespace-pre-wrap text-slate-900">{children}</dd>
    </div>
  )
  if (depth === 0) return row
  return (
    <div className={`${INDENT[Math.min(depth, INDENT.length - 1)]} border-l-2 border-brand-300 bg-brand-50/50`}>{row}</div>
  )
}

export function SubmissionDetailPage() {
  const params = useParams()
  const formId = Number(params.id)
  const submissionId = Number(params.submissionId)

  const submissionQuery = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmission(submissionId),
    enabled: Number.isInteger(submissionId),
  })
  const version = submissionQuery.data?.version
  const configQuery = useQuery({
    queryKey: ['version', formId, version],
    queryFn: () => getVersion(formId, version!),
    enabled: version !== undefined,
  })

  const back = (
    <Link to={`/admin/forms/${formId}/submissions`} className="text-sm font-medium text-brand-700 hover:underline">
      ← All submissions
    </Link>
  )

  if (!Number.isInteger(submissionId) || (submissionQuery.error instanceof ApiError && submissionQuery.error.status === 404)) {
    return (
      <div>
        {back}
        <ErrorState message="This submission does not exist." />
      </div>
    )
  }
  if (submissionQuery.isPending || configQuery.isPending) return <Spinner label="Loading submission" />
  if (submissionQuery.isError) return <ErrorState message={messageOf(submissionQuery.error)} onRetry={() => submissionQuery.refetch()} />
  if (configQuery.isError) return <ErrorState message={messageOf(configQuery.error)} onRetry={() => configQuery.refetch()} />

  const submission = submissionQuery.data
  const configuration: Configuration | null = configQuery.data.configuration
  const nodes = configuration ? walk(configuration.components) : []
  const known = new Set(nodes.map((node) => node.component.fieldCode))
  const unknownKeys = Object.keys(submission.data).filter((key) => !known.has(key))

  // Which questions the visitor actually got: a follow-up whose condition was not met was never shown, so it is
  // not listed as "Not answered". The stored answers are the same shape the renderer's logic reads.
  const states = configuration ? evaluateStates(configuration, submission.data) : new Map()
  const byCode = new Map(nodes.map((node) => [node.component.fieldCode, node.component]))
  const visibilityConditionOf = (code: string) =>
    configuration?.conditions.find(
      (condition) => condition.targetFieldCode === code && (condition.action === 'SHOW' || condition.action === 'HIDE'),
    )
  const depthOf = (code: string, seen: string[] = []): number => {
    const condition = visibilityConditionOf(code)
    const source = condition?.rules[0]?.sourceFieldCode
    if (!source || seen.includes(code)) return 0
    return 1 + depthOf(source, [...seen, code])
  }

  function renderComponent(component: FormComponent) {
    if (component.componentType === 'HEADING') return null
    if (!states.get(component.fieldCode)?.visible) return null

    if (component.componentType === 'SECTION') {
      const shown = component.children.filter(
        (child) => child.componentType !== 'HEADING' && states.get(child.fieldCode)?.visible,
      )
      if (shown.length === 0) return null
      return (
        <div key={component.id}>
          <h3 className="bg-sky-200 px-5 py-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
            {component.fieldLabel}
          </h3>
          <div className="divide-y divide-slate-100">{component.children.map(renderComponent)}</div>
        </div>
      )
    }

    const value = submission.data[component.fieldCode]
    const depth = depthOf(component.fieldCode)
    const parentCode = visibilityConditionOf(component.fieldCode)?.rules[0]?.sourceFieldCode
    return (
      <AnswerRow
        key={component.id}
        label={component.fieldLabel}
        code={component.fieldCode}
        depth={depth}
        followUpOf={depth > 0 && parentCode ? byCode.get(parentCode)?.fieldLabel : undefined}
      >
        {isEmpty(value) ? <span className="text-slate-400">Not answered</span> : formatAnswer(component, value)}
      </AnswerRow>
    )
  }

  return (
    <div className="space-y-5">
      {back}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Response #{submission.id}</h2>
        <Badge tone="blue">Version {submission.version}</Badge>
        {submission.archived && <Badge tone="slate">Archived form</Badge>}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <dt className="text-xs font-medium text-slate-500">Started</dt>
          <dd className="mt-0.5 text-sm text-slate-900">{formatDateTime(submission.startedAt)}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <dt className="text-xs font-medium text-slate-500">Submitted</dt>
          <dd className="mt-0.5 text-sm text-slate-900">{formatDateTime(submission.submittedAt)}</dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-100">{configuration?.components.map(renderComponent)}</dl>
        {unknownKeys.length > 0 && (
          <div className="border-t border-slate-200">
            <h3 className="bg-slate-50 px-5 py-2 text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Other answers
            </h3>
            <dl className="divide-y divide-slate-100">
              {unknownKeys.map((key) => (
                <AnswerRow key={key} label={key} code={key}>
                  {typeof submission.data[key] === 'string' ? (submission.data[key] as string) : JSON.stringify(submission.data[key])}
                </AnswerRow>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
