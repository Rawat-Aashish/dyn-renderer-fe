import { LogOut } from 'lucide-react'
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
      <header className="sticky top-0 z-30 h-14 bg-brand-950">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link to="/admin/forms" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {name.split(' ').map((part) => part[0]).join('')}
            </span>
            <span className="hidden text-sm text-brand-100 sm:inline">{name}</span>
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-500/15 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              <LogOut aria-hidden="true" className="size-[1.125rem]" />
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
