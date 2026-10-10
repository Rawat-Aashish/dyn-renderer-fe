import { Link, Outlet } from 'react-router-dom'
import { ReLoginDialog } from '../components/auth/ReLoginDialog'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/auth.store'

export function AdminLayout() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/admin/forms" className="text-sm font-semibold tracking-tight">
            Form Builder
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {[session?.firstName, session?.lastName].filter(Boolean).join(' ')}
            </span>
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
      <ReLoginDialog />
    </div>
  )
}
