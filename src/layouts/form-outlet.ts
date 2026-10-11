/** What the form screen (FormLayout) hands to the page rendered inside it. */
export interface FormOutletContext {
  /** Opens the publish confirmation. Only meaningful while the form is an editable draft. */
  requestPublish: () => void
}
