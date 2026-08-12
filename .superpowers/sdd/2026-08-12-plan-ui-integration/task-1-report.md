# Task 1: DiscountModal — Wire usePlanDiscountForm

## What I Implemented

Replaced all local state management in `DiscountModal.jsx` with the `usePlanDiscountForm` hook:

- **Removed imports**: `useState`, `useEffect` from React; `toast` from sonner; `setMenuDiscount`, `deleteMenuDiscount` from `@/services/api`
- **Added import**: `usePlanDiscountForm` from `@/hooks/plan/usePlanDiscount`
- **Removed local state**: `reason`, `date`, `mode`, `globalPercent`, `selectedMenus`, `menuPercents`, `isSubmitting`
- **Removed**: `useEffect` reset logic, `handleSubmit` validation/API logic, local `toggleSelectAll`/`toggleMenu` functions
- **Added**: Hook invocation with destructured state + handlers, thin `handleSubmit` wrapper that calls `submit()` and closes on success
- **Updated**: Per-menu percent `onChange` to use `setMenuPercent(menuId, value)` instead of inline `setMenuPercents` updater

## What I Tested and Results

- **Grep verification**: No `@/services/api` imports remain in DiscountModal.jsx
- **Grep verification**: No `useState`, `useEffect`, or `setMenuPercents` references remain in DiscountModal.jsx
- **Dev server**: Vite starts successfully on port 5199 — component loads without errors
- **Production build**: Fails with pre-existing error — `src/lib/apiError` module (imported by `usePlanDiscount.js`) does not exist yet. This is NOT caused by my changes.

## Files Changed

- `src/pages/admin/production-plan/draft/components/DiscountModal.jsx` — wired to usePlanDiscountForm hook

## Self-Review Findings

1. **All form bindings correctly wired**: reason → setReason, date → setDate, mode → setMode, globalPercent → setGlobalPercent, selectedMenus → toggleMenu, allSelected → toggleSelectAll, menuPercents → setMenuPercent
2. **Component is now pure presentation**: no business logic, validation, or API calls remain
3. **onApply callback**: correctly passed as `onApplied` to the hook; the hook calls `onApplied?.()` on success
4. **Close behavior**: handleSubmit calls `onClose()` only when `submit()` returns true (success)
5. **Pre-existing issue**: `@/lib/apiError` file doesn't exist — needs to be created in a separate task

## Issues / Concerns

- The production build fails due to a missing `src/lib/apiError` module. This is a dependency of the hook (`usePlanDiscount.js` line 4) and must be created as part of a prerequisite task. The dev server works fine since Vite resolves modules lazily at request time.
