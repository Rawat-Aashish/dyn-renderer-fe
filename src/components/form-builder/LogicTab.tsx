import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import {
  ACTION_LABELS,
  CONDITION_PAIRS,
  flattenComponents,
  isLayout,
  needsValue,
  operatorLabel,
  operatorsFor,
  type ConditionPair,
} from '../../lib/component-meta'
import { addCondition, deleteCondition, updateCondition } from '../../services/condition.service'
import type { Action, Condition, FormComponent, LogicalOperator, Operator } from '../../types/form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Alert } from '../ui/StateViews'

interface DraftRule {
  sourceFieldCode: string
  operator: Operator
  value: string
}

interface ConditionEditorProps {
  formId: number
  component: FormComponent
  pair: ConditionPair
  condition?: Condition
  sources: FormComponent[]
  readOnly: boolean
  onCancel?: () => void
}

function newRule(sources: FormComponent[]): DraftRule {
  const source = sources[0]
  return { sourceFieldCode: source.fieldCode, operator: operatorsFor(source.componentType)[0], value: '' }
}

function RuleValueInput({
  source,
  value,
  onChange,
  error,
}: {
  source: FormComponent
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const label = 'Value'
  const type = source.componentType

  if (type === 'NUMBER' || type === 'DECIMAL') {
    return <Input label={label} type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} error={error} />
  }
  if (type === 'DATE' || type === 'DATETIME') {
    return (
      <Input
        label={label}
        type={type === 'DATE' ? 'date' : 'datetime-local'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
    )
  }
  if (type === 'TOGGLE') {
    return (
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} error={error}>
        <option value="">Choose…</option>
        <option value="true">On</option>
        <option value="false">Off</option>
      </Select>
    )
  }
  const options = source.properties.options ?? []
  if (['DROPDOWN', 'RADIO', 'CHECKBOX', 'MULTISELECT'].includes(type) && options.length > 0) {
    const known = options.some((option) => option.value === value)
    return (
      <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} error={error}>
        <option value="">Choose…</option>
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
        {value !== '' && !known && <option value={value}>{value} (no longer an option)</option>}
      </Select>
    )
  }
  return <Input label={label} value={value} maxLength={500} onChange={(e) => onChange(e.target.value)} error={error} />
}

function ConditionEditor({ formId, component, pair, condition, sources, readOnly, onCancel }: ConditionEditorProps) {
  const queryClient = useQueryClient()
  const initialRules: DraftRule[] = condition
    ? condition.rules.map((rule) => ({
        sourceFieldCode: rule.sourceFieldCode,
        operator: rule.operator,
        value: rule.value ?? '',
      }))
    : [newRule(sources)]
  const initialAction: Action = condition?.action ?? pair.actions[0]
  const initialLogical: LogicalOperator = condition?.logicalOperator ?? 'AND'

  const [action, setAction] = useState<Action>(initialAction)
  const [logical, setLogical] = useState<LogicalOperator>(initialLogical)
  const [rules, setRules] = useState<DraftRule[]>(initialRules)

  const dirty =
    !condition ||
    action !== initialAction ||
    logical !== initialLogical ||
    JSON.stringify(rules) !== JSON.stringify(initialRules)

  const refresh = () => queryClient.invalidateQueries({ queryKey: formKey(formId) })

  const body = {
    targetFieldCode: component.fieldCode,
    action,
    logicalOperator: logical,
    rules: rules.map((rule) => ({
      sourceFieldCode: rule.sourceFieldCode,
      operator: rule.operator,
      value: needsValue(rule.operator) ? rule.value : undefined,
    })),
  }

  const save = useMutation({
    mutationFn: () => (condition ? updateCondition(formId, condition.id, body) : addCondition(formId, body)),
    onSuccess: async () => {
      await refresh()
      onCancel?.()
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteCondition(formId, condition!.id),
    onSuccess: refresh,
  })

  const failed = save.error ?? remove.error
  const errors = fieldErrorsOf(save.error)
  const unownedErrors = Object.entries(errors).filter(([key]) => !/^rules\[\d+\]\./.test(key))
  const busy = save.isPending || remove.isPending

  function updateRule(index: number, patch: Partial<DraftRule>) {
    setRules((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
  }

  function changeSource(index: number, fieldCode: string) {
    const source = sources.find((candidate) => candidate.fieldCode === fieldCode)
    if (!source) return
    updateRule(index, { sourceFieldCode: fieldCode, operator: operatorsFor(source.componentType)[0], value: '' })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <fieldset disabled={readOnly || busy} className="min-w-0 space-y-3">
        {failed && unownedErrors.length === 0 && <Alert>{messageOf(failed)}</Alert>}
        {unownedErrors.map(([key, message]) => (
          <Alert key={key}>{message}</Alert>
        ))}

        <Select label="Action" value={action} onChange={(e) => setAction(e.target.value as Action)}>
          {pair.actions.map((option) => (
            <option key={option} value={option}>
              {ACTION_LABELS[option]} this field
            </option>
          ))}
        </Select>

        <p className="text-sm font-medium text-slate-700">when</p>

        {rules.map((rule, index) => {
          const source = sources.find((candidate) => candidate.fieldCode === rule.sourceFieldCode)
          const operators = source ? operatorsFor(source.componentType) : []
          return (
            <div key={index} className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
              <Select
                label="Field"
                value={rule.sourceFieldCode}
                onChange={(e) => changeSource(index, e.target.value)}
                error={errors[`rules[${index}].sourceFieldCode`]}
              >
                {!source && <option value={rule.sourceFieldCode}>{rule.sourceFieldCode}</option>}
                {sources.map((candidate) => (
                  <option key={candidate.id} value={candidate.fieldCode}>
                    {candidate.fieldLabel} ({candidate.fieldCode})
                  </option>
                ))}
              </Select>
              <Select
                label="Condition"
                value={rule.operator}
                onChange={(e) => updateRule(index, { operator: e.target.value as Operator, value: '' })}
                error={errors[`rules[${index}].operator`]}
              >
                {operators.map((operator) => (
                  <option key={operator} value={operator}>
                    {operatorLabel(operator, source!.componentType)}
                  </option>
                ))}
              </Select>
              {source && needsValue(rule.operator) && (
                <RuleValueInput
                  source={source}
                  value={rule.value}
                  onChange={(value) => updateRule(index, { value })}
                  error={errors[`rules[${index}].value`]}
                />
              )}
              {rules.length > 1 && !readOnly && (
                <button
                  type="button"
                  onClick={() => setRules((current) => current.filter((_, i) => i !== index))}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove this rule
                </button>
              )}
            </div>
          )
        })}

        {!readOnly && (
          <Button variant="secondary" onClick={() => setRules((current) => [...current, newRule(sources)])}>
            Add another rule
          </Button>
        )}

        {rules.length > 1 && (
          <Select label="Combine the rules" value={logical} onChange={(e) => setLogical(e.target.value as LogicalOperator)}>
            <option value="AND">All rules must match</option>
            <option value="OR">Any rule may match</option>
          </Select>
        )}
      </fieldset>

      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <Button loading={save.isPending} disabled={!dirty || remove.isPending} onClick={() => save.mutate()}>
            Save condition
          </Button>
          {condition ? (
            <Button variant="secondary" loading={remove.isPending} disabled={save.isPending} onClick={() => remove.mutate()}>
              Delete
            </Button>
          ) : (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function Slot(props: Omit<ConditionEditorProps, 'onCancel'>) {
  const [adding, setAdding] = useState(false)
  const { pair, condition, readOnly, sources } = props

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">{pair.title}</h3>
      {condition ? (
        <ConditionEditor key={`${condition.id}:${JSON.stringify(condition)}`} {...props} />
      ) : adding ? (
        <ConditionEditor {...props} onCancel={() => setAdding(false)} />
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 px-3 py-2.5">
          <p className="text-sm text-slate-600">No condition. The field&apos;s own setting applies.</p>
          {!readOnly && (
            <Button variant="secondary" disabled={sources.length === 0} onClick={() => setAdding(true)}>
              Add
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

interface LogicTabProps {
  formId: number
  component: FormComponent
  components: FormComponent[]
  conditions: Condition[]
  readOnly: boolean
}

export function LogicTab({ formId, component, components, conditions, readOnly }: LogicTabProps) {
  const layout = isLayout(component.componentType)
  const pairs = layout ? CONDITION_PAIRS.filter((pair) => pair.id === 'visibility') : CONDITION_PAIRS

  // A condition reads answers, so only input fields can be sources; never the target itself,
  // and a section cannot depend on its own children.
  const sources = flattenComponents(components).filter(
    (candidate) =>
      !isLayout(candidate.componentType) &&
      candidate.id !== component.id &&
      !(component.componentType === 'SECTION' && candidate.parentSectionId === component.id),
  )

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-slate-600">
        A condition decides a property from other fields&apos; answers. While one controls a property, this field&apos;s own
        setting for it is not used.
      </p>
      {sources.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">
          Add another input field first. A condition needs a field whose answer it can depend on.
        </p>
      )}
      {pairs.map((pair) => (
        <Slot
          key={pair.id}
          formId={formId}
          component={component}
          pair={pair}
          condition={conditions.find(
            (condition) => condition.targetFieldCode === component.fieldCode && pair.actions.includes(condition.action),
          )}
          sources={sources}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}
