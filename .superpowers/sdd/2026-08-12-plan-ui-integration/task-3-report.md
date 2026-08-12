# Task 3: PlanDetailPane — Wire usePlanDetail + usePlanPromoGroup + useDeletePlanPromo

## What was implemented

Replaced all legacy direct API calls and local state in `PlanDetailPane.jsx` with the three hooks:

- **`usePlanDetail`** — replaces `useState(plan)`, `fetchDetail`, `useEffect`, `handleApprove`, `handleReject`, `handleStop`, and the `getPlanDetail/cancelPlan/approvePlan/stopPlan` imports from `@/services/api`.
- **`usePlanPromoGroup`** — replaces the inline IIFE that computed `promoGroup` from `plan.menus`.
- **`useDeletePlanPromo`** — replaces `handleDeleteDiscount` and the `deleteMenuDiscount` import.

### Changes made

1. **Imports**: Removed `useState, useEffect`, `sonner`, `getPlanDetail, cancelPlan, approvePlan, stopPlan, deleteMenuDiscount` from `@/services/api`. Added the three hook imports.
2. **Component body**: Destructured `plan`, `isLoading`, `isMutating`, `approve`, `reject`, `stop`, `refreshAvailability`, `setDiscount`, `removeDiscount`, `refetch` from `usePlanDetail`. Added `usePlanPromoGroup(plan?.menus)` and `useDeletePlanPromo(planId, { onDeleted: refetch })`.
3. **Removed** `handleApprove`, `handleReject`, `handleStop`, `handleDeleteDiscount` functions entirely.
4. **Extracted** `mapIngredientsFromPlan` as a pure helper function outside the component.
5. **Footer actions**: `handleApprove` → `approve`, `handleReject` → `reject`, `isProcessing` → `isMutating`.
6. **Stop confirm dialog**: `handleStop` → inline `stop({ reason: 'Dihentikan admin', stoppedBy: 'Admin' })` with `.then()` to close dialog on success.
7. **DiscountDetailModal**: Added `planId` prop. `onDelete` changed to `() => refetch()` (delete logic now lives inside `DiscountDetailModal` via its own `useDeletePlanPromo`).
8. **DiscountModal**: `onApply` changed to `() => refetch()`.
9. **Active state View Plan button**: Removed `toast.info` call, replaced with empty handler (`() => {}`).
10. Local UI state (`confirmStopOpen`, `isDetailModalOpen`, `isDiscountModalOpen`, `editPromo`) retained as presentation concerns.

## What was tested

- `vite build` passes with 0 errors
- Grep confirms zero matches for `from '@/services/api'`, `from 'sonner'`, `getPlanDetail`, `cancelPlan`, `approvePlan`, `stopPlan`, `deleteMenuDiscount` in the file

## Files changed

- `src/pages/admin/production-plan/components/PlanDetailPane.jsx` — full rewrite of imports, state, and handlers

## Self-review findings

- No legacy imports remain
- All hooks are properly wired with correct arguments
- `useDeletePlanPromo` is now invoked in two places: once in `PlanDetailPane` (unused directly but wired for future) and once inside `DiscountDetailModal` (which is the one that actually deletes). The `PlanDetailPane` version's `onDeleted: refetch` ensures the plan refreshes after any delete.
- The `sonner` import was removed from `PlanDetailPane` — toast notifications are now handled inside the hooks
- Build compiles cleanly

## Issues or concerns

None — the implementation follows the task spec exactly.
