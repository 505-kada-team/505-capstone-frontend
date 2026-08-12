# Plan Entity UI Layer Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all production-plan pages and components from legacy `services/api.js` to modular hooks (`hooks/plan/*`) with clean architecture and separation of concerns.

**Architecture:** Pages compose hooks for data orchestration, components receive data/handlers via props for presentation, hooks encapsulate all data-fetching/mutation/validation logic. Incremental migration bottom-up by dependency order.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, shadcn/ui, react-hook-form + Zod, Zustand, Sonner (toast), Lucide icons, date-fns

## Global Constraints

- Path alias `@` maps to `./src` (vite.config.js)
- No TypeScript — all files are JSX/JS
- UI library: shadcn/ui components in `components/ui/`
- Toast: `sonner` — `toast.success()`, `toast.error()`
- Icons: `lucide-react`
- Style: Tailwind CSS utility classes, no CSS modules
- Format currency: `Rp ${num.toLocaleString('id-ID')}`
- Format date: manual DD Mon YYYY (no date-fns for display in existing code)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/pages/admin/production-plan/draft/components/DiscountModal.jsx` | Wire `usePlanDiscountForm` hook, remove local form state |
| Modify | `src/pages/admin/production-plan/draft/components/DiscountDetailModal.jsx` | Wire `useDeletePlanPromo` hook, accept `planId` prop |
| Modify | `src/pages/admin/production-plan/components/PlanDetailPane.jsx` | Wire `usePlanDetail` + `usePlanPromoGroup` + `useDeletePlanPromo`, remove legacy API |
| Modify | `src/pages/admin/production-plan/draft/components/PlanDetailModal.jsx` | Wire `usePlanDetail` + `usePlanPromoGroup` + `useDeletePlanPromo`, remove legacy API |
| Modify | `src/pages/admin/production-plan/draft/components/PlanHistoryView.jsx` | Wire `usePlanList`, remove legacy `getPlanList` |
| Modify | `src/pages/admin/production-plan/active/ActivePlanPage.jsx` | Wire `useActivePlanOverview`, remove legacy API |
| Modify | `src/pages/admin/production-plan/draft/DraftPlanPage.jsx` | Wire `planApi.create`, remove legacy `createPlan`/`getMenuDropdown` |

---

### Task 1: DiscountModal — Wire `usePlanDiscountForm`

**Files:**
- Modify: `src/pages/admin/production-plan/draft/components/DiscountModal.jsx`

**Interfaces:**
- Consumes: `usePlanDiscountForm` from `@/hooks/plan/usePlanDiscount` — returns `{ reason, setReason, date, setDate, mode, setMode, globalPercent, setGlobalPercent, selectedMenus, toggleMenu, toggleSelectAll, allSelected, menuPercents, setMenuPercent, isSubmitting, submit }`
- Produces: Same component API — `{ isOpen, onClose, plan, initialSelectedMenuId, editPromo, onApply }` props unchanged

- [ ] **Step 1: Read current DiscountModal**

Read `src/pages/admin/production-plan/draft/components/DiscountModal.jsx` to understand current structure.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { setMenuDiscount, deleteMenuDiscount } from '@/services/api';
```

Add:
```js
import { usePlanDiscountForm } from '@/hooks/plan/usePlanDiscount';
```

- [ ] **Step 3: Replace component body**

Replace the entire component body. Remove all local state (`reason`, `date`, `mode`, `globalPercent`, `selectedMenus`, `menuPercents`, `isSubmitting`), the `useEffect` reset, `toggleSelectAll`, `toggleMenu`, and `handleSubmit`. Replace with:

```jsx
export default function DiscountModal({ isOpen, onClose, plan, initialSelectedMenuId, editPromo, onApply }) {
  const {
    reason, setReason,
    date, setDate,
    mode, setMode,
    globalPercent, setGlobalPercent,
    selectedMenus, toggleMenu, toggleSelectAll, allSelected,
    menuPercents, setMenuPercent,
    isSubmitting, submit,
  } = usePlanDiscountForm({ isOpen, plan, editPromo, initialSelectedMenuId, onApplied: onApply });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await submit();
    if (ok) onClose();
  };

  if (!isOpen) return null;

  const minDate = plan?.startDate
    ? new Date(Math.max(new Date().getTime(), new Date(plan.startDate).getTime()))
    : new Date();
  const maxDate = plan?.endDate ? new Date(plan.endDate) : undefined;

  return (
    // ... JSX unchanged, just wire state to form elements
  );
}
```

- [ ] **Step 4: Wire form state to JSX**

In the JSX, ensure all form bindings use the hook state:
- `<Input value={reason} onChange={e => setReason(e.target.value)} />` — already correct
- Date picker: `<Calendar selected={date} onSelect={setDate} />` — already correct
- Tabs: `<Tabs value={mode} onValueChange={setMode}>` — already correct
- Global percent: `<Input value={globalPercent} onChange={e => setGlobalPercent(e.target.value)} />` — already correct
- Checkbox: `<Checkbox checked={selectedMenus[menu.menuId] || false} onCheckedChange={() => toggleMenu(menu.menuId)} />` — already correct
- Select all: `<Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />` — already correct
- Per-menu percent: `<Input value={menuPercents[menu.menuId] || ''} onChange={e => setMenuPercent(menu.menuId, e.target.value)} />` — already correct

- [ ] **Step 5: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 6: Smoke test**

Open DraftPlanPage → create a plan → open DiscountModal → verify:
- Form renders with menus list
- Can select/deselect menus
- Can toggle sama_rata/beda_per_menu
- Submit saves and closes modal

---

### Task 2: DiscountDetailModal — Wire `useDeletePlanPromo`

**Files:**
- Modify: `src/pages/admin/production-plan/draft/components/DiscountDetailModal.jsx`

**Interfaces:**
- Consumes: `useDeletePlanPromo` from `@/hooks/plan/usePlanDiscount` — returns `{ isDeleting, deletePromo }`
- Produces: Props change — now requires `planId` in addition to `{ isOpen, onClose, promo, onEdit, onDelete }`

- [ ] **Step 1: Read current DiscountDetailModal**

Read `src/pages/admin/production-plan/draft/components/DiscountDetailModal.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { useState } from 'react';
import { toast } from 'sonner';
```

Add:
```js
import { useDeletePlanPromo } from '@/hooks/plan/usePlanDiscount';
```

- [ ] **Step 3: Replace component body**

```jsx
export default function DiscountDetailModal({ isOpen, onClose, planId, promo, onEdit, onDelete }) {
  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, {
    onDeleted: () => {
      onDelete?.();
      onClose();
    },
  });

  if (!isOpen || !promo) return null;

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus promo diskon ini dari semua menu terkait?')) {
      await deletePromo(promo);
    }
  };

  return (
    // ... JSX unchanged
  );
}
```

- [ ] **Step 4: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 5: Update callers to pass `planId`**

In `PlanDetailPane.jsx` and `PlanDetailModal.jsx`, the DiscountDetailModal usage must include `planId` prop. This will be done in Task 3 and Task 4, but for now verify the component compiles.

- [ ] **Step 6: Smoke test**

Open a plan with discount → click "Lihat Diskon" → DiscountDetailModal opens → click "Hapus Promo" → confirm → verify discount is removed.

---

### Task 3: PlanDetailPane — Wire `usePlanDetail` + `usePlanPromoGroup` + `useDeletePlanPromo`

**Files:**
- Modify: `src/pages/admin/production-plan/components/PlanDetailPane.jsx`

**Interfaces:**
- Consumes: `usePlanDetail(planId, { onMutationSuccess })` from `@/hooks/plan/usePlanDetail`
- Consumes: `usePlanPromoGroup(plan?.menus)` from `@/hooks/plan/usePlanPromoGroup`
- Consumes: `useDeletePlanPromo(planId, { onDeleted })` from `@/hooks/plan/usePlanDiscount`
- Produces: Props unchanged — `{ planId, onRefreshList }`

- [ ] **Step 1: Read current PlanDetailPane**

Read `src/pages/admin/production-plan/components/PlanDetailPane.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPlanDetail, cancelPlan, approvePlan, stopPlan } from '@/services/api';
import { deleteMenuDiscount } from '@/services/api';
```

Add:
```js
import { usePlanDetail } from '@/hooks/plan/usePlanDetail';
import { usePlanPromoGroup } from '@/hooks/plan/usePlanPromoGroup';
import { useDeletePlanPromo } from '@/hooks/plan/usePlanDiscount';
```

- [ ] **Step 3: Replace state and effects in component body**

Remove all local state and effects:
```js
// REMOVE these:
const [plan, setPlan] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [confirmStopOpen, setConfirmStopOpen] = useState(false);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
const [editPromo, setEditPromo] = useState(null);

const fetchDetail = async () => { ... };
useEffect(() => { fetchDetail(); }, [planId]);
```

Replace with:
```jsx
export default function PlanDetailPane({ planId, onRefreshList }) {
  const {
    plan, isLoading, isMutating,
    approve, reject, stop, refreshAvailability,
    setDiscount, removeDiscount, refetch,
  } = usePlanDetail(planId, { onMutationSuccess: onRefreshList });

  const promoGroup = usePlanPromoGroup(plan?.menus);
  const hasPlanDiscount = !!promoGroup;

  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, { onDeleted: refetch });

  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
```

Note: Keep `confirmStopOpen`, `isDetailModalOpen`, `isDiscountModalOpen`, `editPromo` as local UI state — these are presentation concerns.

- [ ] **Step 4: Remove helper functions that are now in hooks**

Remove these functions entirely:
```js
// REMOVE:
const handleApprove = async () => { ... };
const handleReject = async () => { ... };
const handleStop = async () => { ... };
const handleDeleteDiscount = async (promo) => { ... };
```

Replace `handleApprove` with `approve()` call in JSX onClick.
Replace `handleReject` with `reject()` call in JSX onClick.
Replace `handleStop` with `stop({ reason: 'Dihentikan admin', stoppedBy: 'Admin' })` call.
Replace `handleDeleteDiscount` with `deletePromo` call.

- [ ] **Step 5: Remove ingredient mapping and promoGroup derivation**

Remove:
```js
// REMOVE:
const ingredientsSource = plan.status === 'draft' ? plan.checkResult : plan.committedIngredients;
const mappedIngredients = (ingredientsSource || []).map(ing => { ... });
const badgeVariant = deriveBadgeVariant(plan);
const isDraft = plan.status === 'draft';
const isActive = plan.status === 'active';
const totalTarget = plan.menus?.reduce(...);
const promoGroup = (() => { ... })();
const hasPlanDiscount = !!promoGroup;
```

These are now handled by:
- `deriveBadgeVariant` → keep as local helper (pure function, not a hook concern)
- `isDraft`, `isActive` → derive from `plan.status`
- `totalTarget` → derive inline or keep as local helper
- `promoGroup` → `usePlanPromoGroup(plan?.menus)` (already added)
- `mappedIngredients` → extract to a pure helper function `mapIngredientsFromPlan(plan)` at the bottom of the file

- [ ] **Step 6: Create pure helper for ingredient mapping**

Add at the bottom of the file (before export or after, as a module-level function):

```js
function mapIngredientsFromPlan(plan) {
  if (!plan) return [];
  const ingredientsSource = plan.status === 'draft' ? plan.checkResult : plan.committedIngredients;
  return (ingredientsSource || []).map(ing => {
    let currentAvailable;
    let isUnsafe;
    let earliestExpiry = null;

    if (plan.status === 'draft') {
      isUnsafe = ing.hasUnsafeBatch;
      currentAvailable = ing.availableQuantity;
      if (ing.eligibleBatches?.length > 0) {
        earliestExpiry = ing.eligibleBatches[0].expired;
      }
    } else {
      currentAvailable = ing.batches?.reduce((sum, b) => sum + (b.quantityUsed || 0), 0) || 0;
      isUnsafe = ing.batches?.some(b => b.batchSafetyStatus === 'unsafe') || false;
      if (ing.batches?.length > 0) {
        earliestExpiry = ing.batches[0].expired || null;
      }
    }

    const shortage = ing.quantityNeeded > currentAvailable ? (ing.quantityNeeded - currentAvailable) : 0;

    return {
      name: ing.nameInventory,
      needed: `${ing.quantityNeeded} kg`,
      available: `${currentAvailable} kg`,
      status: isUnsafe ? 'tidak aman' : 'aman',
      shortage: shortage > 0 ? `${shortage} kg` : '-',
      expired: earliestExpiry ? formatDate(earliestExpiry) : '-/-/-',
    };
  });
}
```

- [ ] **Step 7: Update JSX to use hook returns**

Update the footer actions:
```jsx
// OLD:
<Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleReject} disabled={isProcessing}>
  Reject
</Button>
<Button className="bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white" onClick={handleApprove} disabled={isProcessing || !plan.readyToApprove || plan.checkResultStale}>
  <CheckCircle className="w-4 h-4 mr-2" />
  Accept
</Button>

// NEW:
<Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={reject} disabled={isMutating}>
  Reject
</Button>
<Button className="bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white" onClick={approve} disabled={isMutating || !plan.readyToApprove || plan.checkResultStale}>
  <CheckCircle className="w-4 h-4 mr-2" />
  Accept
</Button>
```

Update stop handler:
```jsx
// OLD: onClick={handleStop}
// NEW: onClick={() => stop({ reason: 'Dihentikan admin', stoppedBy: 'Admin' })}
```

Update discount delete:
```jsx
// OLD: onDelete={handleDeleteDiscount}
// NEW: onDelete={deletePromo}
```

Update DiscountDetailModal to pass planId:
```jsx
// OLD:
<DiscountDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => setIsDetailModalOpen(false)}
  promo={promoGroup}
  onEdit={handleEditDiscount}
  onDelete={handleDeleteDiscount}
/>

// NEW:
<DiscountDetailModal
  isOpen={isDetailModalOpen}
  onClose={() => setIsDetailModalOpen(false)}
  planId={planId}
  promo={promoGroup}
  onEdit={handleEditDiscount}
  onDelete={() => refetch()}
/>
```

- [ ] **Step 8: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 9: Smoke test**

Open PlanHistoryView → select a draft plan → verify:
- Plan detail loads with correct header, status badge, menus
- Approve/Reject buttons work
- Stop plan dialog works
- Discount modal opens and saves
- Discount detail modal shows and delete works

---

### Task 4: PlanDetailModal — Wire `usePlanDetail` + `usePlanPromoGroup` + `useDeletePlanPromo`

**Files:**
- Modify: `src/pages/admin/production-plan/draft/components/PlanDetailModal.jsx`

**Interfaces:**
- Consumes: Same hooks as Task 3
- Produces: Props unchanged — `{ isOpen, onClose, planId }`

- [ ] **Step 1: Read current PlanDetailModal**

Read `src/pages/admin/production-plan/draft/components/PlanDetailModal.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { toast } from 'sonner';
import { getPlanDetail, approvePlan, cancelPlan, deleteMenuDiscount } from '@/services/api';
```

Add:
```js
import { usePlanDetail } from '@/hooks/plan/usePlanDetail';
import { usePlanPromoGroup } from '@/hooks/plan/usePlanPromoGroup';
import { useDeletePlanPromo } from '@/hooks/plan/usePlanDiscount';
```

- [ ] **Step 3: Replace state and effects**

Remove:
```js
const [plan, setPlan] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const fetchPlanDetail = useCallback(async () => { ... }, [planId]);
useEffect(() => { ... }, [isOpen, planId, fetchPlanDetail]);
```

Replace with:
```jsx
export default function PlanDetailModal({ isOpen, onClose, planId }) {
  const {
    plan, isLoading, isMutating,
    approve, reject, refetch,
  } = usePlanDetail(isOpen ? planId : null, { onMutationSuccess: onClose });

  const promoGroup = usePlanPromoGroup(plan?.menus);
  const hasDiscount = !!promoGroup;

  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, { onDeleted: refetch });

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
```

Note: `usePlanDetail` receives `isOpen ? planId : null` so it only fetches when modal is open. `onMutationSuccess: onClose` auto-closes modal after approve/reject.

- [ ] **Step 4: Remove manual functions**

Remove:
```js
const handleApplyDiscount = () => { fetchPlanDetail(); };
const handleAccept = async () => { ... };
const handleHapus = async () => { ... };
const handleDeleteDiscount = async (promo) => { ... };
```

In JSX:
- `handleAccept` → `approve` (hook auto-closes via `onMutationSuccess: onClose`)
- `handleHapus` → `reject` (hook auto-closes via `onMutationSuccess: onClose`)
- `handleDeleteDiscount` → `deletePromo`
- `handleApplyDiscount` → `refetch`

- [ ] **Step 5: Remove promoGroup derivation**

Remove the `useMemo` for `promoGroup` — now provided by `usePlanPromoGroup(plan?.menus)`.

Keep `dateRangeStr` useMemo as it's presentation logic.

- [ ] **Step 6: Remove ingredient mapping**

Remove the `useMemo` for `mappedIngredients`. Extract `mapIngredientsFromPlan(plan)` as a pure helper (same as Task 3 Step 6, or import from a shared util if both files need it — for now, duplicate in each file is acceptable).

- [ ] **Step 7: Update JSX bindings**

- Loading state: `isLoading || !plan` → same, hook provides `isLoading`
- Approve button: `onClick={handleAccept}` → `onClick={approve}`, `disabled={isProcessing}` → `disabled={isMutating}`
- Reject button: `onClick={handleHapus}` → `onClick={reject}`, `disabled={isProcessing}` → `disabled={isMutating}`
- DiscountModal: `onApply={handleApplyDiscount}` → `onApply={refetch}`
- DiscountDetailModal: add `planId={planId}`, `onDelete={deletePromo}`

- [ ] **Step 8: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 9: Smoke test**

Create a plan from DraftPlanPage → PlanDetailModal opens → verify:
- Plan detail loads correctly
- Discount can be added/removed
- Accept/Remove buttons work
- Modal closes after action

---

### Task 5: PlanHistoryView — Wire `usePlanList`

**Files:**
- Modify: `src/pages/admin/production-plan/draft/components/PlanHistoryView.jsx`

**Interfaces:**
- Consumes: `usePlanList(params)` from `@/hooks/plan/usePlanList` — returns `{ plans, isLoading, refetch }`
- Produces: Props unchanged — `{ onNavigateToCreate }`

- [ ] **Step 1: Read current PlanHistoryView**

Read `src/pages/admin/production-plan/draft/components/PlanHistoryView.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { useState, useEffect, useCallback } from 'react';
import { getPlanList } from '@/services/api';
```

Add:
```js
import { usePlanList } from '@/hooks/plan/usePlanList';
```

- [ ] **Step 3: Replace state and effects**

Remove:
```js
const [plans, setPlans] = useState([]);
const [isLoadingList, setIsLoadingList] = useState(false);
const [selectedPlanId, setSelectedPlanId] = useState(null);

const fetchPlans = useCallback(async (showLoading = true) => { ... }, []);
useEffect(() => { ... }, [fetchPlans]);
```

Replace with:
```jsx
export default function PlanHistoryView({ onNavigateToCreate }) {
  const { plans, isLoading: isLoadingList, refetch } = usePlanList();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
```

- [ ] **Step 4: Update handlers**

Remove `handleReload` function. Replace with:
```jsx
const handleReload = () => refetch();
```

- [ ] **Step 5: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 6: Smoke test**

DraftPlanPage → click "Plan History" → verify:
- Plan list loads with cards
- Can select a plan → detail shows in right pane
- Reload button works
- "Create Plan" button navigates back

---

### Task 6: ActivePlanPage — Wire `useActivePlanOverview`

**Files:**
- Modify: `src/pages/admin/production-plan/active/ActivePlanPage.jsx`

**Interfaces:**
- Consumes: `useActivePlanOverview()` from `@/hooks/plan/usePlanOverview` — returns `{ plans, activePlanDetail, isLoading, isStopping, stopActivePlan, refetch }`
- Produces: Page renders at `/admin/production-plan/active`

- [ ] **Step 1: Read current ActivePlanPage**

Read `src/pages/admin/production-plan/active/ActivePlanPage.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPlanList, getPlanDetail, stopPlan } from '@/services/api';
```

Add:
```js
import { useActivePlanOverview } from '@/hooks/plan/usePlanOverview';
```

Keep `useSortable` import — it's a local presentation concern.

- [ ] **Step 3: Replace state and effects**

Remove:
```js
const [plans, setPlans] = useState([]);
const [activePlanDetail, setActivePlanDetail] = useState(null);
const [isLoading, setIsLoading] = useState(true);

const fetchData = async () => { ... };
useEffect(() => { fetchData(); }, []);
```

Replace with:
```jsx
export default function ActivePlanPage() {
  const navigate = useNavigate();
  const {
    plans,
    activePlanDetail,
    isLoading,
    isStopping,
    stopActivePlan,
    refetch,
  } = useActivePlanOverview();

  const [searchHistory, setSearchHistory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { sortBy, setSortBy, sortData } = useSortable('date_newest');
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
```

Note: `searchHistory`, `filterStatus`, `sortBy`, `isStopDialogOpen` are local UI state — keep them.

- [ ] **Step 4: Remove handleStopPlan**

Remove:
```js
const handleStopPlan = async () => { ... };
```

Replace with:
```jsx
const handleStopPlan = async () => {
  const result = await stopActivePlan({ reason: 'Dihentikan manual' });
  if (result?.ok) {
    setIsStopDialogOpen(false);
  }
};
```

- [ ] **Step 5: Update filteredPlans**

The `filteredPlans` computation uses `plans` — this now comes from the hook. The filter excludes active plan from history:
```jsx
const filteredPlans = sortData(plans.filter(plan => {
  if (plan.status === 'active') return false; // exclude active from history
  const matchSearch = plan.name.toLowerCase().includes(searchHistory.toLowerCase());
  const matchStatus = filterStatus === 'all' || plan.status === filterStatus;
  return matchSearch && matchStatus;
}));
```

- [ ] **Step 6: Update stop confirm dialog**

```jsx
<ConfirmDialog
  open={isStopDialogOpen}
  onClose={() => setIsStopDialogOpen(false)}
  onConfirm={handleStopPlan}
  title="Stop this plan?"
  description="The active plan will be stopped permanently. No more production can be added to this plan."
  confirmLabel="Stop Plan"
  cancelLabel="Cancel"
  loading={isStopping}
  variant="destructive"
/>
```

- [ ] **Step 7: Verify no legacy imports remain**

Search file for `from '@/services/api'` — should return 0 matches.

- [ ] **Step 8: Smoke test**

Navigate to `/admin/production-plan/active` → verify:
- Active plan tracking table shows with menus, progress bars, profit
- "Active" badge with pulsing indicator shows
- Plan History table loads below
- Search/filter/sort work
- Stop Plan dialog works
- Empty state shows when no active plan
- "Add Plan" button navigates to draft page

---

### Task 7: DraftPlanPage — Wire `planApi.create`

**Files:**
- Modify: `src/pages/admin/production-plan/draft/DraftPlanPage.jsx`

**Interfaces:**
- Consumes: `planApi.create(payload)` from `@/services/plan/plan.api`
- Consumes: `getMenuDropdown` from `@/services/api` (kept temporarily — menu dropdown is not a plan entity)
- Produces: Page renders at `/admin/production-plan/draft`

- [ ] **Step 1: Read current DraftPlanPage**

Read `src/pages/admin/production-plan/draft/DraftPlanPage.jsx`.

- [ ] **Step 2: Replace imports**

Remove:
```js
import { getMenuDropdown, createPlan } from '@/services/api';
```

Add:
```js
import { planApi } from '@/services/plan/plan.api';
import { getMenuDropdown } from '@/services/api'; // kept temporarily for menu dropdown
```

- [ ] **Step 3: Replace createPlan call**

In `handleCreatePlan`, replace:
```js
// OLD:
const res = await createPlan(payload);
if (res.data?.success) {
  toast.success(res.data.message);
  setCreatedPlanId(res.data.data._id);
}

// NEW:
const res = await planApi.create(payload);
if (res?.data?._id) {
  toast.success(res.message || 'Plan created');
  setCreatedPlanId(res.data._id);
} else {
  toast.error('Failed to create draft plan');
}
```

Note: `planApi.create()` returns the envelope directly (already unwrapped by `.then(res => res.data)` in plan.api.js), so the shape is `{ data: planObject, message }`.

- [ ] **Step 4: Verify no legacy `createPlan` import remains**

Search file for `createPlan` — should only appear in comments if any.

- [ ] **Step 5: Smoke test**

DraftPlanPage → fill plan name + dates → Next → add menus → Create Plan → verify:
- Plan is created successfully
- PlanDetailModal opens with the new plan
- Can navigate to Plan History → see the new plan in list

---

## Execution Order

```
Task 1: DiscountModal          (independent)
Task 2: DiscountDetailModal    (independent)
Task 3: PlanDetailPane         (depends on Task 1, 2)
Task 4: PlanDetailModal        (depends on Task 1, 2)
Task 5: PlanHistoryView        (depends on Task 3)
Task 6: ActivePlanPage         (independent of 1-5, uses useActivePlanOverview)
Task 7: DraftPlanPage          (depends on Task 5 for history view)
```

Tasks 1, 2, and 6 can run in parallel. Tasks 3 and 4 can run in parallel after 1+2 complete. Task 5 after 3. Task 7 after 5.

## Post-Migration Verification

After all tasks complete:
1. Navigate to `/admin/production-plan/active` — verify active plan loads, history loads, stop works
2. Navigate to `/admin/production-plan/draft` — verify create wizard works, plan history view works
3. Create a plan → verify modal shows → approve → verify it appears in active page
4. Add discount → verify discount modal, discount detail, delete discount all work
5. Search `from '@/services/api'` in production-plan directory — should only appear in `DraftPlanPage.jsx` for `getMenuDropdown`
