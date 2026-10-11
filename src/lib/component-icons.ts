import {
  AlignLeft,
  Calculator,
  Calendar,
  CalendarClock,
  CircleDot,
  Hash,
  Heading,
  ListChecks,
  Mail,
  Phone,
  Rows3,
  SquareCheck,
  SquareChevronDown,
  ToggleLeft,
  Type,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentType } from '../types/form'

/** One icon per component type, so a field is recognisable at a glance in lists and menus. */
export const TYPE_ICONS: Record<ComponentType, LucideIcon> = {
  TEXT: Type,
  TEXTAREA: AlignLeft,
  NUMBER: Hash,
  DECIMAL: Calculator,
  EMAIL: Mail,
  PHONE: Phone,
  DROPDOWN: SquareChevronDown,
  RADIO: CircleDot,
  CHECKBOX: SquareCheck,
  MULTISELECT: ListChecks,
  TOGGLE: ToggleLeft,
  DATE: Calendar,
  DATETIME: CalendarClock,
  SECTION: Rows3,
  HEADING: Heading,
}
