export const COMPONENT_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DECIMAL',
  'EMAIL',
  'PHONE',
  'DROPDOWN',
  'RADIO',
  'CHECKBOX',
  'MULTISELECT',
  'TOGGLE',
  'DATE',
  'DATETIME',
  'FILE_UPLOAD',
  'SECTION',
  'HEADING',
] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const FILE_FORMATS = ['jpg', 'png', 'webp', 'pdf'] as const
export type FileFormat = (typeof FILE_FORMATS)[number]

export const RULE_TYPES = ['MIN_LENGTH', 'MAX_LENGTH', 'REGEX', 'MIN', 'MAX', 'DATE_MIN', 'DATE_MAX'] as const
export type RuleType = (typeof RULE_TYPES)[number]

export const ACTIONS = ['SHOW', 'HIDE', 'ENABLE', 'DISABLE', 'MAKE_REQUIRED', 'MAKE_OPTIONAL'] as const
export type Action = (typeof ACTIONS)[number]

export const OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'CONTAINS',
  'GREATER_THAN',
  'LESS_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN_OR_EQUAL',
  'IS_EMPTY',
  'IS_NOT_EMPTY',
] as const
export type Operator = (typeof OPERATORS)[number]

export type LogicalOperator = 'AND' | 'OR'

export interface Option {
  label: string
  value: string
}

export interface ComponentProperties {
  dataSource?: 'STATIC'
  options?: Option[]
  decimalPlaces?: number
  collapsible?: boolean
  /** FILE_UPLOAD: the formats it accepts; the server always returns the full list. */
  allowedTypes?: FileFormat[]
  /** FILE_UPLOAD: largest file in megabytes, 1 to 10. */
  maxSizeMb?: number
}

export interface ValidationRule {
  id: number
  ruleType: RuleType
  ruleValue: string
  errorMessage: string | null
}

export interface FormComponent {
  id: number
  fieldCode: string
  fieldLabel: string
  componentType: ComponentType
  placeholder: string | null
  helpText: string | null
  defaultValue: unknown
  displayOrder: number
  isRequired: boolean
  isReadOnly: boolean
  isDisabled: boolean
  isVisible: boolean
  parentSectionId: number | null
  properties: ComponentProperties
  validationRules: ValidationRule[]
  children: FormComponent[]
}

export interface ConditionRule {
  id: number
  sourceFieldCode: string
  operator: Operator
  value: string | null
}

export interface Condition {
  id: number
  targetFieldCode: string
  action: Action
  logicalOperator: LogicalOperator
  rules: ConditionRule[]
}

export type FormStatus = 'DRAFT' | 'PUBLISHED'

export interface Form {
  id: number
  name: string
  code: string
  description: string | null
  category: string | null
  status: FormStatus
  currentVersion: number
  publishedVersion: number | null
  archived: boolean
  ratingEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface FormDetail extends Form {
  components: FormComponent[]
  conditions: Condition[]
}

/** The shape the renderer, the preview and the public form all work from. */
export interface Configuration {
  name: string
  code: string
  description: string | null
  category: string | null
  version: number
  /** Absent in configurations published before ratings existed, which means false. */
  ratingEnabled?: boolean
  components: FormComponent[]
  conditions: Condition[]
}

export interface ComponentRequest {
  fieldCode: string
  fieldLabel: string
  componentType: ComponentType
  placeholder?: string
  helpText?: string
  defaultValue?: unknown
  isRequired?: boolean
  isReadOnly?: boolean
  isDisabled?: boolean
  isVisible?: boolean
  parentSectionId?: number
  properties?: ComponentProperties
}

export interface FormInput {
  name: string
  code?: string
  description?: string
  category?: string
  ratingEnabled?: boolean
}

export interface FormListParams {
  page: number
  size: number
  archived: boolean
  status: FormStatus | ''
  search: string
}

export interface ConditionRequest {
  targetFieldCode: string
  action: Action
  logicalOperator: LogicalOperator
  rules: { sourceFieldCode: string; operator: Operator; value?: string }[]
}

export type VersionStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED'

export interface Version {
  id: number
  versionNumber: number
  status: VersionStatus
  publishedAt: string | null
  createdAt: string
}

export interface VersionDetail extends Version {
  /** null while the version is a draft */
  configuration: Configuration | null
}
