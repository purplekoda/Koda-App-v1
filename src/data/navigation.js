export const sidebarSections = [
  {
    label: 'PLAN',
    items: [
      { id: 'dashboard', name: 'Dashboard', href: '/dashboard', color: '#1D9E75' },
      { id: 'meal-planner', name: 'Meal planner', href: '/meals', color: '#1D9E75' },
      { id: 'grocery-list', name: 'Grocery list', href: '/grocery', color: '#BA7517' },
    ],
  },
  {
    label: 'KITCHEN',
    items: [
      { id: 'pantry-scan', name: 'Pantry scan', href: '/kitchen', color: '#185FA5' },
      { id: 'recipes', name: 'Recipes', href: '/recipes', color: '#7F77DD' },
    ],
  },
]

export const bottomTabs = [
  { id: 'home', name: 'Home', href: '/dashboard', color: '#1D9E75' },
  { id: 'meals', name: 'Meals', href: '/meals', color: '#1D9E75' },
  { id: 'kitchen', name: 'Kitchen', href: '/kitchen', color: '#185FA5' },
  { id: 'recipes', name: 'Recipes', href: '/recipes', color: '#7F77DD' },
]
