import { Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthStore } from '../stores/auth.store'

export function LoginPage() {
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/admin/forms'} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold tracking-tight text-gray-900">Sign in to Form Builder</h1>
        <LoginForm />
      </div>
    </div>
  )
}
