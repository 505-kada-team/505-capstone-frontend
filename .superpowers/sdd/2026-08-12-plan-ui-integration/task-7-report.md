# Task 7: DraftPlanPage — Wire planApi.create

**Date:** 2026-08-12  
**Status:** DONE

## Changes Made

### `src/pages/admin/production-plan/draft/DraftPlanPage.jsx`

1. **Replaced imports:**
   - Removed: `import { getMenuDropdown, createPlan } from '@/services/api';`
   - Added: 
     - `import { planApi } from '@/services/plan/plan.api';`
     - `import { getMenuDropdown } from '@/services/api'; // kept temporarily for menu dropdown`

2. **Updated `handleCreatePlan` function:**
   - Changed API call from `createPlan(payload)` to `planApi.create(payload)`
   - Updated response handling to match the envelope format returned by `planApi.create()`
   - Now checks `res?.data?._id` directly (since `planApi.create` unwraps the response envelope)

## Verification

- Build completed successfully (no compile errors)
- All legacy `createPlan` references removed; only `getMenuDropdown` remains temporarily

## Commit

```
0ca32d1 feat: wire DraftPlanPage to planApi.create for plan creation
```
