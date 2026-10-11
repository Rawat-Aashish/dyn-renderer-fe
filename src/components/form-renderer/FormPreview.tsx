import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccentTheme } from '../../hooks/useAccentTheme'
import { useFormFiller } from '../../hooks/useFormFiller'
import { useStepFlow } from '../../hooks/useStepFlow'
import type { Configuration } from '../../types/form'
import { Badge } from '../ui/Badge'
import { Alert } from '../ui/StateViews'
import { SteppedForm } from './SteppedForm'

interface FormPreviewProps {
  config: Configuration
  backTo: string
  /** What the preview shows, e.g. "working copy" or "version 2". */
  source: string
}

/** The form exactly as a visitor will fill it in. Submit runs the checks and reports the result; nothing is sent. */
export function FormPreview({ config, backTo, source }: FormPreviewProps) {
  useAccentTheme('theme-sky')
  const [passed, setPassed] = useState(false)
  const filler = useFormFiller(config)
  const flow = useStepFlow(config, filler)

  return (
    <div>
      <Link to={backTo} className="text-sm font-medium text-brand-700 hover:underline">
        ← Back
      </Link>

      <div className="mx-auto mt-4 max-w-lg">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="amber">Preview</Badge>
          <span className="text-sm text-slate-600">Showing the {source}. Nothing you enter here is sent anywhere.</span>
        </div>

        <SteppedForm
          config={config}
          filler={{
            ...filler,
            // Any edit makes an earlier "would pass" result out of date.
            setAnswer: (code, value) => {
              setPassed(false)
              filler.setAnswer(code, value)
            },
          }}
          flow={flow}
          onSubmit={() => setPassed(flow.submit() !== null)}
          notice={
            passed ? <Alert tone="success">These answers would pass the checks. Nothing was sent.</Alert> : undefined
          }
        />
      </div>
    </div>
  )
}
