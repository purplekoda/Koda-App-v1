/**
 * Canonical grocery store and fulfillment options, shared between settings and the grocery page.
 */

export const GROCERY_STORES = [
  { value: 'walmart',      label: 'Walmart',                           color: '#378ADD', description: 'Everyday staples and groceries' },
  { value: 'kroger',       label: 'Kroger',                            color: '#004990', description: 'Fresh produce and weekly deals' },
  { value: 'costco',       label: 'Costco',                            color: '#7F77DD', description: 'Bulk buying and household staples' },
  { value: 'albertsons',   label: 'Albertsons',                        color: '#E4002B', description: 'Fresh food and weekly specials' },
  { value: 'publix',       label: 'Publix',                            color: '#2D6E37', description: 'Southern staples and fresh deli' },
  { value: 'whole-foods',  label: 'Whole Foods',                       color: '#639922', description: 'Organic and specialty items' },
  { value: 'target',       label: 'Target',                            color: '#CC0000', description: 'Groceries plus household essentials' },
  { value: 'safeway',      label: 'Safeway',                           color: '#E31837', description: 'Everyday grocery staples' },
  { value: 'aldi',         label: 'ALDI',                              color: '#00447C', description: 'Budget-friendly everyday items' },
  { value: 'trader-joes',  label: "Trader Joe's",                      color: '#C3272B', description: 'Unique and seasonal specialty items' },
  { value: 'heb',          label: 'HEB',                               color: '#EE3A24', description: 'Texas fresh produce and local brands' },
  { value: 'meijer',       label: 'Meijer',                            color: '#E31837', description: 'Midwest one-stop grocery shopping' },
  { value: 'winco',        label: 'WinCo',                             color: '#003366', description: 'Bulk and discount grocery staples' },
  { value: 'food-lion',    label: 'Food Lion',                         color: '#F7941D', description: 'Affordable everyday grocery staples' },
  { value: 'shoprite',     label: 'ShopRite',                          color: '#FF0000', description: 'Northeast grocery deals and fresh produce' },
  { value: 'sprouts',      label: 'Sprouts',                           color: '#6B8E23', description: 'Natural and organic fresh foods' },
  { value: 'wegmans',      label: 'Wegmans',                           color: '#004225', description: 'Premium fresh food and prepared meals' },
  { value: 'sams-club',    label: "Sam's Club",                        color: '#007DC6', description: 'Wholesale club shopping' },
  { value: 'amazon',       label: 'Amazon',                            color: '#FF9900', description: 'Online grocery and pantry delivery' },
  { value: 'other',        label: 'Other',                             color: '#888888', description: 'Custom store' },
]

export const FULFILLMENT_OPTIONS = [
  { value: 'delivery',      label: 'Delivery' },
  { value: 'pickup',        label: 'Pickup' },
  { value: 'shop-yourself', label: 'Shop yourself' },
]

export const GROCERY_CATEGORIES = [
  'Produce', 'Meat', 'Dairy', 'Pantry', 'Snacks',
  'Frozen', 'Household', 'Specialty', 'Organic',
]

/** Look up a store's color by value. Falls back to gray. */
export function storeColor(value) {
  return GROCERY_STORES.find(s => s.value === value)?.color ?? '#888888'
}

/** Look up a store's display label by value. */
export function storeLabel(value, otherName) {
  if (value === 'other' && otherName) return otherName
  return GROCERY_STORES.find(s => s.value === value)?.label ?? value
}
