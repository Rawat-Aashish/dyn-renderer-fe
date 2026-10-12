import { Star } from 'lucide-react'
import { useRef, useState } from 'react'
import { messageOf } from '../../api/client'
import { Button } from '../ui/Button'
import { Alert } from '../ui/StateViews'

const STEP = 0.5
const MAX = 5

interface Mood {
  label: string
  /** Mouth curve: negative frowns, positive smiles. */
  curve: number
  tint: string
}

function moodOf(value: number): Mood {
  if (value === 0) return { label: 'Tap a star to rate', curve: 0, tint: 'bg-slate-100 text-slate-500' }
  if (value <= 1) return { label: 'Terrible', curve: -13, tint: 'bg-rose-100 text-rose-600' }
  if (value <= 2) return { label: 'Not great', curve: -7, tint: 'bg-orange-100 text-orange-600' }
  if (value <= 3) return { label: 'It was okay', curve: 0, tint: 'bg-amber-100 text-amber-600' }
  if (value <= 4) return { label: 'Pretty good', curve: 8, tint: 'bg-lime-100 text-lime-700' }
  if (value <= 4.5) return { label: 'Great!', curve: 12, tint: 'bg-emerald-100 text-emerald-600' }
  return { label: 'Loved it!', curve: 15, tint: 'bg-emerald-100 text-emerald-600' }
}

/** A round face whose mouth and colour follow the rating, so the choice has a visible reaction. */
function Face({ mood, large = false }: { mood: Mood; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center rounded-full transition-colors duration-300 ${mood.tint} ${
        large ? 'size-24' : 'size-20'
      }`}
    >
      <svg viewBox="0 0 64 64" className={large ? 'size-16' : 'size-14'} fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="22" cy="26" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="42" cy="26" r="3.2" fill="currentColor" stroke="none" />
        <path d={`M20 42 Q32 ${42 + mood.curve} 44 42`} strokeWidth="3.5" />
      </svg>
    </span>
  )
}

function valueAt(clientX: number, element: HTMLElement): number {
  const { left, width } = element.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (clientX - left) / width))
  // Whichever half of a star the pointer is on decides x.5 or x.0, and 0.5 is the lowest rating.
  return Math.max(STEP, Math.ceil((ratio * MAX) / STEP) * STEP)
}

function Stars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Rating"
      aria-valuemin={STEP}
      aria-valuemax={MAX}
      aria-valuenow={value || undefined}
      aria-valuetext={value ? `${value} out of ${MAX}` : 'Not rated yet'}
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse' && ref.current) setHover(valueAt(event.clientX, ref.current))
      }}
      onPointerLeave={() => setHover(null)}
      onClick={(event) => ref.current && onChange(valueAt(event.clientX, ref.current))}
      onKeyDown={(event) => {
        // A key press is the latest word, even if the pointer is still resting on the stars.
        setHover(null)
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') onChange(Math.min(MAX, (value || 0) + STEP))
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') onChange(Math.max(STEP, (value || STEP) - STEP))
        else if (event.key === 'Home') onChange(STEP)
        else if (event.key === 'End') onChange(MAX)
        else return
        event.preventDefault()
      }}
      className="flex w-fit cursor-pointer touch-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600"
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, shown - index))
        return (
          <span key={index} className="relative block size-11">
            <Star aria-hidden="true" className="absolute inset-0.5 size-10 text-slate-300" />
            {fill >= 1 && <Star aria-hidden="true" className="absolute inset-0.5 size-10 fill-amber-400 text-amber-400" />}
            {fill === STEP && (
              <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                <Star aria-hidden="true" className="absolute inset-0.5 size-10 max-w-none fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

const card = 'rounded-2xl bg-white p-6 text-center shadow-lg ring-1 ring-slate-200 sm:p-10'

interface RatingPanelProps {
  /** Sends the rating. A rejection is shown here and the visitor may try again. */
  onSubmit: (rating: number) => Promise<void>
  onSkip: () => void
  /** Extra classes, used for the screen's enter and leave animations. */
  className?: string
}

/** The "how was it?" question. It takes the place of the thank-you message, in the same card. */
export function RatingPanel({ onSubmit, onSkip, className = '' }: RatingPanelProps) {
  const [rating, setRating] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mood = moodOf(rating)

  async function send() {
    setSending(true)
    setError(null)
    try {
      await onSubmit(rating)
    } catch (failure) {
      setError(messageOf(failure))
      setSending(false)
    }
  }

  return (
    <section aria-label="Rate this form" className={`${card} ${className}`}>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">How was your experience filling out this form?</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        We collect this to improve the experience for everyone.
      </p>

      <div className="mt-6 flex justify-center">
        <Face mood={mood} />
      </div>
      <p aria-live="polite" className="mt-3 h-5 text-sm font-medium text-slate-700">
        {mood.label}
        {rating > 0 && <span className="ml-1.5 text-slate-500">{rating} / {MAX}</span>}
      </p>

      <div className="mt-2 flex justify-center">
        <Stars value={rating} onChange={setRating} />
      </div>

      {error && (
        <div className="mt-4 text-left">
          <Alert>{error}</Alert>
        </div>
      )}

      <Button size="lg" className="mt-6 w-full" disabled={rating === 0} loading={sending} onClick={() => void send()}>
        Submit rating
      </Button>
      <button
        type="button"
        onClick={onSkip}
        disabled={sending}
        className="mt-3 rounded text-sm font-medium text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
      >
        Maybe later
      </button>
    </section>
  )
}

interface FeedbackThanksProps {
  rating: number
  /** Set in the admin preview, where nothing was sent. */
  simulated?: boolean
  className?: string
}

/** The last screen, shown once a rating has been sent. */
export function FeedbackThanks({ rating, simulated = false, className = '' }: FeedbackThanksProps) {
  return (
    <section role="status" className={`${card} sm:p-12 ${className}`}>
      <div className="flex justify-center">
        <Face mood={moodOf(rating)} large />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Thank you for your feedback</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        It means a lot to us. Every rating helps make this form better for the next person.
      </p>
      {simulated && <p className="mt-3 text-xs text-slate-500">Preview only. Nothing was sent.</p>}
    </section>
  )
}
