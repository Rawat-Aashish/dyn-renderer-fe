import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { formKey } from '../../hooks/useFormDetail'
import { updateForm } from '../../services/form.service'
import type { Form } from '../../types/form'

interface RatingToggleProps {
  form: Form
  /** Published or archived: the setting is frozen into the version, so it cannot be changed here. */
  locked: boolean
}

/** The form's rating setting as a small switch: green when visitors are asked to rate, yellow when not. */
export function RatingToggle({ form, locked }: RatingToggleProps) {
  const queryClient = useQueryClient()
  const on = form.ratingEnabled

  const toggle = useMutation({
    meta: { toast: on ? 'Rating turned off' : 'Rating turned on' },
    mutationFn: () =>
      updateForm(form.id, {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        ratingEnabled: !on,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(formKey(form.id), (old: unknown) =>
        old && typeof old === 'object' ? { ...old, ...saved } : old,
      )
      await queryClient.invalidateQueries({ queryKey: ['forms'] })
    },
  })

  const tone = on
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700'
  const track = on ? 'bg-emerald-500' : 'bg-amber-400'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={locked || toggle.isPending}
      onClick={() => toggle.mutate()}
      title={
        locked
          ? 'Rating can only be changed while the form is a draft. Create a new version to change it.'
          : on
            ? 'Visitors are asked to rate the form after they submit. Click to turn off.'
            : 'Visitors are not asked to rate the form. Click to turn on.'
      }
      className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed ${tone} ${
        locked ? 'opacity-80' : 'cursor-pointer'
      }`}
    >
      <span aria-hidden="true" className={`relative inline-block h-3.5 w-6 rounded-full transition-colors duration-150 ${track}`}>
        <span
          className={`absolute top-0.5 size-2.5 rounded-full bg-white transition-all duration-150 ${on ? 'left-3 ' : 'left-0.5'}`}
        />
      </span>
      <Star aria-hidden="true" className="size-3" />
      Rating {on ? 'on' : 'off'}
    </button>
  )
}
