import { create } from 'zustand'

interface BuilderState {
  selectedId: number | null
  /** true while the Settings tab holds edits that have not been saved */
  settingsDirty: boolean
  /** What the last publish attempt refused, for one form: keyed by field code, "form" for the form as a whole */
  publishErrors: { formId: number; errors: Record<string, string> } | null
  /** Ids of the sections that are folded shut on the canvas */
  collapsed: number[]
  select: (id: number | null) => void
  setSettingsDirty: (dirty: boolean) => void
  setPublishErrors: (formId: number, errors: Record<string, string>) => void
  toggleSection: (id: number) => void
  /** Opens one section (no-op if it is open), e.g. because something inside it was selected. */
  expandSection: (id: number) => void
  setCollapsed: (ids: number[]) => void
  reset: () => void
}

export const useBuilderStore = create<BuilderState>()((set) => ({
  selectedId: null,
  settingsDirty: false,
  publishErrors: null,
  collapsed: [],
  select: (id) => set({ selectedId: id, settingsDirty: false }),
  setSettingsDirty: (dirty) => set({ settingsDirty: dirty }),
  setPublishErrors: (formId, errors) => set({ publishErrors: { formId, errors } }),
  toggleSection: (id) =>
    set((state) => ({
      collapsed: state.collapsed.includes(id) ? state.collapsed.filter((x) => x !== id) : [...state.collapsed, id],
    })),
  expandSection: (id) =>
    set((state) => (state.collapsed.includes(id) ? { collapsed: state.collapsed.filter((x) => x !== id) } : state)),
  setCollapsed: (ids) => set({ collapsed: ids }),
  // Publish problems are deliberately kept: they are set just before the builder mounts when a publish
  // from another tab is refused, and a mount-time cleanup must not wipe them.
  reset: () => set({ selectedId: null, settingsDirty: false, collapsed: [] }),
}))
