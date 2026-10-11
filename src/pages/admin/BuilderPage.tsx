import { useOutletContext, useParams } from 'react-router-dom'
import { BuilderScreen } from '../../components/form-builder/BuilderScreen'
import { Alert } from '../../components/ui/StateViews'
import { useFormDetail } from '../../hooks/useFormDetail'
import { isLocked } from '../../lib/form-status'
import type { FormOutletContext } from '../../layouts/form-outlet'

export function BuilderPage() {
  const formId = Number(useParams().id)
  const { requestPublish } = useOutletContext<FormOutletContext>()
  const { data: form } = useFormDetail(formId)
  if (!form) return null

  const locked = isLocked(form)
  const notice = form.archived ? (
    <Alert tone="info">This form is archived. Everything below is read-only.</Alert>
  ) : locked ? (
    <Alert tone="info">This form is published and locked. Create a new version to make changes.</Alert>
  ) : undefined

  return (
    <BuilderScreen
      formId={formId}
      components={form.components}
      conditions={form.conditions}
      readOnly={locked}
      notice={notice}
      overview={{ previewTo: `/admin/forms/${formId}/preview`, onPublish: requestPublish }}
    />
  )
}
