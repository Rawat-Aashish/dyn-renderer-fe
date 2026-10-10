import { create } from 'zustand'

interface BuilderState {
  selectedId: number | null
  /** true while the Settings tab holds edits that have not been saved */
  settingsDirty: boolean
  /** What the last publish attempt refused, for one form: keyed by field code, "form" for the form as a whole */
  publishErrors: { formId: number; errors: Record<string, string> } | null
  select: (id: number | null) => void
  setSettingsDirty: (dirty: boolean) => void
  setPublishErrors: (formId: number, errors: Record<string, string>) => void
  reset: () => void
}

export const useBuilderStore = create<BuilderState>()((set) => ({
  selectedId: null,
  settingsDirty: false,
  publishErrors: null,
  select: (id) => set({ selectedId: id, settingsDirty: false }),
  setSettingsDirty: (dirty) => set({ settingsDirty: dirty }),
  setPublishErrors: (formId, errors) => set({ publishErrors: { formId, errors } }),
  // Publish problems are deliberately kept: they are set just before the builder mounts when a publish
  // from another tab is refused, and a mount-time cleanup must not wipe them.
  reset: () => set({ selectedId: null, settingsDirty: false }),
}))
