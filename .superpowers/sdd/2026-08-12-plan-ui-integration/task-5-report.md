# Task 5: PlanHistoryView — Wire usePlanList

## Status: DONE

## Changes

**File:** `src/pages/admin/production-plan/draft/components/PlanHistoryView.jsx`

- Removed `useEffect`, `useCallback` imports and `getPlanList` from `@/services/api`
- Added `usePlanList` hook import
- Replaced manual `plans`/`isLoadingList`/`fetchPlans` state + effect with `usePlanList()` destructuring `{ plans, isLoading, refetch }`
- Renamed `isLoading` to `isLoadingList` via alias to preserve existing JSX references
- Replaced `handleReload` body with `refetch()` call
- Wired `PlanDetailPane` `onRefreshList` prop to `refetch`
- Kept `selectedPlanId` as local `useState` (UI-only concern)

## Verification

- No legacy `from '@/services/api'` imports remain in the file
- `vite build` passes successfully (no compile errors)

## Commit

`32b6321` — feat: wire PlanHistoryView to usePlanList hook
