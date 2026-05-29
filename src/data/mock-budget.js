// Mock data for the Budget feature in mock mode

export const mockUserBudget = {
  id: 'budget-001',
  user_id: 'mock-user-id',
  weekly_budget: 150.00,
  monthly_budget: 550.00,
  created_at: '2026-05-05T00:00:00Z',
  updated_at: '2026-05-05T00:00:00Z',
}

// Monday of the current mock week
export const MOCK_WEEK_START = '2026-05-11'

export const mockReceipts = [
  {
    id: 'receipt-001',
    user_id: 'mock-user-id',
    week_start: MOCK_WEEK_START,
    total_amount: 52.47,
    store_name: 'Trader Joe\'s',
    entry_type: 'photo',
    image_url: null,
    notes: null,
    created_at: '2026-05-12T10:30:00Z',
  },
  {
    id: 'receipt-002',
    user_id: 'mock-user-id',
    week_start: MOCK_WEEK_START,
    total_amount: 34.90,
    store_name: 'Whole Foods',
    entry_type: 'manual',
    image_url: null,
    notes: 'Picked up missing ingredients',
    created_at: '2026-05-11T18:15:00Z',
  },
]

export const mockReceiptItems = [
  // Items for receipt-001
  { id: 'item-001', receipt_id: 'receipt-001', item_name: 'Organic chicken thighs', quantity: 2, unit_price: 8.99, total_price: 17.98, category: 'Meat', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-002', receipt_id: 'receipt-001', item_name: 'Broccoli florets', quantity: 1, unit_price: 3.49, total_price: 3.49, category: 'Produce', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-003', receipt_id: 'receipt-001', item_name: 'Brown rice (2lb)', quantity: 1, unit_price: 4.99, total_price: 4.99, category: 'Grains', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-004', receipt_id: 'receipt-001', item_name: 'Greek yogurt', quantity: 2, unit_price: 5.49, total_price: 10.98, category: 'Dairy', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-005', receipt_id: 'receipt-001', item_name: 'Olive oil', quantity: 1, unit_price: 7.99, total_price: 7.99, category: 'Pantry', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-006', receipt_id: 'receipt-001', item_name: 'Garlic bulbs (3pk)', quantity: 1, unit_price: 2.49, total_price: 2.49, category: 'Produce', created_at: '2026-05-12T10:30:00Z' },
  { id: 'item-007', receipt_id: 'receipt-001', item_name: 'Mixed salad greens', quantity: 1, unit_price: 4.55, total_price: 4.55, category: 'Produce', created_at: '2026-05-12T10:30:00Z' },
  // Items for receipt-002
  { id: 'item-008', receipt_id: 'receipt-002', item_name: 'Salmon fillet', quantity: 1, unit_price: 14.99, total_price: 14.99, category: 'Seafood', created_at: '2026-05-11T18:15:00Z' },
  { id: 'item-009', receipt_id: 'receipt-002', item_name: 'Lemons (4pk)', quantity: 1, unit_price: 2.99, total_price: 2.99, category: 'Produce', created_at: '2026-05-11T18:15:00Z' },
  { id: 'item-010', receipt_id: 'receipt-002', item_name: 'Heavy cream', quantity: 1, unit_price: 4.49, total_price: 4.49, category: 'Dairy', created_at: '2026-05-11T18:15:00Z' },
  { id: 'item-011', receipt_id: 'receipt-002', item_name: 'Parmesan cheese', quantity: 1, unit_price: 6.99, total_price: 6.99, category: 'Dairy', created_at: '2026-05-11T18:15:00Z' },
  { id: 'item-012', receipt_id: 'receipt-002', item_name: 'Pasta (16oz)', quantity: 2, unit_price: 2.49, total_price: 4.98, category: 'Grains', created_at: '2026-05-11T18:15:00Z' },
  { id: 'item-013', receipt_id: 'receipt-002', item_name: 'Cherry tomatoes', quantity: 1, unit_price: 3.46, total_price: 3.46, category: 'Produce', created_at: '2026-05-11T18:15:00Z' },
]
