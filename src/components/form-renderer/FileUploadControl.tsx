import { FileText, Image, Loader2, RefreshCw, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { fieldErrorsOf, messageOf } from '../../api/client'
import {
  FORMAT_INFO,
  fileProblem,
  formatBytes,
  formatList,
  isUploadedFile,
} from '../../lib/file-formats'
import type { FileFormat } from '../../types/form'
import type { UploadedFile } from '../../types/submission'

interface FileUploadControlProps {
  /** Goes on the browse button so a failed check can move focus here. */
  id: string
  value: unknown
  allowedTypes: FileFormat[]
  maxSizeMb: number
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  /** Sends the file to the server (or pretends to, in the preview) and returns what the server stored. */
  onUpload?: (file: File) => Promise<UploadedFile>
  onChange: (value: UploadedFile | '') => void
  onBlur?: () => void
}

/** One file per field: a drop zone while empty, a file card once something is uploaded. */
export function FileUploadControl({
  id,
  value,
  allowedTypes,
  maxSizeMb,
  disabled,
  invalid,
  describedBy,
  onUpload,
  onChange,
  onBlur,
}: FileUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const file = isUploadedFile(value) ? value : null
  const locked = disabled || uploading !== null || !onUpload
  const accept = allowedTypes.flatMap((format) => FORMAT_INFO[format].extensions).join(',')

  async function handleFile(chosen: File | undefined) {
    if (!chosen || !onUpload) return
    const refused = fileProblem(chosen, allowedTypes, maxSizeMb)
    if (refused) {
      setProblem(refused)
      return
    }
    setProblem(null)
    setUploading(chosen.name)
    try {
      onChange(await onUpload(chosen))
    } catch (error) {
      // An earlier file stays in place when an upload is refused, so only the message changes.
      setProblem(Object.values(fieldErrorsOf(error))[0] ?? messageOf(error))
    } finally {
      setUploading(null)
      onBlur?.()
    }
  }

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0])
    // Choosing the same file again must still fire a change.
    event.target.value = ''
  }

  const message = problem && (
    <p role="alert" className="mt-1.5 text-xs text-red-600">
      {problem}
    </p>
  )

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      tabIndex={-1}
      aria-hidden="true"
      className="sr-only"
      disabled={locked}
      onChange={pick}
    />
  )

  if (file && uploading === null) {
    const Icon = file.contentType === 'application/pdf' ? FileText : Image
    return (
      <div>
        <div
          className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${invalid ? 'border-red-400' : 'border-slate-300'}`}
        >
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-700">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.sizeBytes)}</p>
          </div>
          <button
            id={id}
            type="button"
            disabled={locked}
            aria-label={`Replace ${file.name}`}
            aria-describedby={describedBy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Replace
          </button>
          <button
            type="button"
            disabled={locked}
            aria-label={`Remove ${file.name}`}
            onClick={() => {
              setProblem(null)
              onChange('')
            }}
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        {input}
        {message}
      </div>
    )
  }

  return (
    <div>
      <button
        id={id}
        type="button"
        disabled={locked}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={describedBy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          if (locked) return
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!locked) void handleFile(event.dataTransfer.files[0])
        }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
          dragging
            ? 'border-accent-500 bg-accent-50'
            : invalid || problem
              ? 'border-red-300 bg-red-50/40'
              : 'cursor-pointer border-slate-300 bg-white hover:border-accent-400 hover:bg-accent-50/50'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 aria-hidden="true" className="size-7 animate-spin text-accent-600" />
            <span className="text-sm font-medium text-slate-800">Uploading {uploading}…</span>
          </>
        ) : (
          <>
            <UploadCloud aria-hidden="true" className="size-7 text-accent-600" />
            <span className="text-sm text-slate-700">
              <span className="font-medium text-accent-700">Choose a file</span> or drag it here
            </span>
            <span className="text-xs text-slate-500">
              {formatList(allowedTypes)} · up to {maxSizeMb} MB
            </span>
          </>
        )}
      </button>
      {input}
      {message}
    </div>
  )
}
