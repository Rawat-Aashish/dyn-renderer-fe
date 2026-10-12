import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useMemo, useState } from 'react'
import { fieldErrorsOf, messageOf } from '../../api/client'
import { formKey } from '../../hooks/useFormDetail'
import { FORMAT_INFO } from '../../lib/file-formats'
import { isChoice, isLayout, supportsPlaceholder } from '../../lib/component-meta'
import { updateComponent } from '../../services/component.service'
import { useBuilderStore } from '../../stores/builder.store'
import { FILE_FORMATS, type FormComponent } from '../../types/form'
import { FieldControl } from '../form-renderer/FieldControl'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Alert } from '../ui/StateViews'
import { OptionsEditor } from './OptionsEditor'
import { isDraftDirty, toDraft, toRequest, type SettingsDraft } from './settings-draft'

interface SettingsFormProps {
  formId: number
  component: FormComponent
  sections: FormComponent[]
  readOnly: boolean
  /** Properties a condition currently decides, so the component's own flag is not used. */
  controlled: { isVisible: boolean; isDisabled: boolean; isRequired: boolean }
  /** A condition uses this field, so the server refuses a change of its code. */
  codeLocked: boolean
}

function Checkbox({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className={`flex items-start gap-2 text-sm text-slate-800 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  )
}

const BY_CONDITION = 'Controlled by a condition (Logic tab).'

export function SettingsForm({ formId, component, sections, readOnly, controlled, codeLocked }: SettingsFormProps) {
  const queryClient = useQueryClient()
  const setSettingsDirty = useBuilderStore((state) => state.setSettingsDirty)
  const defaultId = useId()
  const type = component.componentType

  const initial = useMemo(() => toDraft(component), [component])
  const [draft, setDraft] = useState<SettingsDraft>(initial)
  const dirty = isDraftDirty(initial, draft)

  // Edits that can no longer be saved (the form was locked meanwhile) are not worth a "leave without saving?" prompt.
  useEffect(() => {
    setSettingsDirty(dirty && !readOnly)
  }, [dirty, readOnly, setSettingsDirty])

  const save = useMutation({
    meta: { toast: 'Field saved' },
    mutationFn: () => updateComponent(formId, component.id, toRequest(component, draft)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  })

  function set<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const errors = fieldErrorsOf(save.error)
  const hasFieldErrors = Object.keys(errors).length > 0
  const layout = isLayout(type)
  const parents = sections.filter((section) => section.id !== component.id)
  // A required field must be fillable, so it cannot also be read-only or disabled. A box that is already ticked stays
  // clickable, so a field saved with both before this rule can still be fixed.
  const requiredBlocked = (draft.isReadOnly || draft.isDisabled) && !draft.isRequired
  const readOnlyBlocked = draft.isRequired && !draft.isReadOnly
  const disabledBlocked = draft.isRequired && !draft.isDisabled

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <fieldset disabled={readOnly || save.isPending} className="min-w-0 space-y-4">
        {save.isError && !hasFieldErrors && <Alert>{messageOf(save.error)}</Alert>}

        <Input
          label="Label"
          required
          value={draft.fieldLabel}
          maxLength={255}
          onChange={(event) => set('fieldLabel', event.target.value)}
          error={errors.fieldLabel}
        />
        <Input
          label="Field code"
          required
          value={draft.fieldCode}
          maxLength={100}
          autoComplete="off"
          disabled={codeLocked}
          onChange={(event) => set('fieldCode', event.target.value)}
          error={errors.fieldCode}
          help={
            codeLocked
              ? 'A condition uses this field, so its code cannot change until that condition is removed or changed.'
              : 'Names this field in answers and conditions. Letters, digits and underscores, starting with a letter.'
          }
          className="font-mono text-xs"
        />

        {supportsPlaceholder(type) && (
          <Input
            label="Placeholder"
            value={draft.placeholder}
            maxLength={255}
            onChange={(event) => set('placeholder', event.target.value)}
            error={errors.placeholder}
          />
        )}
        <Input
          label="Help text"
          value={draft.helpText}
          maxLength={500}
          onChange={(event) => set('helpText', event.target.value)}
          error={errors.helpText}
        />

        {isChoice(type) && <OptionsEditor options={draft.options} onChange={(options) => set('options', options)} />}

        {type === 'DECIMAL' && (
          <Input
            label="Decimal places"
            type="number"
            min={0}
            max={10}
            step={1}
            value={draft.decimalPlaces}
            onChange={(event) => set('decimalPlaces', Number(event.target.value))}
            help="How many digits are allowed after the point (0 to 10)."
          />
        )}

        {type === 'SECTION' && (
          <Checkbox
            label="Collapsible"
            hint="Visitors can fold the section away."
            checked={draft.collapsible}
            onChange={(value) => set('collapsible', value)}
          />
        )}

        {type === 'FILE_UPLOAD' && (
          <>
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Accepted formats</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {FILE_FORMATS.map((format) => {
                  const checked = draft.allowedTypes.includes(format)
                  return (
                    <Checkbox
                      key={format}
                      label={FORMAT_INFO[format].label}
                      checked={checked}
                      // At least one format stays ticked: an empty list would mean "all" to the server.
                      disabled={checked && draft.allowedTypes.length === 1}
                      onChange={(value) =>
                        set(
                          'allowedTypes',
                          FILE_FORMATS.filter((item) => (item === format ? value : draft.allowedTypes.includes(item))),
                        )
                      }
                    />
                  )
                })}
              </div>
              {errors.allowedTypes && <p className="mt-1 text-xs text-red-600">{errors.allowedTypes}</p>}
            </fieldset>
            <Select
              label="Maximum size"
              value={String(draft.maxSizeMb)}
              onChange={(event) => set('maxSizeMb', Number(event.target.value))}
              error={errors.maxSizeMb}
              help="The server never accepts more than 10 MB."
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((mb) => (
                <option key={mb} value={mb}>
                  {mb} MB
                </option>
              ))}
            </Select>
          </>
        )}

        {!layout &&
          type !== 'FILE_UPLOAD' &&
          (type === 'TOGGLE' ? (
            <Select
              label="Default value"
              value={draft.defaultValue as string}
              onChange={(event) => set('defaultValue', event.target.value)}
            >
              <option value="">No default</option>
              <option value="true">On</option>
              <option value="false">Off</option>
            </Select>
          ) : (
            <Field label="Default value" htmlFor={defaultId} help="Filled in when the form opens.">
              <FieldControl
                type={type}
                id={defaultId}
                value={draft.defaultValue}
                onChange={(value) => set('defaultValue', value as SettingsDraft['defaultValue'])}
                options={draft.options}
                placeholder={type === 'DROPDOWN' || type === 'MULTISELECT' ? 'No default' : undefined}
                decimalPlaces={draft.decimalPlaces}
                clearable
              />
            </Field>
          ))}

        {type !== 'SECTION' && parents.length > 0 && (
          <Select
            label="Section"
            value={draft.parentSectionId === null ? '' : String(draft.parentSectionId)}
            onChange={(event) => set('parentSectionId', event.target.value === '' ? null : Number(event.target.value))}
            help="Moving a field puts it last in its new place."
          >
            <option value="">Top level</option>
            {parents.map((section) => (
              <option key={section.id} value={section.id}>
                {section.fieldLabel}
              </option>
            ))}
          </Select>
        )}

        <div className="space-y-2.5 border-t border-slate-200 pt-4">
          {!layout && (
            <>
              <Checkbox
                label="Required"
                hint={
                  controlled.isRequired
                    ? BY_CONDITION
                    : requiredBlocked
                      ? 'Not available while the field is read-only or disabled.'
                      : undefined
                }
                disabled={controlled.isRequired || requiredBlocked}
                checked={draft.isRequired}
                onChange={(v) => set('isRequired', v)}
              />
              <Checkbox
                label="Read-only"
                hint={
                  readOnlyBlocked
                    ? 'Not available while the field is required.'
                    : 'Shows the default value; whatever is sent is ignored.'
                }
                disabled={readOnlyBlocked}
                checked={draft.isReadOnly}
                onChange={(v) => set('isReadOnly', v)}
              />
              <Checkbox
                label="Disabled"
                hint={
                  controlled.isDisabled
                    ? BY_CONDITION
                    : disabledBlocked
                      ? 'Not available while the field is required.'
                      : 'Cannot be edited and is not validated or stored.'
                }
                disabled={controlled.isDisabled || disabledBlocked}
                checked={draft.isDisabled}
                onChange={(v) => set('isDisabled', v)}
              />
            </>
          )}
          <Checkbox
            label="Visible"
            hint={controlled.isVisible ? BY_CONDITION : undefined}
            disabled={controlled.isVisible}
            checked={draft.isVisible}
            onChange={(v) => set('isVisible', v)}
          />
        </div>
      </fieldset>

      {!readOnly && (
        <div className="mt-5 flex gap-2">
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            Save
          </Button>
          <Button variant="secondary" disabled={!dirty || save.isPending} onClick={() => setDraft(initial)}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  )
}
