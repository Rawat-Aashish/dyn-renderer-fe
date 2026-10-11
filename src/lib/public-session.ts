import type { Configuration } from '../types/form'
import type { Answers } from './form-logic/answers.ts'

/** What a visitor's tab remembers about one form, so a refresh neither loses answers nor starts again. */
export interface StoredSession {
  token: string
  version: number
  configuration: Configuration
  answers: Answers
  submitted: boolean
  /** Key of the step the visitor was on; absent in entries saved before steps existed. */
  step?: string
  /** Keys of the steps the visitor has reached. */
  reached?: string[]
}

const keyFor = (code: string) => `public_form:${code}`

export function readStored(code: string): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(keyFor(code))
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function writeStored(code: string, session: StoredSession): void {
  try {
    sessionStorage.setItem(keyFor(code), JSON.stringify(session))
  } catch {
    // Storage full or blocked: the form still works, it just cannot survive a refresh.
  }
}

/**
 * Merges changes into what is stored right now. Reading first means a write about the step cannot undo a
 * write about the answers (or the other way round), and an entry that was cleared is not brought back.
 */
export function patchStored(code: string, patch: Partial<StoredSession>): void {
  const current = readStored(code)
  if (current) writeStored(code, { ...current, ...patch })
}

export function clearStored(code: string): void {
  try {
    sessionStorage.removeItem(keyFor(code))
  } catch {
    // nothing stored, nothing to clear
  }
}
