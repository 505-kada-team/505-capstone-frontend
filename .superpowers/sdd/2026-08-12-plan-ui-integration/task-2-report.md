# Task 2: DiscountDetailModal — Wire useDeletePlanPromo

## What You Implemented
- Updated `DiscountDetailModal.jsx` to use the `useDeletePlanPromo` hook instead of local `isDeleting` state and direct `onDelete` prop calls.
- Added `planId` prop to the component signature.
- Replaced imports: removed `useState` and `toast` from `sonner`, added `useDeletePlanPromo` from `@/hooks/plan/usePlanDiscount`.
- The hook now manages delete state and API calls, with `onDeleted` callback that triggers `onDelete` prop and closes the modal.
- The `handleDelete` function now simply calls `deletePromo(promo)` after confirmation.

## What You Tested and Results
- Ran `npm run lint` to check for compilation errors; no errors in the modified file.
- Verified no legacy imports remain (search for `from '@/services/api'` returned 0 matches in the file).
- The component should compile without errors (no TypeScript, but lint passes).

## Files Changed
- `src/pages/admin/production-plan/draft/components/DiscountDetailModal.jsx`

## Self-Review Findings
- The component now expects `planId` prop; parent components must pass it (to be done in later tasks).
- The `onDelete` prop is now called inside the hook's `onDeleted` callback, which is triggered after successful deletion.
- The `handleDelete` function no longer catches errors; the hook handles toast notifications for success/error.
- The `isDeleting` state is now managed by the hook and used to disable the delete button.

## Commit
- `81d9f41` – `feat: wire DiscountDetailModal to useDeletePlanPromo hook`

## Concerns
- Parent components (PlanDetailPane, PlanDetailModal) need to be updated to pass `planId` prop; this will be done in later tasks.
- The hook's `onDeleted` callback is called after successful deletion; if the parent's `onDelete` prop is undefined, it's safely optional.
- No breaking changes to existing functionality; the component behaves identically from a UI perspective.