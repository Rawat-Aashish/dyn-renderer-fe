import type { Configuration, FormComponent } from '../../types/form.ts'
import { walk } from './answers.ts'
import type { FieldState } from './evaluate.ts'

export interface Step {
  /** A section's field code, or "loose:<first field code>" for fields that sit outside any section. */
  key: string
  /** Null for a run of loose fields that does not start with a heading. */
  title: string | null
  intro: string | null
  components: FormComponent[]
  /** Field codes of the step's input components. */
  codes: string[]
}

export interface StepPlan {
  /** The steps the visitor will actually see, in order. */
  steps: Step[]
  /** Every step key in form order, including hidden ones, so a vanished step can fall back to its predecessor. */
  order: string[]
}

const isInput = (component: FormComponent) =>
  component.componentType !== 'SECTION' && component.componentType !== 'HEADING'

const inputCodes = (components: FormComponent[]) =>
  walk(components)
    .map((node) => node.component)
    .filter(isInput)
    .map((component) => component.fieldCode)

/**
 * Splits the form into steps: each top-level section is one, and consecutive loose top-level fields form
 * one of their own where they stand. Keys come from the structure, so they never change when a condition
 * flips; only the visible filter does.
 */
export function planSteps(config: Configuration, states: Map<string, FieldState>): StepPlan {
  const all: Step[] = []
  let loose: FormComponent[] = []

  const flushLoose = () => {
    if (loose.length === 0) return
    const [first] = loose
    const leadsWithHeading = first.componentType === 'HEADING' && states.get(first.fieldCode)?.visible === true
    const body = leadsWithHeading ? loose.slice(1) : loose
    all.push({
      key: `loose:${first.fieldCode}`,
      title: leadsWithHeading ? first.fieldLabel : null,
      intro: leadsWithHeading ? first.helpText : null,
      components: body,
      codes: inputCodes(body),
    })
    loose = []
  }

  for (const component of config.components) {
    if (component.componentType === 'SECTION') {
      flushLoose()
      all.push({
        key: component.fieldCode,
        title: component.fieldLabel,
        intro: component.helpText,
        components: component.children,
        codes: inputCodes(component.children),
      })
    } else {
      loose.push(component)
    }
  }
  flushLoose()

  // A step with nothing to fill in (all hidden, or only headings) is skipped. A hidden section hides its
  // children, so the same test covers it.
  const steps = all.filter((step) => step.codes.some((code) => states.get(code)?.visible))
  return { steps, order: all.map((step) => step.key) }
}

export function stepKeyFor(steps: Step[], code: string): string | undefined {
  return steps.find((step) => step.codes.includes(code))?.key
}

/** The step to show for a remembered key: itself, else the nearest earlier visible one, else the first. */
export function resolveStepKey(plan: StepPlan, key: string | null | undefined): string | null {
  const { steps, order } = plan
  if (steps.length === 0) return null
  if (key && steps.some((step) => step.key === key)) return key
  const at = key ? order.indexOf(key) : -1
  for (let i = at - 1; i >= 0; i--) {
    if (steps.some((step) => step.key === order[i])) return order[i]
  }
  return steps[0].key
}
