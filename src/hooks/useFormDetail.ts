import { useQuery } from '@tanstack/react-query'
import { getForm } from '../services/form.service'

export const formKey = (id: number) => ['form', id] as const

/** The working copy of one form. Every screen under /admin/forms/:id shares this one cached query. */
export function useFormDetail(id: number) {
  return useQuery({
    queryKey: formKey(id),
    queryFn: () => getForm(id),
    enabled: Number.isInteger(id),
  })
}
