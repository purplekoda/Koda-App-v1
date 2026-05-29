/**
 * Format grocery list items as plain text, organized by store.
 * Used for sharing, clipboard copy, and file download.
 */

/**
 * @param {Array<{ name: string, quantity?: string, status: string, store_assignment?: string }>} items
 * @param {Date|string} [weekStart]
 * @returns {string}
 */
export function formatGroceryListByStore(items, weekStart) {
  const date = weekStart ? new Date(weekStart) : new Date()
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const buyItems = items.filter(i => i.status === 'need' || i.status === 'low')

  const groups = {}
  const noStore = []
  for (const item of buyItems) {
    if (item.store_assignment) {
      if (!groups[item.store_assignment]) groups[item.store_assignment] = []
      groups[item.store_assignment].push(item)
    } else {
      noStore.push(item)
    }
  }

  const sortedStoreIds = Object.keys(groups).sort()

  let text = `Koda Grocery List — Week of ${dateStr}\n\n`

  for (const storeId of sortedStoreIds) {
    text += `${storeId.toUpperCase().replace(/-/g, ' ')}\n`
    for (const item of groups[storeId]) {
      text += `☐ ${formatItemLine(item)}\n`
    }
    text += '\n'
  }

  if (noStore.length > 0) {
    text += 'NO STORE ASSIGNED\n'
    for (const item of noStore) {
      text += `☐ ${formatItemLine(item)}\n`
    }
    text += '\n'
  }

  return text.trimEnd()
}

/**
 * @param {string} storeName  Display name of the store (e.g. "Walmart")
 * @param {Array<{ name: string, quantity?: string }>} items
 * @returns {string}
 */
export function formatSingleStore(storeName, items) {
  let text = `Koda — ${storeName} list\n\n`
  for (const item of items) {
    text += `☐ ${formatItemLine(item)}\n`
  }
  return text.trimEnd()
}

function formatItemLine(item) {
  const qty = item.quantity && item.quantity !== '1' ? ` (${item.quantity})` : ''
  return `${item.name}${qty}`
}
