import { FILE_FORMATS, type ComponentProperties, type FileFormat } from '../types/form'
import type { UploadedFile } from '../types/submission'

/** The formats the server accepts, with the extensions each one covers. The server also checks the content. */
export const FORMAT_INFO: Record<FileFormat, { label: string; extensions: string[] }> = {
  jpg: { label: 'JPG', extensions: ['.jpg', '.jpeg'] },
  png: { label: 'PNG', extensions: ['.png'] },
  webp: { label: 'WebP', extensions: ['.webp'] },
  pdf: { label: 'PDF', extensions: ['.pdf'] },
}

export const MAX_FILE_MB = 10

/** A field that names no formats accepts all of them, and one without a size limit takes the server's. */
export function allowedTypesOf(properties: ComponentProperties): FileFormat[] {
  const chosen = properties.allowedTypes ?? []
  return chosen.length > 0 ? FILE_FORMATS.filter((format) => chosen.includes(format)) : [...FILE_FORMATS]
}

export function maxSizeMbOf(properties: ComponentProperties): number {
  return properties.maxSizeMb ?? MAX_FILE_MB
}

export function isUploadedFile(value: unknown): value is UploadedFile {
  return typeof value === 'object' && value !== null && typeof (value as UploadedFile).fileId === 'number'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "PDF, PNG" for a list of formats. */
export function formatList(allowed: FileFormat[]): string {
  return allowed.map((format) => FORMAT_INFO[format].label).join(', ')
}

/** The same checks the server makes before it looks inside the file, with the server's own wording. */
export function fileProblem(file: File, allowed: FileFormat[], maxMb: number): string | null {
  if (file.size === 0) return 'Choose a file to upload'
  const name = file.name.toLowerCase()
  const known = allowed.some((format) => FORMAT_INFO[format].extensions.some((extension) => name.endsWith(extension)))
  if (!known) return `File type is not allowed. Allowed types: ${allowed.join(', ')}`
  if (file.size > maxMb * 1024 * 1024) return `File is too large. Maximum size is ${maxMb} MB`
  return null
}
