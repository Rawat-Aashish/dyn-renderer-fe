import { useState, type FormEvent } from 'react'
import { ApiError, GENERIC_ERROR } from '../../api/client'
import { login } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const startSession = useAuthStore((state) => state.startSession)
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)
    try {
      startSession(await login(email, password))
    } catch (error) {
      if (error instanceof ApiError && error.errors) setFieldErrors(error.errors)
      else setFormError(error instanceof ApiError ? error.message : GENERIC_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // noValidate: the server's own messages are shown under each field instead of browser bubbles
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
