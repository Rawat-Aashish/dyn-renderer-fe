import { Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { Logo } from '../components/ui/Logo'
import { useAuthStore } from '../stores/auth.store'

const HIGHLIGHTS = [
  'Build forms from fields, sections and rules',
  'Publish a version and share it with one link',
  'Read every response, version by version',
]

export function LoginPage() {
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/admin/forms'} replace />
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex flex-col justify-between bg-brand-950 px-8 py-6 lg:px-14 lg:py-12">
        <Logo />
        <div className="hidden lg:block">
          <p className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-white">
            Forms that go from idea to live link in minutes.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-brand-100">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
                    <path d="m5 10 3.5 3.5L15 7" />
                  </svg>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <span className="hidden lg:block" />
      </div>

      <div className="flex items-start justify-center bg-brand-50 px-4 py-12 lg:items-center">
        <div className="w-full max-w-sm rounded-xl border border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-slate-600">Sign in to manage your forms.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
