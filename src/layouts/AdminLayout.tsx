import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { ReLoginDialog } from '../components/auth/ReLoginDialog'
import { Sidebar } from '../components/layout/Sidebar'
import { Logo } from '../components/ui/Logo'
import { useAuthStore } from '../stores/auth.store'

export function AdminLayout() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const name = [session?.firstName, session?.lastName].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-brand-50 text-slate-900">
      <header className="sticky top-0 z-30 h-14 bg-brand-950">
        <div className="flex h-full items-center justify-between px-5">
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
              className="ml-1 inline-flex items-center gap-2 rounded-md border border-white/25 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <ReLoginDialog />
    </div>
  )
}
