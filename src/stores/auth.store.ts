import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResult, Session } from '../types/auth'

interface AuthState {
  session: Session | null
  /** true while an admin call has answered 401 and the admin has not signed in again yet */
  reauthRequired: boolean
  startSession: (result: LoginResult) => void
  signOut: () => void
  /** Opens the re-login dialog; resolves once the admin has signed in again. */
  requireReauth: () => Promise<void>
}

let waitingForReauth: (() => void)[] = []

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      reauthRequired: false,

      startSession: (result) => {
        set({
          session: {
            token: result.token,
            expiresAt: Date.now() + result.expiresIn * 1000,
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
          },
          reauthRequired: false,
        })
        waitingForReauth.forEach((resolve) => resolve())
        waitingForReauth = []
      },

      signOut: () => {
        waitingForReauth = []
        set({ session: null, reauthRequired: false })
      },

      requireReauth: () =>
        new Promise<void>((resolve) => {
          waitingForReauth.push(resolve)
          set({ reauthRequired: true })
        }),
    }),
    {
      name: 'admin_session',
      partialize: (state) => ({ session: state.session }),
      // A session that expired while the browser was closed is dropped on load.
      merge: (persisted, current) => {
        const stored = (persisted as { session?: Session | null } | undefined)?.session
        return { ...current, session: stored && stored.expiresAt > Date.now() ? stored : null }
      },
    },
  ),
)
