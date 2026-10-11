/** Moves focus to a field's control and scrolls it to the middle of the screen. False when it is not on screen. */
export function focusField(code: string): boolean {
  const element = document.getElementById(`field-${code}`)
  if (!element) return false
  const target = element.matches('input, select, textarea, button')
    ? element
    : element.querySelector<HTMLElement>('input, select, textarea, button')
  target?.focus({ preventScroll: true })
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return true
}
