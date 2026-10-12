import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, GENERIC_ERROR } from '../../api/client'
import { FeedbackThanks, RatingPanel } from '../../components/form-renderer/RatingPanel'
import { SteppedForm } from '../../components/form-renderer/SteppedForm'
import { Button } from '../../components/ui/Button'
import { Alert, Spinner } from '../../components/ui/StateViews'
import { useAccentTheme } from '../../hooks/useAccentTheme'
import { useFormFiller } from '../../hooks/useFormFiller'
import { useStepFlow, type StepFlowState } from '../../hooks/useStepFlow'
import { initialAnswers, type Answers } from '../../lib/form-logic/answers.ts'
import { clearStored, patchStored, readStored, writeStored, type StoredSession } from '../../lib/public-session'
import { startSubmission, submitAnswers, submitRating, uploadFile } from '../../services/public.service'

/** A new token is requested only when this tab has nothing stored for the form. */
async function loadSession(code: string): Promise<StoredSession> {
  const stored = readStored(code)
  if (stored) return stored
  const started = await startSubmission(code)
  const session: StoredSession = {
    token: started.token,
    version: started.version,
    configuration: started.configuration,
    answers: initialAnswers(started.configuration),
    submitted: false,
  }
  writeStored(code, session)
  return session
}

/** The form sits at the top and scrolls; a message (thank you, not available, loading) is centred on the screen. */
function Page({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={`form-backdrop min-h-screen px-4 py-5 sm:py-8 ${centered ? 'grid place-items-center' : ''}`}>
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  )
}

function Notice({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <Page centered>
      <div role="alert" className="rounded-2xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 sm:p-10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Page>
  )
}

/** How long the thank-you is on its own before the rating question takes its place. */
const RATING_DELAY_MS = 2500
/** Matches the leave animation in index.css. */
const SWAP_MS = 350

type Stage = 'thanks' | 'rating' | 'feedback'

/**
 * Thank you, then (when the form takes ratings) the rating question in the same spot, then a thank-you for the
 * feedback. Each screen lifts away before the next rises in, so nothing is stacked on top of anything else.
 */
function ThankYou({ code, session }: { code: string; session: StoredSession }) {
  const asksForRating = session.configuration.ratingEnabled === true && session.ratingDone !== true
  const [stage, setStage] = useState<Stage>('thanks')
  const [next, setNext] = useState<Stage | null>(null)
  const [swapped, setSwapped] = useState(false)
  const [asked, setAsked] = useState(false)
  const [given, setGiven] = useState(0)

  useEffect(() => {
    if (!asksForRating || asked || stage !== 'thanks') return
    const timer = window.setTimeout(() => setNext('rating'), RATING_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [asksForRating, asked, stage])

  useEffect(() => {
    if (next === null) return
    const timer = window.setTimeout(() => {
      setStage(next)
      setSwapped(true)
      setNext(null)
    }, SWAP_MS)
    return () => window.clearTimeout(timer)
  }, [next])

  async function sendRating(rating: number) {
    try {
      await submitRating(code, session.token, rating)
    } catch (error) {
      // Already rated, no ratings taken, or the form closed: there is nothing left to ask, so say thanks.
      if (!(error instanceof ApiError) || ![404, 409, 410].includes(error.status)) throw error
    }
    patchStored(code, { ratingDone: true })
    setGiven(rating)
    setNext('feedback')
  }

  function skip() {
    patchStored(code, { ratingDone: true })
    setAsked(true)
    setNext('thanks')
  }

  const motion = next !== null ? 'leave-up' : swapped ? 'enter-up' : ''

  return (
    <Page centered>
      {stage === 'thanks' && (
        <div className={`rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200 sm:p-12 ${motion}`}>
          <svg viewBox="0 0 52 52" fill="none" aria-hidden="true" className="mx-auto size-24 text-accent-600">
            <circle className="success-circle" cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" />
            <path
              className="success-check"
              d="M14 27l8 8 16-16"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Thank you</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Your response to <span className="font-medium text-slate-900">{session.configuration.name}</span> has been
            recorded.
          </p>
        </div>
      )}
      {stage === 'rating' && <RatingPanel className={motion} onSubmit={sendRating} onSkip={skip} />}
      {stage === 'feedback' && <FeedbackThanks className={motion} rating={given} />}
    </Page>
  )
}

type Ending = 'lost' | 'closed' | null

interface BodyProps {
  code: string
  session: StoredSession
  onSubmitted: () => void
  onEnded: (ending: Exclude<Ending, null>) => void
}

function FormBody({ code, session, onSubmitted, onEnded }: BodyProps) {
  const { configuration } = session

  const persistAnswers = useCallback((answers: Answers) => patchStored(code, { answers }), [code])
  const persistStep = useCallback((state: StepFlowState) => patchStored(code, state), [code])

  const filler = useFormFiller(configuration, {
    initialAnswers: { ...initialAnswers(configuration), ...session.answers },
    onAnswersChange: persistAnswers,
  })
  const flow = useStepFlow(configuration, filler, {
    initial: { step: session.step, reached: session.reached },
    onChange: persistStep,
  })
  const [submitting, setSubmitting] = useState(false)
  const [general, setGeneral] = useState<string | null>(null)

  useEffect(() => {
    document.title = configuration.name
  }, [configuration.name])

  async function sendFile(fieldCode: string, file: File) {
    try {
      return await uploadFile(code, session.token, fieldCode, file)
    } catch (error) {
      // The same session ends as it does on submit; any other refusal is shown by the file field itself.
      if (error instanceof ApiError && error.status === 404) onEnded('lost')
      if (error instanceof ApiError && error.status === 410) {
        clearStored(code)
        onEnded('closed')
      }
      throw error
    }
  }

  async function handleSubmit() {
    const payload = flow.submit()
    if (!payload) return
    setSubmitting(true)
    setGeneral(null)
    try {
      await submitAnswers(code, session.token, payload)
      patchStored(code, { answers: filler.answers, submitted: true })
      onSubmitted()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setGeneral(GENERIC_ERROR)
      } else if (error.status === 400 && error.errors) {
        filler.applyServerErrors(error.errors)
        const shown = new Set(
          [...filler.states.entries()].filter(([, state]) => state.visible).map(([fieldCode]) => fieldCode),
        )
        const keys = Object.keys(error.errors)
        const firstShown = keys.find((key) => shown.has(key))
        if (firstShown) flow.reveal(firstShown)
        const unmatched = keys.filter((key) => !shown.has(key))
        if (unmatched.length > 0) setGeneral(unmatched.map((key) => error.errors![key]).join(' '))
      } else if (error.status === 409) {
        // The server already holds this submission, so the visitor is done.
        patchStored(code, { answers: filler.answers, submitted: true })
        onSubmitted()
      } else if (error.status === 404) {
        onEnded('lost')
      } else if (error.status === 410) {
        clearStored(code)
        onEnded('closed')
      } else {
        setGeneral(error.status === 400 ? error.message : GENERIC_ERROR)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page>
      <SteppedForm
        config={configuration}
        filler={filler}
        flow={flow}
        onSubmit={() => void handleSubmit()}
        submitting={submitting}
        notice={general ? <Alert>{general}</Alert> : undefined}
        uploadFile={sendFile}
      />
    </Page>
  )
}

export function PublicFormPage() {
  useAccentTheme('theme-sky')
  const { code = '' } = useParams()
  const queryClient = useQueryClient()
  const [submitted, setSubmitted] = useState(false)
  const [ending, setEnding] = useState<Ending>(null)

  const query = useQuery({
    queryKey: ['public-form', code],
    queryFn: () => loadSession(code),
    // Starting registers a visit on the server, so the result is kept and never re-requested on its own.
    staleTime: Infinity,
  })

  async function startAgain() {
    clearStored(code)
    setEnding(null)
    setSubmitted(false)
    queryClient.removeQueries({ queryKey: ['public-form', code] })
    await query.refetch()
  }

  if (ending === 'closed') {
    return <Notice title="No longer accepting responses" message="This form is no longer accepting responses." />
  }
  if (ending === 'lost') {
    return (
      <Notice
        title="This session has expired"
        message="Your session for this form could not be found."
        action={<Button onClick={startAgain}>Start again</Button>}
      />
    )
  }

  if (query.isPending) {
    return (
      <Page centered>
        <Spinner label="Loading form" />
      </Page>
    )
  }
  if (query.isError) {
    const error = query.error
    if (error instanceof ApiError && error.status === 404) {
      return <Notice title="Form not available" message="This form is not available." />
    }
    if (error instanceof ApiError && error.status === 410) {
      return <Notice title="No longer accepting responses" message="This form is no longer accepting responses." />
    }
    return (
      <Notice
        title="Could not load the form"
        message={GENERIC_ERROR}
        action={<Button onClick={() => query.refetch()}>Try again</Button>}
      />
    )
  }

  const session = query.data
  if (submitted || session.submitted) return <ThankYou code={code} session={session} />

  return (
    <FormBody
      key={session.token}
      code={code}
      session={session}
      onSubmitted={() => setSubmitted(true)}
      onEnded={setEnding}
    />
  )
}
