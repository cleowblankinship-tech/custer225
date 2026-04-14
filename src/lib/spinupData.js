export const CATEGORIES = [
  'Bedroom & Linens',
  'Bathroom',
  'Kitchen & Dining',
  'Cleaning',
  'Furniture & Décor',
  'Safety',
  'Outdoor',
  'Electronics',
  'Guest Extras',
  'Launch Tasks',
]

export const SHORT_CAT_NAMES = {
  'Bedroom & Linens': 'Bedroom',
  'Bathroom': 'Bathroom',
  'Kitchen & Dining': 'Kitchen',
  'Cleaning': 'Cleaning',
  'Furniture & Décor': 'Furniture',
  'Safety': 'Safety',
  'Outdoor': 'Outdoor',
  'Electronics': 'Electronics',
  'Guest Extras': 'Extras',
  'Launch Tasks': 'Tasks',
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function isItemDone(item) {
  return item.qty !== null ? item.qtyDone >= item.qty : item.done
}

export function computeSpinUpStats(items) {
  const total = items.length
  const done = items.filter(isItemDone).length
  const remaining = total - done
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const tasks = items.filter(it => it.type === 'task')
  const purchases = items.filter(it => it.type === 'purchase')
  const photoTasks = items.filter(
    it => it.type === 'task' && it.priority === 'high' && !isItemDone(it)
  )
  return {
    total,
    done,
    remaining,
    pct,
    tasksTotal: tasks.length,
    tasksDone: tasks.filter(isItemDone).length,
    purchasesTotal: purchases.length,
    purchasesDone: purchases.filter(isItemDone).length,
    photoTasksRemaining: photoTasks.length,
  }
}

// ── Seed data ─────────────────────────────────────────────────────────────────

let _id = 0
function item(title, category, type, subtype, qty, priority, optional = false) {
  _id++
  return {
    id: 'i' + _id,
    title,
    category,
    type,
    subtype,
    qty: qty,
    qtyDone: 0,
    done: false,
    priority,
    optional,
    notes: '',
  }
}

export const INITIAL_ITEMS = [
  // Bedroom & Linens
  item('Pillows', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'high'),
  item('Mattress protectors', 'Bedroom & Linens', 'purchase', 'inventory', 2, 'high'),
  item('Bed sheet sets (2 per bed)', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'high'),
  item('Duvet inserts / comforters', 'Bedroom & Linens', 'purchase', 'inventory', 2, 'high'),
  item('Duvet covers', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'high'),
  item('Extra blankets', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'medium'),
  item('Extra pillows', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'medium'),
  item('Throw blankets', 'Bedroom & Linens', 'purchase', 'inventory', 2, 'low'),
  item('Decorative pillows', 'Bedroom & Linens', 'purchase', 'inventory', 4, 'low'),

  // Bathroom
  item('Bath towels', 'Bathroom', 'purchase', 'inventory', 8, 'high'),
  item('Hand towels', 'Bathroom', 'purchase', 'inventory', 4, 'high'),
  item('Washcloths', 'Bathroom', 'purchase', 'inventory', 8, 'medium'),
  item('Makeup removal cloths', 'Bathroom', 'purchase', 'inventory', 6, 'medium'),
  item('Bath mats', 'Bathroom', 'purchase', 'inventory', 2, 'high'),
  item('Hot tub towels', 'Bathroom', 'purchase', 'inventory', 4, 'low', true),
  item('Toilet paper (stock)', 'Bathroom', 'purchase', 'consumable', 24, 'high'),
  item('Facial tissues', 'Bathroom', 'purchase', 'consumable', 4, 'medium'),
  item('Hand soap dispensers', 'Bathroom', 'purchase', 'inventory', 2, 'high'),
  item('Shampoo – Ginger Lily Farms', 'Bathroom', 'purchase', 'consumable', 2, 'high'),
  item('Conditioner – Ginger Lily Farms', 'Bathroom', 'purchase', 'consumable', 2, 'high'),
  item('Body wash – Ginger Lily Farms', 'Bathroom', 'purchase', 'consumable', 2, 'high'),
  item('Hand soap refills – Ginger Lily Farms', 'Bathroom', 'purchase', 'consumable', 2, 'high'),

  // Kitchen & Dining
  item('Dinner plates', 'Kitchen & Dining', 'purchase', 'inventory', 8, 'high'),
  item('Salad plates', 'Kitchen & Dining', 'purchase', 'inventory', 8, 'high'),
  item('Bowls', 'Kitchen & Dining', 'purchase', 'inventory', 8, 'high'),
  item('Coffee mugs', 'Kitchen & Dining', 'purchase', 'inventory', 8, 'high'),
  item('Drinking glasses', 'Kitchen & Dining', 'purchase', 'inventory', 8, 'high'),
  item('Wine glasses', 'Kitchen & Dining', 'purchase', 'inventory', 6, 'medium'),
  item('Champagne flutes', 'Kitchen & Dining', 'purchase', 'inventory', 4, 'low'),
  item('Kids cups, plates & utensils', 'Kitchen & Dining', 'purchase', 'inventory', null, 'low'),
  item('Silverware set (service for 8)', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'high'),
  item('Serving spoons', 'Kitchen & Dining', 'purchase', 'inventory', 2, 'medium'),
  item('Spatulas', 'Kitchen & Dining', 'purchase', 'inventory', 2, 'medium'),
  item('Tongs', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Whisk', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Ladle', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Can opener', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Bottle opener', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Wine opener', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Peeler', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Measuring cups', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Measuring spoons', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Mixing bowls', 'Kitchen & Dining', 'purchase', 'inventory', 3, 'medium'),
  item('Cutting boards', 'Kitchen & Dining', 'purchase', 'inventory', 2, 'high'),
  item('Knife set', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'high'),
  item('Kitchen scissors', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Colander', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),
  item('Pot set', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'high'),
  item('Pan set', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'high'),
  item('Baking sheets', 'Kitchen & Dining', 'purchase', 'inventory', 2, 'medium'),
  item('Baking dishes', 'Kitchen & Dining', 'purchase', 'inventory', 2, 'medium'),
  item('Coffee maker', 'Kitchen & Dining', 'purchase', 'appliance', 1, 'high'),
  item('Kettle', 'Kitchen & Dining', 'purchase', 'appliance', 1, 'medium'),
  item('Toaster', 'Kitchen & Dining', 'purchase', 'appliance', 1, 'medium'),
  item('Blender', 'Kitchen & Dining', 'purchase', 'appliance', 1, 'low'),
  item('Slow cooker', 'Kitchen & Dining', 'purchase', 'appliance', 1, 'low'),
  item('Dish drying rack', 'Kitchen & Dining', 'purchase', 'inventory', 1, 'medium'),

  // Cleaning
  item('Dishwasher pods', 'Cleaning', 'purchase', 'consumable', 1, 'high'),
  item('Dish soap', 'Cleaning', 'purchase', 'consumable', 2, 'high'),
  item('Sponges', 'Cleaning', 'purchase', 'consumable', 4, 'high'),
  item('Scrub brush', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Paper towels (stock)', 'Cleaning', 'purchase', 'consumable', 6, 'high'),
  item('Kitchen trash bags', 'Cleaning', 'purchase', 'consumable', 1, 'high'),
  item('Bathroom trash bags', 'Cleaning', 'purchase', 'consumable', 1, 'high'),
  item('Aluminum foil', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Plastic wrap', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Ziploc bags (assorted)', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Salt', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Pepper', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Cooking oil', 'Cleaning', 'purchase', 'consumable', 1, 'medium'),
  item('Food storage containers', 'Cleaning', 'purchase', 'inventory', 1, 'medium'),
  item('Vacuum', 'Cleaning', 'purchase', 'inventory', 1, 'high'),
  item('Broom', 'Cleaning', 'purchase', 'inventory', 1, 'high'),
  item('Dustpan', 'Cleaning', 'purchase', 'inventory', 1, 'high'),
  item('Mop – O-Cedar', 'Cleaning', 'purchase', 'inventory', 1, 'high'),

  // Furniture & Décor
  item('Dining table', 'Furniture & Décor', 'purchase', 'furniture', 1, 'high'),
  item('Dining chairs', 'Furniture & Décor', 'purchase', 'furniture', 4, 'high'),
  item('Bar stools', 'Furniture & Décor', 'purchase', 'furniture', 2, 'medium'),
  item('Accent chairs', 'Furniture & Décor', 'purchase', 'furniture', 2, 'medium'),
  item('Coffee table', 'Furniture & Décor', 'purchase', 'furniture', 1, 'medium'),
  item('Side tables', 'Furniture & Décor', 'purchase', 'furniture', 2, 'medium'),
  item('Hangers', 'Furniture & Décor', 'purchase', 'inventory', 24, 'medium'),
  item('Table lamps', 'Furniture & Décor', 'purchase', 'inventory', 2, 'medium'),
  item('Floor lamps', 'Furniture & Décor', 'purchase', 'inventory', 1, 'medium'),
  item('Light bulbs', 'Furniture & Décor', 'purchase', 'consumable', 12, 'high'),
  item('Mirrors', 'Furniture & Décor', 'purchase', 'inventory', 1, 'medium'),
  item('Entry rug', 'Furniture & Décor', 'purchase', 'inventory', 1, 'medium'),
  item('Bathroom rugs', 'Furniture & Décor', 'purchase', 'inventory', 2, 'high'),

  // Safety
  item('Smoke detectors', 'Safety', 'purchase', 'safety', 2, 'high'),
  item('Carbon monoxide detectors', 'Safety', 'purchase', 'safety', 2, 'high'),
  item('Fire extinguisher', 'Safety', 'purchase', 'safety', 1, 'high'),
  item('First aid kit', 'Safety', 'purchase', 'safety', 1, 'high'),

  // Outdoor
  item('Outdoor chairs', 'Outdoor', 'purchase', 'furniture', 4, 'medium'),
  item('Outdoor table', 'Outdoor', 'purchase', 'furniture', 1, 'medium'),
  item('Fire pit', 'Outdoor', 'purchase', 'furniture', 1, 'low'),
  item('Grill', 'Outdoor', 'purchase', 'appliance', 1, 'medium'),
  item('Grill utensils', 'Outdoor', 'purchase', 'inventory', 1, 'medium'),

  // Electronics
  item('Smart TV', 'Electronics', 'purchase', 'appliance', 1, 'high'),
  item('Streaming device', 'Electronics', 'purchase', 'appliance', 1, 'high'),
  item('Hair dryer', 'Electronics', 'purchase', 'appliance', 1, 'high'),
  item('Hair dryer storage bag', 'Electronics', 'purchase', 'inventory', 1, 'medium'),
  item('Iron', 'Electronics', 'purchase', 'appliance', 1, 'medium'),
  item('Ironing board', 'Electronics', 'purchase', 'inventory', 1, 'medium'),
  item('Backup fans', 'Electronics', 'purchase', 'appliance', 2, 'low'),

  // Guest Extras
  item('Board games', 'Guest Extras', 'purchase', 'inventory', null, 'low'),
  item('Books / reading materials', 'Guest Extras', 'purchase', 'inventory', null, 'low'),
  item('Guest welcome kit', 'Guest Extras', 'purchase', 'inventory', 1, 'medium'),

  // Launch Tasks
  item('Sand spackling & paint touch-ups', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Replace / install floor vent covers', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Hang curtain rods', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Hang blackout curtains', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Identify paint colors on hand', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Buy any missing paint', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Assemble incoming furniture deliveries', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Confirm décor / staging before photos', 'Launch Tasks', 'task', 'staging', null, 'high'),
  item('TV / streaming setup confirmed working', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Wi-Fi / internet confirmed working', 'Launch Tasks', 'task', 'setup', null, 'high'),
  item('Final walk-through before photography', 'Launch Tasks', 'task', 'staging', null, 'high'),
  item('Verify safety devices installed & working', 'Launch Tasks', 'task', 'safety', null, 'high'),
  item('Set up guest welcome items', 'Launch Tasks', 'task', 'staging', null, 'medium'),
  item('Stock coffee & guest consumables', 'Launch Tasks', 'task', 'staging', null, 'high'),
  item('Confirm bathrooms fully stocked', 'Launch Tasks', 'task', 'staging', null, 'high'),
  item('Confirm kitchen fully stocked', 'Launch Tasks', 'task', 'staging', null, 'high'),
]
