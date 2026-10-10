import { useAuthStore } from '../../stores/auth.store'
import { Dialog } from '../ui/Dialog'
import { LoginForm } from './LoginForm'

/** Shown over the current admin screen when a call answers 401, so unsaved input stays in place. */
export function ReLoginDialog() {
  const reauthRequired = useAuthStore((state) => state.reauthRequired)
  const email = useAuthStore((state) => state.session?.email)

  return (
    <Dialog open={reauthRequired} title="Your session has expired">
      <p className="mt-1 mb-4 text-sm leading-relaxed text-gray-600">
        Sign in again to continue. Nothing on this page has been lost.
      </p>
      <LoginForm defaultEmail={email} />
    </Dialog>
  )
}
