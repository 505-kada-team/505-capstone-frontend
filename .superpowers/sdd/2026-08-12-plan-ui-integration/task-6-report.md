# Task 6: ActivePlanPage — Wire useActivePlanOverview

## Status: DONE

## Changes Made

**File:** `src/pages/admin/production-plan/active/ActivePlanPage.jsx`

- Removed `useEffect` from React imports (no longer needed)
- Removed `getPlanList`, `getPlanDetail`, `stopPlan` imports from `@/services/api`
- Added `useActivePlanOverview` import from `@/hooks/plan/usePlanOverview`
- Replaced manual state (`plans`, `activePlanDetail`, `isLoading`, `isStopping`) + `fetchData` + `useEffect` with hook destructuring
- Removed manual `setIsStopping` / try-catch / toast logic from `handleStopPlan`; replaced with simple `stopActivePlan()` call
- Updated `filteredPlans` to exclude active plans (`if (plan.status === 'active') return false`)
- Kept `toast` import (still used for `toast.info` in Detail buttons)
- Kept local UI state: `searchHistory`, `filterStatus`, `isStopDialogOpen`, `useSortable`

## Verification

- `npx vite build` — success (625ms, no errors)
- No `@/services/api` imports remain in the file
- Component renders at `/admin/production-plan/active` as before

## Commit

`c1a16ae` feat: wire ActivePlanPage to useActivePlanOverview hook
