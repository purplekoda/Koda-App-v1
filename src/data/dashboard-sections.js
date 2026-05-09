/**
 * Dashboard section definitions and default layout.
 *
 * section_id   — unique key stored in profiles.dashboard_sections JSONB
 * label        — human-readable name shown in the customization sheet
 * description  — short explanation for the customization sheet
 * is_visible   — default visibility for new users
 * sort_order   — default position (lower = higher on page)
 * canHide      — false means the toggle is disabled (always visible)
 */

export const SECTION_DEFS = [
  {
    section_id: 'todays_meals',
    label: "Today's meals",
    description: 'Shows the meal plan for the current day',
    canHide: false,
  },
  {
    section_id: 'weekly_snapshot',
    label: 'Weekly snapshot',
    description: 'Condensed view of the full week',
  },
  {
    section_id: 'pantry_alerts',
    label: 'Pantry alerts',
    description: 'Items expiring soon or already expired',
  },
  {
    section_id: 'grocery_status',
    label: 'Grocery list status',
    description: 'Items remaining and quick Send list button',
  },
  {
    section_id: 'recipe_suggestions',
    label: 'Recipe suggestions',
    description: 'Koda ideas based on your current pantry',
  },
  {
    section_id: 'budget_tracker',
    label: 'Budget tracker',
    description: 'Weekly grocery spend vs. your budget',
  },
  {
    section_id: 'macro_summary',
    label: 'Macro summary',
    description: 'Household macro status at a glance',
  },
  {
    section_id: 'todo',
    label: 'To do',
    description: 'Your task list',
  },
  {
    section_id: 'today_schedule',
    label: 'Today',
    description: "Today's schedule and events",
  },
]

/**
 * Default layout for new users.
 * Only these five sections are visible; the rest are hidden but discoverable.
 */
export const DEFAULT_SECTIONS = [
  { section_id: 'todays_meals', is_visible: true, sort_order: 0 },
  { section_id: 'weekly_snapshot', is_visible: true, sort_order: 1 },
  { section_id: 'pantry_alerts', is_visible: true, sort_order: 2 },
  { section_id: 'grocery_status', is_visible: true, sort_order: 3 },
  { section_id: 'todo', is_visible: true, sort_order: 4 },
  { section_id: 'today_schedule', is_visible: false, sort_order: 5 },
  { section_id: 'recipe_suggestions', is_visible: false, sort_order: 6 },
  { section_id: 'budget_tracker', is_visible: false, sort_order: 7 },
  { section_id: 'macro_summary', is_visible: false, sort_order: 8 },
]

/** Set of all valid section IDs */
export const VALID_SECTION_IDS = new Set(SECTION_DEFS.map(s => s.section_id))
