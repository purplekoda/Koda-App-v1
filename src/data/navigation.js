export const sidebarSections = [
  {
    label: 'PLAN',
    items: [
      { id: 'dashboard', name: 'Dashboard', href: '/dashboard', color: '#1D9E75' },
      { id: 'meal-planner', name: 'Meal planner', href: '/meals', color: '#1D9E75' },
      { id: 'grocery-list', name: 'Grocery list', href: '/grocery', color: '#BA7517' },
      { id: 'macros', name: 'Macros', href: '/macros', color: '#1D9E75' },
    ],
  },
  {
    label: 'KITCHEN',
    items: [
      { id: 'pantry', name: 'Pantry', href: '/pantry', color: '#1D9E75' },
      { id: 'recipes', name: 'Recipe Box', href: '/recipes', color: '#7F77DD' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [{ id: 'settings', name: 'Settings', href: '/settings', color: '#5F5E5A' }],
  },
];

export const bottomTabs = [
  { id: 'home', name: 'Home', href: '/dashboard', color: '#1D9E75' },
  { id: 'meals', name: 'Meals', href: '/meals', color: '#1D9E75' },
  { id: 'pantry', name: 'Pantry', href: '/pantry', color: '#1D9E75' },
  { id: 'recipes', name: 'Recipe Box', href: '/recipes', color: '#7F77DD' },
  { id: 'settings', name: 'Settings', href: '/settings', color: '#5F5E5A' },
];
