/**
 * Single source of truth for every section's copy and structured data.
 * Components stay presentational — they receive this data via props
 * instead of hardcoding text, so the same section can be reused with
 * different content later.
 */
import {
  PackageSearch,
  Factory,
  ShoppingCart,
  FileBarChart,
  LineChart,
  ClipboardList,
  ChefHat,
  Milk,
  Coffee,
  CupSoda,
  Package,
  TrendingDown,
  Recycle,
  ShieldCheck,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources' },
];

export const heroStats = {
  totalRevenue: {
    label: 'Total Revenue',
    value: 'Rp 12.500.000',
    change: '+8.3%',
    trend: 'up',
  },
  netRevenue: {
    label: 'Net Revenue',
    value: 'Rp 9.100.000',
  },
};

export const heroLowStock = [
  { name: 'Fresh Milk', detail: '13 L left' },
  { name: 'Coffee Beans', detail: '9.5 kg left' },
];

export const heroTopMenu = [
  { rank: 1, name: 'Coffee Latte', detail: '312 sold' },
  { rank: 2, name: 'Iced Matcha', detail: '184 sold' },
];

export const heroInsight =
  'Inventory is optimized for the week ahead — your next production plan draft is ready for review.';

export const problems = [
  {
    icon: Package,
    title: 'Overstock & Waste',
    description:
      'Ingredients ordered on instinct pile up, expire, and get thrown out before they’re used.',
  },
  {
    icon: Factory,
    title: 'Uncertain Production',
    description:
      'Without a clear read on demand, kitchens guess batch sizes and end up over- or under-producing.',
  },
  {
    icon: PackageSearch,
    title: 'Disconnected Sales & Inventory',
    description:
      'POS data and stock levels live in separate spreadsheets that never quite agree with each other.',
  },
  {
    icon: FileBarChart,
    title: 'Decisions Without Data',
    description:
      'Owners can see revenue, but not which menu items actually drive it or where the margin leaks are.',
  },
];

export const workflowSteps = [
  { label: 'Inventory', icon: PackageSearch },
  { label: 'Recipe', icon: ChefHat },
  { label: 'Production Planning', icon: Factory },
  { label: 'POS', icon: ShoppingCart },
  { label: 'Report', icon: FileBarChart },
  { label: 'Forecast', icon: LineChart },
  { label: 'Next Plan', icon: ClipboardList },
];

export const posFlowSteps = [
  { label: 'Cashier Transaction', icon: ShoppingCart },
  { label: 'Sales Recorded', icon: ClipboardList },
  { label: 'Production Plan Updated', icon: Factory },
  { label: 'Revenue Updated', icon: BarChart3 },
  { label: 'Historical Demand Enriched', icon: FileBarChart },
  { label: 'Future Forecast Improved', icon: LineChart },
];

export const inventoryBatches = [
  {
    name: 'Fresh Milk',
    icon: Milk,
    batchCode: 'Batch #FM-0912',
    expiry: '2026-08-16',
    stock: '13 L',
    status: 'warning',
  },
  {
    name: 'Coffee Beans',
    icon: Coffee,
    batchCode: 'Batch #CB-0904',
    expiry: '2026-09-30',
    stock: '9.5 kg',
    status: 'success',
  },
  {
    name: 'Cups (12oz)',
    icon: CupSoda,
    batchCode: 'Batch #CP-0711',
    expiry: null,
    stock: '480 pcs',
    status: 'success',
  },
];

export const inventoryMovements = [
  {
    item: 'Fresh Milk',
    change: '-6 L',
    reason: 'Production Plan #204',
    date: '2026-08-11',
  },
  {
    item: 'Coffee Beans',
    change: '-1.2 kg',
    reason: 'Production Plan #204',
    date: '2026-08-11',
  },
  {
    item: 'Matcha Powder',
    change: '+5 kg',
    reason: 'Received — PO #118',
    date: '2026-08-09',
  },
];

export const recipeExample = {
  name: 'Coffee Latte',
  ingredientCost: 'Rp 20.000',
  sellingPrice: 'Rp 25.000',
  margin: '20%',
  ingredients: [
    {
      name: 'Fresh Milk',
      amount: '180 ml',
      cost: 'Rp 5.000',
    },
    {
      name: 'Coffee Beans',
      amount: '18 g',
      cost: 'Rp 12.000',
    },
    {
      name: 'Cups (12oz)',
      amount: '1 pc',
      cost: 'Rp 3.000',
    },
  ],
};

export const productionSimulation = {
  menu: 'Coffee Latte',
  quantity: 120,
  requiredIngredients: [
    {
      name: 'Fresh Milk',
      required: '21.6 L',
      available: '13 L',
      sufficient: false,
    },
    {
      name: 'Coffee Beans',
      required: '2.16 kg',
      available: '9.5 kg',
      sufficient: true,
    },
    {
      name: 'Cups (12oz)',
      required: '120 pcs',
      available: '480 pcs',
      sufficient: true,
    },
  ],
  estimatedRevenue: 'Rp 3.000.000',
  expectedMargin: '20%',
};

export const forecastInputs = [
  { label: 'Historical Sales', icon: FileBarChart },
  { label: 'Menu Performance', icon: BarChart3 },
  { label: 'Current Inventory', icon: PackageSearch },
  { label: 'Waste / Shortage History', icon: Recycle },
  { label: 'Discount Impact', icon: TrendingDown },
];

export const nextPlanRecommendation = {
  items: [
    {
      name: 'Coffee Latte',
      quantity: '120 portions',
      change: '+18%',
      trend: 'up',
    },
    {
      name: 'Iced Matcha',
      quantity: '75 portions',
      change: '-8%',
      trend: 'down',
    },
    {
      name: 'Croissant',
      quantity: '45 portions',
      change: '+12%',
      trend: 'up',
    },
  ],
  expectedRevenue: 'Rp 7.250.000',
  suggestedRestock: [
    { item: 'Fresh Milk', amount: '18 L' },
    { item: 'Matcha Powder', amount: '1.5 kg' },
  ],
};

export const aiRecommendation = {
  menu: 'Coffee Latte',
  quantity: '120 portions',
  reasoning:
    'Based on last month’s upward trend and this week’s forecast, demand for Coffee Latte is expected to grow. Current Fresh Milk stock only covers 60% of this quantity.',
};

export const aiDashboardInsight = {
  title: 'Revenue increased 12.4% this week.',
  body:
    'Coffee Latte contributed the highest growth, but Fresh Milk inventory may fall below the next-plan requirement in four days.',
  action: 'Suggested action: restock 18 L of Fresh Milk.',
};

export const chatQuestions = [
  'Which menu performed best this month?',
  'Which ingredients are close to expiry?',
  'Why did profit decrease this week?',
  'How much milk should I prepare for the next production plan?',
];

export const chatAnswer =
  'Coffee Latte led this month with Rp 3.120.000 in revenue. Matcha Powder expires in 4 days — 2.1 kg is still unused. For the next plan, prepare at least 22 L of Fresh Milk based on the forecasted 120 portions.';

export const posStatement =
  'The POS doesn’t end the workflow. It completes the feedback loop.';

export const benefits = [
  {
    icon: Recycle,
    title: 'Reduce Waste',
    description:
      'Batch-level expiry tracking and demand-matched ordering cut spoilage before it happens.',
  },
  {
    icon: ShieldCheck,
    title: 'Plan With Confidence',
    description:
      'Every production plan is checked against real inventory before it’s approved.',
  },
  {
    icon: BarChart3,
    title: 'Understand Performance',
    description:
      'See exactly which menus drive revenue and margin — not just top-line sales.',
  },
  {
    icon: RefreshCw,
    title: 'Improve Every Cycle',
    description:
      'Every sale and production run feeds the next forecast, so plans get sharper over time.',
  },
];