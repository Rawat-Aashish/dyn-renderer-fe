import { isChoice, isLayout } from '../../lib/component-meta'
import type { ComponentRequest, ComponentType, FormComponent, Option } from '../../types/form'

/** What the Settings tab edits. Everything is held as simple strings, booleans and lists. */
export interface SettingsDraft {
  fieldCode: string
  fieldLabel: string
  placeholder: string
  helpText: string
  /** string for most types, a list for CHECKBOX and MULTISELECT, 'true' | 'false' | '' for TOGGLE */
  defaultValue: string | string[]
  isRequired: boolean
  isReadOnly: boolean
  isDisabled: boolean
  isVisible: boolean
  parentSectionId: number | null
  options: Option[]
  decimalPlaces: number
  collapsible: boolean
}

function isMultiValue(type: ComponentType): boolean {
  return type === 'CHECKBOX' || type === 'MULTISELECT'
}

export function toDraft(component: FormComponent): SettingsDraft {
  const { componentType: type, defaultValue, properties } = component
  let draftDefault: string | string[]
  if (isMultiValue(type)) draftDefault = Array.isArray(defaultValue) ? defaultValue.map(String) : []
  else if (defaultValue === null || defaultValue === undefined) draftDefault = ''
  else draftDefault = String(defaultValue)

  return {
    fieldCode: component.fieldCode,
    fieldLabel: component.fieldLabel,
    placeholder: component.placeholder ?? '',
    helpText: component.helpText ?? '',
    defaultValue: draftDefault,
    isRequired: component.isRequired,
    isReadOnly: component.isReadOnly,
    isDisabled: component.isDisabled,
    isVisible: component.isVisible,
    parentSectionId: component.parentSectionId,
    options: (properties.options ?? []).map((option) => ({ ...option })),
    decimalPlaces: properties.decimalPlaces ?? 2,
    collapsible: properties.collapsible ?? false,
  }
}

function defaultFromDraft(type: ComponentType, value: SettingsDraft['defaultValue']): unknown {
  if (isLayout(type)) return undefined
  if (isMultiValue(type)) return Array.isArray(value) && value.length > 0 ? value : undefined
  if (typeof value !== 'string' || value === '') return undefined
  if (type === 'TOGGLE') return value === 'true'
  if (type === 'NUMBER' || type === 'DECIMAL') return Number(value)
  return value
}

/** PUT replaces the whole component, so every field is sent; a field left empty is simply omitted. */
export function toRequest(component: FormComponent, draft: SettingsDraft): ComponentRequest {
  const type = component.componentType
  const request: ComponentRequest = {
    fieldCode: draft.fieldCode.trim(),
    fieldLabel: draft.fieldLabel,
    componentType: type,
    placeholder: draft.placeholder || undefined,
    helpText: draft.helpText || undefined,
    defaultValue: defaultFromDraft(type, draft.defaultValue),
    isRequired: draft.isRequired,
    isReadOnly: draft.isReadOnly,
    isDisabled: draft.isDisabled,
    isVisible: draft.isVisible,
    parentSectionId: type === 'SECTION' ? undefined : (draft.parentSectionId ?? undefined),
  }

  if (isChoice(type)) {
    // A row left completely blank is an accidental "Add option"; half-filled rows are left for the server to refuse.
    const options = draft.options.filter((option) => option.label.trim() !== '' || option.value.trim() !== '')
    request.properties = { dataSource: 'STATIC', options }
  } else if (type === 'DECIMAL') {
    request.properties = { decimalPlaces: draft.decimalPlaces }
  } else if (type === 'SECTION') {
    request.properties = { collapsible: draft.collapsible }
  }
  return request
}

export function isDraftDirty(initial: SettingsDraft, draft: SettingsDraft): boolean {
  return JSON.stringify(initial) !== JSON.stringify(draft)
}
