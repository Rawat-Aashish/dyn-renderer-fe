import { Link, Outlet } from 'react-router-dom'
import { ReLoginDialog } from '../components/auth/ReLoginDialog'
import { Logo } from '../components/ui/Logo'
import { useAuthStore } from '../stores/auth.store'

export function AdminLayout() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const name = [session?.firstName, session?.lastName].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-brand-50 text-slate-900">
      <header className="bg-brand-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/admin/forms" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {name.split(' ').map((part) => part[0]).join('')}
            </span>
            <span className="text-sm text-brand-100">{name}</span>
            <button
              type="button"
              onClick={signOut}
              className="ml-2 rounded-md border border-white/25 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
      <ReLoginDialog />
    </div>
  )
}
