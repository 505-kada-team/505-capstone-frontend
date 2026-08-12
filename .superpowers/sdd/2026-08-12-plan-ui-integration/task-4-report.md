# Task 4: PlanDetailModal — Wire usePlanDetail + usePlanPromoGroup + useDeletePlanPromo

## Status: DONE

## Commit
- `5ddc48d` — feat: wire PlanDetailModal to usePlanDetail + usePlanPromoGroup + useDeletePlanPromo hooks

## Changes Summary
- Replaced `sonner` + `@/services/api` imports with `usePlanDetail`, `usePlanPromoGroup`, `useDeletePlanPromo` hooks
- Removed manual `useState`/`useEffect`/`useCallback` for plan fetching and mutation (approve/cancel/deleteDiscount)
- Wired `usePlanDetail(isOpen ? planId : null, { onMutationSuccess: onClose })` — auto-fetches when open, auto-closes on success
- Wired `usePlanPromoGroup(plan?.menus)` — replaces inline `useMemo` for promo grouping
- Wired `useDeletePlanPromo(planId, { onDeleted: refetch })` — replaces manual `handleDeleteDiscount`
- Moved `formatDate` and extracted `mapIngredientsFromPlan` as module-level pure helper functions
- Updated JSX: `onClick={approve}`/`reject`, `disabled={isMutating}`, `onApply={refetch}`, `onDelete={() => deletePromo(promoGroup)}`
- Added `planId={planId}` prop to `DiscountDetailModal`

## Verification
- `vite build --mode development` passes (0 errors)
- No remaining `from '@/services/api'` imports in PlanDetailModal
- All hook return values destructured and bound to correct JSX props
