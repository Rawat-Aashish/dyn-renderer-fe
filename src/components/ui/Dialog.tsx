import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  title: string
  /** Called on Escape. Leave out for a dialog that must be completed and cannot be dismissed. */
  onClose?: () => void
  children: ReactNode
}

// The native modal <dialog> provides the focus trap, Escape handling and backdrop.
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (!onClose) event.preventDefault()
      }}
      onClose={() => {
        if (onClose) onClose()
        // Browsers let a repeated Escape close the dialog even when cancel was prevented.
        else if (open) ref.current?.showModal()
      }}
      className="m-auto w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm backdrop:bg-gray-900/40"
    >
      {open && (
        <>
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-gray-900">
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  )
}
