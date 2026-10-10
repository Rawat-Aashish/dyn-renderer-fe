import type { ReactNode } from 'react'
import { Button } from './Button'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-slate-600">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent motion-reduce:animate-none"
      />
      {label}…
    </div>
  )
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6">
          <path d="M5 3h7l4 4v10H5zM12 3v4h4M8 11h5M8 14h5" />
        </svg>
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-slate-900">Could not load this</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' | 'success' }) {
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-brand-200 bg-brand-50 text-brand-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
