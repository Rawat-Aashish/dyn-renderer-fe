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

function AnswerRow({ label, children }: { label: string; code: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">{label}</span>
        {/* <span className="block font-mono text-xs text-slate-500">{code}</span> */}
      </dt>
      <dd className="min-w-0 text-sm whitespace-pre-wrap text-slate-900">{children}</dd>
    </div>
  )
}

/**
 * Follow-up questions hang off their parent like a comment thread: a dashed line drops from the parent and each
 * follow-up branches off it with a short dashed elbow. The line of the last one stops at its elbow.
 */
function Thread({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="ml-7">
      {children.map((child, index) => (
        <div
          key={index}
          className="relative border-l-2 border-dashed border-slate-300 before:absolute before:top-[1.4rem] before:left-0 before:w-4 before:border-t-2 before:border-dashed before:border-slate-300 last:border-l-0 last:after:absolute last:after:top-0 last:after:left-0 last:after:h-[1.4rem] last:after:border-l-2 last:after:border-dashed last:after:border-slate-300"
        >
          {child}
        </div>
      ))}
    </div>
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
  const visibilityConditionOf = (code: string) =>
    configuration?.conditions.find(
      (condition) => condition.targetFieldCode === code && (condition.action === 'SHOW' || condition.action === 'HIDE'),
    )

  /** Lists the questions of one level (the form, or one section), grouping each follow-up under its parent. */
  function renderLevel(components: FormComponent[]): React.ReactNode[] {
    const level = new Set(components.map((component) => component.fieldCode))
    const followUps = new Map<string, FormComponent[]>()
    const roots: FormComponent[] = []
    for (const component of components) {
      const source = visibilityConditionOf(component.fieldCode)?.rules[0]?.sourceFieldCode
      const isFollowUp =
        component.componentType !== 'SECTION' && source !== undefined && source !== component.fieldCode && level.has(source)
      if (isFollowUp) followUps.set(source, [...(followUps.get(source) ?? []), component])
      else roots.push(component)
    }
    // A follow-up whose parent sits in another section stays where it is, as an ordinary row.
    return (roots.length > 0 ? roots : components).map((component) => renderQuestion(component, followUps))
  }

  function renderQuestion(component: FormComponent, followUps: Map<string, FormComponent[]>): React.ReactNode {
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
          <div className="divide-y divide-slate-100">{renderLevel(component.children)}</div>
        </div>
      )
    }

    const value = submission.data[component.fieldCode]
    const replies = (followUps.get(component.fieldCode) ?? [])
      .map((followUp) => renderQuestion(followUp, followUps))
      .filter((reply) => reply !== null)
    return (
      <div key={component.id}>
        <AnswerRow label={component.fieldLabel} code={component.fieldCode}>
          {isEmpty(value) ? <span className="text-slate-400">Not answered</span> : formatAnswer(component, value)}
        </AnswerRow>
        {replies.length > 0 && <Thread>{replies}</Thread>}
      </div>
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
        <dl className="divide-y divide-slate-100">{configuration ? renderLevel(configuration.components) : null}</dl>
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
