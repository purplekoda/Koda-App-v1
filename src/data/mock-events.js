export const mockUpcomingEvents = [
  {
    id: '1',
    title: "Emma's birthday party",
    date: '2026-04-08',
    type: 'birthday',
    color: '#D85A30',
  },
  {
    id: '2',
    title: 'PTA meeting',
    date: '2026-04-02',
    type: 'pta',
    color: '#185FA5',
  },
  {
    id: '3',
    title: 'Soccer tournament',
    date: '2026-04-12',
    type: 'sports',
    color: '#BA7517',
  },
]

// Today's schedule — events with times and color-coded left borders
export const mockTodaySchedule = [
  { id: 's1', title: 'Drop-off', time: '8:00am', shortTime: '8am', color: '#185FA5' },
  { id: 's2', title: 'Dentist', time: '11am', shortTime: '11am', color: '#185FA5' },
  { id: 's3', title: 'Soccer', time: '4:30pm', shortTime: '4:30', color: '#185FA5' },
  { id: 's4', title: 'Party planning', time: '7pm', shortTime: '7pm', color: '#D85A30' },
]

// To-do list split into today and upcoming
export const mockTodos = [
  { id: '1', text: 'Order cake', done: true, category: 'bday', section: 'today' },
  { id: '2', text: 'Send invites', done: false, category: 'bday', section: 'today' },
  { id: '3', text: 'Defrost salmon', done: false, category: 'meals', section: 'today' },
  { id: '4', text: 'PTA bake sale', done: false, category: 'Thu', section: 'upcoming' },
  { id: '5', text: 'Soccer supplies', done: false, category: 'Fri', section: 'upcoming' },
]
