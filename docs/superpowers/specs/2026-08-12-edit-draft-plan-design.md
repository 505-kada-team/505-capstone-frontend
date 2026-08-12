# Edit Draft Plan — Design Spec

## Overview

Add edit functionality for draft production plans. User can edit plan name, dates, and menu items (add/remove/modify quantity) from the PlanDetailPane.

## Entry Point

PlanDetailPane (draft status) → klik Edit button → navigasi ke DraftPlanPage dalam edit mode.

## Changes

### 1. DraftPlanPage.jsx

- Add `editPlanId` state (from URL query param or prop)
- When `editPlanId` is set:
  - Load existing plan via `planApi.detail(editPlanId)` on mount
  - Pre-fill form: planName, startDate, endDate, cart (from plan.menus)
  - Step 1 shows pre-filled name + dates
  - Step 2 shows pre-filled cart, user can add/remove/edit quantities
  - Submit button label: "Update Plan"
  - On submit: `planApi.update(editPlanId, payload)` instead of `planApi.create(payload)`
  - After success: toast + navigate back to history view
- When `editPlanId` is null: existing create flow (unchanged)

### 2. PlanDetailPane.jsx

- Edit button onClick: set state or navigate to DraftPlanPage with edit param
- Replace `toast.info('Edit mode coming soon')` with actual navigation

### 3. No Backend Changes

- `PUT /plan/:id` (A4) already exists
- `planApi.update(id, payload)` already exists
- Payload: `{ name, tags, startDate, duration, menus: [{ menuId, quantityPlanned }] }`

## Data Flow

```
PlanDetailPane (draft) → klik Edit
  → DraftPlanPage (editPlanId=X)
    → useEffect: planApi.detail(X) → pre-fill form
    → user modifies → klik "Update Plan"
    → planApi.update(X, payload) → toast → back to history
```

## Files to Modify

- `src/pages/admin/production-plan/draft/DraftPlanPage.jsx` — add edit mode
- `src/pages/admin/production-plan/components/PlanDetailPane.jsx` — wire edit button

## Verification

1. Click Edit on a draft plan in PlanDetailPane
2. DraftPlanPage opens with pre-filled data
3. Modify name, dates, menu quantities
4. Click "Update Plan" → toast success → back to history
5. Verify changes reflected in plan detail
