import { useState, type ReactNode } from 'react'
import { messageOf } from '../../api/client'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Alert } from './StateViews'

interface ConfirmDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  danger?: boolean
  /** The admin must type exactly this before the confirm button enables. */
  requireText?: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
  children: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  danger = false,
  requireText,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <ConfirmBody
        confirmLabel={confirmLabel}
        danger={danger}
        requireText={requireText}
        onConfirm={onConfirm}
        onClose={onClose}
      >
        {children}
      </ConfirmBody>
    </Dialog>
  )
}

// Separate component so the typed text and the error are fresh each time the dialog opens.
function ConfirmBody({
  confirmLabel,
  danger,
  requireText,
  onConfirm,
  onClose,
  children,
}: Omit<ConfirmDialogProps, 'open' | 'title'>) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 space-y-4">
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
      {requireText && (
        <Input
          label={`Type ${requireText} to confirm`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
        />
      )}
      {error && <Alert>{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          loading={busy}
          disabled={requireText !== undefined && typed !== requireText}
          onClick={confirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
