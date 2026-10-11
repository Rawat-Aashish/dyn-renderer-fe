import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { RULE_TYPES_BY_COMPONENT } from '../../lib/component-meta'
import { addRule, deleteRule, updateRule } from '../../services/validation.service'
import type { ComponentType, FormComponent, RuleType, ValidationRule } from '../../types/form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Alert } from '../ui/StateViews'

function ruleLabel(ruleType: RuleType, componentType: ComponentType): string {
  const dateTime = componentType === 'DATETIME'
  switch (ruleType) {
    case 'MIN_LENGTH': return 'Minimum length'
    case 'MAX_LENGTH': return 'Maximum length'
    case 'REGEX': return 'Pattern'
    case 'MIN': return 'Minimum value'
    case 'MAX': return 'Maximum value'
    case 'DATE_MIN': return dateTime ? 'Earliest date and time' : 'Earliest date'
    case 'DATE_MAX': return dateTime ? 'Latest date and time' : 'Latest date'
  }
}

function ruleHelp(ruleType: RuleType): string | undefined {
  if (ruleType === 'REGEX') {
    return 'A regular expression in the server’s (Java) syntax; the answer must match all of it. Patterns the browser cannot read are checked by the server when the form is submitted.'
  }
  if (ruleType === 'MIN_LENGTH' || ruleType === 'MAX_LENGTH') return 'A whole number, 0 or more.'
  return undefined
}

interface RuleValueInputProps {
  ruleType: RuleType
  componentType: ComponentType
  value: string
  onChange: (value: string) => void
  error?: string
}

function RuleValueInput({ ruleType, componentType, value, onChange, error }: RuleValueInputProps) {
  const label = ruleLabel(ruleType, componentType)
  const common = { label, value, error, help: ruleHelp(ruleType), required: true }
  const handle = (event: { target: { value: string } }) => onChange(event.target.value)

  switch (ruleType) {
    case 'MIN_LENGTH':
    case 'MAX_LENGTH':
      return <Input {...common} type="number" min={0} step={1} onChange={handle} />
    case 'MIN':
    case 'MAX':
      return <Input {...common} type="number" step="any" onChange={handle} />
    case 'DATE_MIN':
    case 'DATE_MAX':
      return <Input {...common} type={componentType === 'DATETIME' ? 'datetime-local' : 'date'} onChange={handle} />
    case 'REGEX':
      return <Input {...common} className="font-mono text-xs" autoComplete="off" onChange={handle} />
  }
}

function RuleRow({ component, rule, formId, readOnly }: { component: FormComponent; rule: ValidationRule; formId: number; readOnly: boolean }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(rule.ruleValue)
  const [message, setMessage] = useState(rule.errorMessage ?? '')
  const dirty = value !== rule.ruleValue || message !== (rule.errorMessage ?? '')
  const refresh = () => queryClient.invalidateQueries({ queryKey: formKey(formId) })

  const save = useMutation({
    mutationFn: () => updateRule(component.id, rule.id, { ruleValue: value, errorMessage: message || undefined }),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: () => deleteRule(component.id, rule.id), onSuccess: refresh })

  const failed = save.error ?? remove.error
  const errors = fieldErrorsOf(save.error)
  const busy = save.isPending || remove.isPending

  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <fieldset disabled={readOnly || busy} className="min-w-0 space-y-3">
        {failed && Object.keys(errors).length === 0 && <Alert>{messageOf(failed)}</Alert>}
        <RuleValueInput
          ruleType={rule.ruleType}
          componentType={component.componentType}
          value={value}
          onChange={setValue}
          error={errors.ruleValue}
        />
        <Input
          label="Message shown when it fails"
          value={message}
          maxLength={500}
          placeholder="Use the default message"
          onChange={(event) => setMessage(event.target.value)}
          error={errors.errorMessage}
        />
      </fieldset>
      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <Button loading={save.isPending} disabled={!dirty || remove.isPending} onClick={() => save.mutate()}>
            Save rule
          </Button>
          <Button variant="secondary" loading={remove.isPending} disabled={save.isPending} onClick={() => remove.mutate()}>
            Delete
          </Button>
        </div>
      )}
    </li>
  )
}

function AddRule({ component, formId, remaining }: { component: FormComponent; formId: number; remaining: RuleType[] }) {
  const queryClient = useQueryClient()
  const [ruleType, setRuleType] = useState<RuleType>(remaining[0])
  const [value, setValue] = useState('')
  const [message, setMessage] = useState('')

  // The chosen type can disappear from the list once it has been added.
  const current = remaining.includes(ruleType) ? ruleType : remaining[0]

  const add = useMutation({
    mutationFn: () => addRule(component.id, { ruleType: current, ruleValue: value, errorMessage: message || undefined }),
    onSuccess: async () => {
      setValue('')
      setMessage('')
      await queryClient.invalidateQueries({ queryKey: formKey(formId) })
    },
  })
  const errors = fieldErrorsOf(add.error)

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        add.mutate()
      }}
      className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3"
    >
      <h3 className="text-sm font-semibold text-slate-900">Add a rule</h3>
      {add.isError && Object.keys(errors).length === 0 && <Alert>{messageOf(add.error)}</Alert>}
      <Select
        label="Rule"
        value={current}
        onChange={(event) => {
          setRuleType(event.target.value as RuleType)
          setValue('')
        }}
        error={errors.ruleType}
      >
        {remaining.map((type) => (
          <option key={type} value={type}>
            {ruleLabel(type, component.componentType)}
          </option>
        ))}
      </Select>
      <RuleValueInput
        ruleType={current}
        componentType={component.componentType}
        value={value}
        onChange={setValue}
        error={errors.ruleValue}
      />
      <Input
        label="Message shown when it fails"
        value={message}
        maxLength={500}
        placeholder="Use the default message"
        onChange={(event) => setMessage(event.target.value)}
        error={errors.errorMessage}
      />
      <Button type="submit" loading={add.isPending}>
        Add rule
      </Button>
    </form>
  )
}

export function ValidationTab({ formId, component, readOnly }: { formId: number; component: FormComponent; readOnly: boolean }) {
  const allowed = RULE_TYPES_BY_COMPONENT[component.componentType]
  const used = new Set(component.validationRules.map((rule) => rule.ruleType))
  const remaining = allowed.filter((type) => !used.has(type))
  const type = component.componentType

  return (
    <div className="space-y-4">
      {allowed.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">
          {type === 'SECTION' || type === 'HEADING'
            ? 'Layout elements do not collect an answer, so they take no validation rules.'
            : 'This type has no validation rules. A required field must be filled in, and a choice is always checked against its options.'}
        </p>
      )}

      {(type === 'EMAIL' || type === 'PHONE') && (
        <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {type === 'EMAIL' ? 'The email format' : 'The phone number format'} is always checked. You do not need a rule for it.
        </p>
      )}

      {component.validationRules.length > 0 && (
        <ul className="space-y-3">
          {component.validationRules.map((rule) => (
            <RuleRow
              key={`${rule.id}:${rule.ruleValue}:${rule.errorMessage}`}
              component={component}
              rule={rule}
              formId={formId}
              readOnly={readOnly}
            />
          ))}
        </ul>
      )}

      {allowed.length > 0 && component.validationRules.length === 0 && readOnly && (
        <p className="text-sm text-slate-600">No validation rules.</p>
      )}

      {!readOnly && remaining.length > 0 && <AddRule key={remaining.join()} component={component} formId={formId} remaining={remaining} />}
      {!readOnly && allowed.length > 0 && remaining.length === 0 && (
        <p className="text-sm text-slate-500">Every rule this field type allows has been added.</p>
      )}
    </div>
  )
}
