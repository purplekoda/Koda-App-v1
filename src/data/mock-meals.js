export const mockWeeklyMeals = [
  {
    day: 'Mon', dayOfWeek: 1, isToday: false,
    meals: [
      { type: 'breakfast', name: 'Overnight oats' },
      { type: 'lunch', name: 'Turkey wrap' },
      { type: 'dinner', name: 'Pasta primavera' },
    ],
  },
  {
    day: 'Tue', dayOfWeek: 2, isToday: true,
    meals: [
      { type: 'breakfast', name: 'Avocado toast' },
      { type: 'lunch', name: 'Chicken salad' },
      { type: 'dinner', name: 'Taco night' },
    ],
  },
  {
    day: 'Wed', dayOfWeek: 3, isToday: false,
    meals: [
      { type: 'breakfast', name: 'Smoothie bowls' },
      { type: 'lunch', name: 'Soup & bread' },
      { type: 'dinner', name: 'Sheet pan salmon' },
    ],
  },
  {
    day: 'Thu', dayOfWeek: 4, isToday: false,
    meals: [
      { type: 'breakfast', name: 'Yogurt parfait' },
      { type: 'lunch', name: 'Leftovers' },
      { type: 'dinner', name: 'Stir fry' },
    ],
  },
  {
    day: 'Fri', dayOfWeek: 5, isToday: false,
    meals: [
      { type: 'breakfast', name: 'Pancakes' },
      { type: 'lunch', name: 'Grilled cheese' },
      { type: 'dinner', name: 'Pizza night' },
    ],
  },
]

export const mockTodayMeals = [
  { type: 'breakfast', name: 'Avocado toast', time: '7:30am' },
  { type: 'lunch', name: 'Chicken salad', time: '12pm' },
  { type: 'dinner', name: 'Taco night', time: '6:30pm' },
]
