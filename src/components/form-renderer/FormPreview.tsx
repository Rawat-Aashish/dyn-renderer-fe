import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccentTheme } from '../../hooks/useAccentTheme'
import { useFormFiller } from '../../hooks/useFormFiller'
import { useStepFlow } from '../../hooks/useStepFlow'
import type { Configuration } from '../../types/form'
import type { UploadedFile } from '../../types/submission'
import { Badge } from '../ui/Badge'
import { Alert } from '../ui/StateViews'
import { FeedbackThanks, RatingPanel } from './RatingPanel'
import { SteppedForm } from './SteppedForm'

interface FormPreviewProps {
  config: Configuration
  backTo: string
  /** What the preview shows, e.g. "working copy" or "version 2". */
  source: string
}

/** The form exactly as a visitor will fill it in. Submit runs the checks and reports the result; nothing is sent. */
/** A file is kept in memory only: it gets a stand-in id so the answer passes the checks, and nothing is uploaded. */
async function simulateUpload(fieldCode: string, file: File): Promise<UploadedFile> {
  return { fileId: 0, fieldCode, name: file.name, contentType: file.type, sizeBytes: file.size }
}

export function FormPreview({ config, backTo, source }: FormPreviewProps) {
  useAccentTheme('theme-sky')
  const [passed, setPassed] = useState(false)
  const [ratingStage, setRatingStage] = useState<'rating' | 'feedback' | null>(null)
  const [given, setGiven] = useState(0)
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

        {ratingStage === null ? (
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
            uploadFile={simulateUpload}
            onSubmit={() => {
              const ok = flow.submit() !== null
              setPassed(ok)
              if (ok && config.ratingEnabled === true) setRatingStage('rating')
            }}
            notice={
              passed ? <Alert tone="success">These answers would pass the checks. Nothing was sent.</Alert> : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {ratingStage === 'rating' ? (
              <RatingPanel
                className="enter-up"
                onSubmit={async (rating) => {
                  setGiven(rating)
                  setRatingStage('feedback')
                }}
                onSkip={() => setRatingStage(null)}
              />
            ) : (
              <FeedbackThanks className="enter-up" rating={given} simulated />
            )}
            <button
              type="button"
              onClick={() => setRatingStage(null)}
              className="mx-auto block text-sm font-medium text-brand-700 hover:underline"
            >
              Back to the form
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
