import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormFiller } from '../../hooks/useFormFiller'
import { flattenComponents } from '../../lib/component-meta'
import type { Configuration } from '../../types/form'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Alert } from '../ui/StateViews'
import { FormRenderer } from './FormRenderer'

interface FormPreviewProps {
  config: Configuration
  backTo: string
  /** What the preview shows, e.g. "working copy" or "version 2". */
  source: string
}

/** The form as a visitor will see it. Submit runs the checks and reports the result; nothing is sent. */
export function FormPreview({ config, backTo, source }: FormPreviewProps) {
  const filler = useFormFiller(config)
  const [passed, setPassed] = useState(false)
  const hasPattern = flattenComponents(config.components).some((component) =>
    component.validationRules.some((rule) => rule.ruleType === 'REGEX'),
  )

  return (
    <div>
      <Link to={backTo} className="text-sm font-medium text-brand-700 hover:underline">
        ← Back
      </Link>

      <div className="mx-auto mt-4 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="amber">Preview</Badge>
          <span className="text-sm text-slate-600">Showing the {source}. Nothing you enter here is sent anywhere.</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              setPassed(filler.attemptSubmit() !== null)
            }}
            className="space-y-6"
          >
            <FormRenderer
              config={config}
              answers={filler.answers}
              states={filler.states}
              errors={filler.errors}
              onChange={(code, value) => {
                setPassed(false)
                filler.setAnswer(code, value)
              }}
              onBlur={filler.touch}
            />

            {hasPattern && (
              <Alert tone="info">
                This form has pattern rules. Patterns are checked by the server when a form is really submitted, so this
                preview cannot report them.
              </Alert>
            )}
            {passed && <Alert tone="success">These answers would pass the checks. Nothing was sent.</Alert>}

            <Button type="submit">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
