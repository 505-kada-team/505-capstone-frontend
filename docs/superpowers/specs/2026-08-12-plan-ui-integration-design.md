# Design: Plan Entity UI Layer Integration

## Overview

Migrasi seluruh halaman dan komponen production-plan dari legacy monolithic `services/api.js` ke modular hooks (`hooks/plan/*`) + service layer (`services/plan/*`). Implementasi incremental per component, menerapkan clean architecture dan separation of concerns.

## Scope

**Target (Phase 1 — ini):**
- `ActivePlanPage` — page utama active plan
- `DraftPlanPage` — page wizard create plan + history view
- `PlanDetailPane` — shared component (right-pane detail)
- `PlanDetailModal` — modal detail setelah create plan
- `PlanHistoryView` — split-pane history + detail
- `DiscountModal` — modal form diskon
- `DiscountDetailModal` — modal detail diskon

**Out of scope:**
- `PlanReportPage` + semua report components (Phase 2)
- `PlanMenuAccordion`, `PlanListCard` — sudah clean, tidak perlu diubah

## Architecture Decisions

### 1. Hook-first Data Flow

Setiap page/component Yang sekarang memanggil `getPlanList()`, `getPlanDetail()`, `approvePlan()`, `stopPlan()`, `cancelPlan()`, `setMenuDiscount()`, `deleteMenuDiscount()` secara langsung dari `services/api.js` akan DIUBAH menggunakan hooks yang sudah ada:

| Legacy Call | Replacement Hook | Source |
|---|---|---|
| `getPlanList()` | `usePlanList()` | `hooks/plan/usePlanList.js` |
| `getPlanDetail(id)` | `usePlanDetail(id)` | `hooks/plan/usePlanDetail.js` |
| `approvePlan(id)` | `usePlanDetail(id).approve()` | `hooks/plan/usePlanDetail.js` |
| `cancelPlan(id)` | `usePlanDetail(id).reject()` | `hooks/plan/usePlanDetail.js` |
| `stopPlan(id, payload)` | `usePlanDetail(id).stop(payload)` | `hooks/plan/usePlanDetail.js` |
| `setMenuDiscount(...)` | `usePlanDiscountForm().submit()` | `hooks/plan/usePlanDiscount.js` |
| `deleteMenuDiscount(...)` | `useDeletePlanPromo().deletePromo()` | `hooks/plan/usePlanDiscount.js` |
| Active plan compose | `useActivePlanOverview()` | `hooks/plan/usePlanOverview.js` |
| Promo group derive | `usePlanPromoGroup(menus)` | `hooks/plan/usePlanPromoGroup.js` |

### 2. Separation of Concerns per Component

**Pages** = orchestration layer (compose hooks, manage routing, render layout)
**Components** = presentation (receive data/handlers via props, render UI)
**Hooks** = data + business logic (fetch, mutate, validate, derive)
**Services** = HTTP + normalization (api → mapper → hooks)

### 3. Shared Component Contracts

`PlanDetailPane` dan `PlanDetailModal` menerima `planId` sebagai prop, lalu internally use `usePlanDetail(planId)`. Tidak ada perubahan pada API props mereka — parent tetap pass `planId`.

`DiscountModal` menerima `plan` object + `editPromo` + `onApply` callback. Internal state dipindah ke `usePlanDiscountForm`.

`DiscountDetailModal` menerima `promo` object + `onEdit`/`onDelete` callbacks. Delete logic dipindah ke `useDeletePlanPromo`.

### 4. Mapper Contract

Semua data dari hooks SUDAH di-map melalui `plan.mapper.js`. Field names yang dipakai UI:
- `plan.menus[].name`, `plan.menus[].quantityPlanned`, `plan.menus[].discount.discountPercentage`, dst.
- `plan.checkResult[]` (draft only) — untuk ingredients
- `plan.committedIngredients[]` (non-draft) — untuk ingredients
- `plan.readyToApprove`, `plan.checkResultStale`, `plan.hasPendingLossReplacement`

## Component Migration Plan

### FASE 1: Independent Modals (no dependencies)

#### 1A. DiscountModal → `usePlanDiscountForm`
**File:** `src/pages/admin/production-plan/draft/components/DiscountModal.jsx`
**Changes:**
- Import `usePlanDiscountForm` from `@/hooks/plan/usePlanDiscount`
- Hapus state lokal: `reason`, `date`, `mode`, `globalPercent`, `selectedMenus`, `menuPercents`, `isSubmitting`
- Hapus `useEffect` reset form
- Hapus `handleSubmit` function
- Ganti dengan: `const form = usePlanDiscountForm({ isOpen, plan, editPromo, initialSelectedMenuId, onApplied: onApply })`
- Render: bind semua `form.*` ke props相应的 form elements
- `onSubmit` → `form.submit()`

#### 1B. DiscountDetailModal → `useDeletePlanPromo`
**File:** `src/pages/admin/production-plan/draft/components/DiscountDetailModal.jsx`
**Changes:**
- Import `useDeletePlanPromo` from `@/hooks/plan/usePlanDiscount`
- Terima `planId` sebagai prop baru (dari parent yang punya plan._id)
- Hapus `isDeleting` state, ganti dengan `const { isDeleting, deletePromo } = useDeletePlanPromo(planId, { onDeleted: () => { onClose(); onDelete?.(); } })`
- `handleDelete` → `deletePromo(promo)`

### FASE 2: Detail Components (depends on modals)

#### 2A. PlanDetailPane → `usePlanDetail` + `usePlanPromoGroup`
**File:** `src/pages/admin/production-plan/components/PlanDetailPane.jsx`
**Changes:**
- Import `usePlanDetail` from `@/hooks/plan/usePlanDetail`
- Import `usePlanPromoGroup` from `@/hooks/plan/usePlanPromoGroup`
- Hapus: `useState` untuk plan, isLoading, isProcessing
- Hapus: `getPlanDetail`, `cancelPlan`, `approvePlan`, `stopPlan`, `deleteMenuDiscount` imports
- Hapus: `fetchDetail`, `handleApprove`, `handleReject`, `handleStop` functions
- Hapus: `mappedIngredients` computation, `promoGroup` computation

Ganti dengan:
```js
const { plan, isLoading, isMutating, approve, reject, stop, setDiscount, removeDiscount, refetch } = usePlanDetail(planId, { onMutationSuccess: onRefreshList });
const promoGroup = usePlanPromoGroup(plan?.menus);
```

- `handleApprove` → `approve()`
- `handleReject` → `reject()` lalu `onRefreshList()`
- `handleStop` → `stop({ reason: 'Dihentikan admin', stoppedBy: 'Admin' })`
- `handleDeleteDiscount` → `useDeletePlanPromo(plan._id, { onDeleted: refetch })`
- Pass `planId` ke DiscountModal dan DiscountDetailModal

**Ingredient mapping:** Extract ke helper function `mapIngredientsFromPlan(plan)` yang pure, dipanggil di component. Atau bisa juga jadikan custom hook `usePlanIngredients(plan)`.

#### 2B. PlanDetailModal → `usePlanDetail` + `usePlanPromoGroup`
**File:** `src/pages/admin/production-plan/draft/components/PlanDetailModal.jsx`
**Changes:**
- Sama seperti PlanDetailPane — wire `usePlanDetail(planId)` + `usePlanPromoGroup(plan?.menus)`
- Hapus semua manual fetch/mutation logic
- Pass `planId` ke DiscountModal dan DiscountDetailModal
- `handleAccept` → `approve()` lalu `onClose()`
- `handleHapus` → `reject()` lalu `onClose()`

### FASE 3: View Components (depends on detail components)

#### 3A. PlanHistoryView → `usePlanList`
**File:** `src/pages/admin/production-plan/draft/components/PlanHistoryView.jsx`
**Changes:**
- Import `usePlanList` from `@/hooks/plan/usePlanList`
- Hapus: `getPlanList` import, `plans` state, `isLoadingList` state, `fetchPlans` callback
- Ganti dengan:
```js
const { plans, isLoading: isLoadingList, refetch } = usePlanList();
```
- `handleReload` → `refetch()`
- PlanDetailPane sudah use `usePlanDetail` internally, jadi `onRefreshList` bisa diwiring ke `refetch`

### FASE 4: Pages (orchestration layer)

#### 4A. ActivePlanPage → `useActivePlanOverview`
**File:** `src/pages/admin/production-plan/active/ActivePlanPage.jsx`
**Changes:**
- Import `useActivePlanOverview` from `@/hooks/plan/usePlanOverview`
- Hapus: `useState` untuk plans, activePlanDetail, isLoading, isStopping
- Hapus: `getPlanList`, `getPlanDetail`, `stopPlan` imports
- Hapus: `fetchData` function, `handleStopPlan` function

Ganti dengan:
```js
const { plans, activePlanDetail, isLoading, isStopping, stopActivePlan, refetch } = useActivePlanOverview();
```

- Plan history table: gunakan `plans` dari hook (sudah filtered by status !== 'draft')
- Active plan tracking table: gunakan `activePlanDetail.menus`
- `handleStopPlan` → `stopActivePlan({ reason: 'Dihentikan manual' })`
- Search/filter/sort: tetap di page level (client-side), menggunakan `useSortable`
- Remove unused state: `searchHistory`, `filterStatus` bisa dipertahankan sebagai local UI state

#### 4B. DraftPlanPage → `usePlanDetail` (for create) + `usePlanList` (for history)
**File:** `src/pages/admin/production-plan/draft/DraftPlanPage.jsx`
**Changes:**
- Import `planApi` from `@/services/plan/plan.api` (untuk createPlan)
- Import `usePlanDetail` dari `@/hooks/plan/usePlanDetail`
- Hapus: `getMenuDropdown`, `createPlan` imports dari `@/services/api`

**Create flow:**
- Menu dropdown: gunakan `planApi` langsung atau buat `useMenuDropdown` hook baru (atau pertahankan `getMenuDropdown` dari legacy service sementara karena menu dropdown bukan plan entity)
- `handleCreatePlan`: panggil `planApi.create(payload)` langsung, lalu set `createdPlanId`

**History view:**
- PlanHistoryView sudah use `usePlanList` internally (dari Fase 3A)

## Implementation Order

```
1. DiscountModal (usePlanDiscountForm)         — independent
2. DiscountDetailModal (useDeletePlanPromo)     — independent
3. PlanDetailPane (usePlanDetail + usePlanPromoGroup + useDeletePlanPromo)
4. PlanDetailModal (usePlanDetail + usePlanPromoGroup + useDeletePlanPromo)
5. PlanHistoryView (usePlanList)
6. ActivePlanPage (useActivePlanOverview)
7. DraftPlanPage (planApi.create + menu dropdown)
```

## Error Handling Strategy

- Toast error sudah di-handle di setiap hook (usePlanDetail, usePlanList, usePlanDiscountForm, useDeletePlanPromo)
- Components TIDAK perlu try/catch manual — hook sudah wrap dengan `runMutation()` pattern
- Loading states di-expose dari hooks → component cukup render skeleton/spinner

## Testing Strategy

- Manual smoke test per halaman setelah migrasi
- Verify: plan list loads, active plan shows, stop plan works, create plan works, discount add/edit/delete works
- Verify: loading states, error toasts, empty states

## Risk Mitigation

1. **Incremental approach** — satu komponen pada waktu, bisa di-rollback jika ada issue
2. **Mapper sudah tested** — data shape konsisten antara legacy dan new hooks
3. **Mock mode** — `USE_MOCK = true` di legacy service, new hooks juga punya fallback
4. **Shared components unchanged** — PlanMenuAccordion, PlanListCard tidak diubah, mengurangi risk
