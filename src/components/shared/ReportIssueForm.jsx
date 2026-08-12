import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { reportIssueSchema } from '@/schemas/reportIssueSchema';
import { getActivePlans, getPlanDetail } from '@/services/cashierApi';

const CATEGORY_OPTIONS = [
  { value: 'menu', label: 'Menu' },
  { value: 'ingredient', label: 'Ingredient' },
];

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';

  return new Date(isoDate).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toDateTimeLocal = (date) => {
  const value = date ? new Date(date) : new Date();
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

export default function ReportIssueForm({ mode, issue, cashierName, onSubmit }) {
  const isDetail = mode === 'detail';

  const [plan, setPlan] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [detailPlanName, setDetailPlanName] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      planId: '',
      category: '',
      refId: '',
      quantityLost: '',
      incidentAt: toDateTimeLocal(),
      reason: '',
    },
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    if (isDetail) {
      reset({
        planId: issue?.planId ?? '',
        category: issue?.category ?? '',
        refId: issue?.refId ?? '',
        quantityLost: issue?.quantityLost ?? '',
        incidentAt: issue?.incidentAt ? toDateTimeLocal(issue.incidentAt) : '',
        reason: issue?.reason ?? '',
      });

        const fetchDetailPlan = async () => {
        if (!issue?.planId) return;

        try {
          const planDetail = await getPlanDetail(issue.planId);
          setDetailPlanName(planDetail?.name ?? '');
        } catch (error) {
          console.error('[REPORT DETAIL PLAN ERROR]', error);
          setDetailPlanName('');
        }
      };

      fetchDetailPlan();

      return;
    }

    const fetchActivePlan = async () => {
      try {
        setIsPlanLoading(true);
        setPlanError(null);

        const activePlans = await getActivePlans();
        const activePlan = activePlans?.[0];

        if (!activePlan) {
          setPlan(null);
          setPlanError('Tidak ada plan aktif.');
          return;
        }

        const planDetail = await getPlanDetail(activePlan.planId);

        setPlan(planDetail);
        setValue('planId', activePlan.planId, { shouldValidate: true });
      } catch (error) {
        console.error('[REPORT ISSUE PLAN ERROR]', error);
        setPlanError('Gagal memuat plan aktif.');
      } finally {
        setIsPlanLoading(false);
      }
    };

    fetchActivePlan();
  }, [isDetail, issue, reset, setValue]);

  useEffect(() => {
    if (!isDetail) {
      setValue('refId', '', { shouldValidate: true });
    }
  }, [selectedCategory, isDetail, setValue]);

  const referenceOptions = useMemo(() => {
    if (!plan) return [];

    if (selectedCategory === 'menu') {
      return (plan.menus ?? []).map((menu) => ({
        value: menu.menuId,
        label: menu.name,
      }));
    }

    if (selectedCategory === 'ingredient') {
      return (plan.committedIngredients ?? []).map((item) => ({
        value: item.inventoryId,
        label: item.nameInventory,
      }));
    }

    return [];
  }, [plan, selectedCategory]);

  const submitForm = async (values) => {
    try {
      setSubmitError(null);

      const payload = {
        planId: values.planId,
        category: values.category,
        refId: values.refId,
        quantityLost: Number(values.quantityLost),
        incidentAt: new Date(values.incidentAt).toISOString(),
        reason: values.reason,
      };

      console.log('[REPORT ISSUE PAYLOAD]', payload);

      await onSubmit(payload);
    } catch (error) {
      console.error('[REPORT ISSUE SUBMIT ERROR]', error);
      console.error('[BACKEND RESPONSE]', error.response?.data);

      setSubmitError(error.response?.data?.message ?? 'Failed to submit report. Please try again.');
    }
  };

  const detailCategory = issue?.category ?? '';
  const currentCategory = isDetail ? detailCategory : selectedCategory;

  return (
    <form
      onSubmit={
        isDetail
          ? undefined
          : handleSubmit(
              submitForm,
              (validationErrors) => {
                console.log('[REPORT ISSUE VALIDATION ERROR]', validationErrors);
                setSubmitError('Please complete all required fields correctly.');
              }
            )
      }
    >
      <div className="space-y-4 px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cashier Name</label>

            <input
              disabled
              value={isDetail ? issue?.reportedBy ?? '-' : cashierName ?? ''}
              readOnly
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {isDetail ? 'Plan' : 'Active Plan'}
            </label>

            <input
              disabled
                    value={
                      isDetail
                        ? detailPlanName || 'Loading...'
                        : isPlanLoading
                          ? 'Loading...'
                          : plan?.name ?? 'No active plan'
                    }
              readOnly
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {!isDetail && <input type="hidden" {...register('planId')} />}

        {!isDetail && planError && <p className="text-xs text-destructive">{planError}</p>}
        {!isDetail && errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}

        <div className="space-y-1">
          <label htmlFor="issue-category" className="text-xs font-medium text-muted-foreground">
            Category
          </label>

          {isDetail ? (
            <input
              disabled
              value={issue?.category ?? '-'}
              readOnly
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm capitalize text-foreground"
            />
          ) : (
            <select
              id="issue-category"
              {...register('category')}
              disabled={!plan || isPlanLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:bg-muted/40"
            >
              <option value="">Select category</option>

              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {!isDetail && errors.category && (
            <p className="text-xs text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="issue-ref" className="text-xs font-medium text-muted-foreground">
            {currentCategory === 'menu' ? 'Menu' : currentCategory === 'ingredient' ? 'Ingredient' : 'Item'}
          </label>

          {isDetail ? (
            <input
              disabled
              value={issue?.nameRef ?? '-'}
              readOnly
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
            />
          ) : (
            <select
              id="issue-ref"
              {...register('refId')}
              disabled={!selectedCategory || !plan}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:bg-muted/40"
            >
              <option value="">Select item</option>

              {referenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {!isDetail && errors.refId && (
            <p className="text-xs text-destructive">{errors.refId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="quantity-lost" className="text-xs font-medium text-muted-foreground">
              Quantity Lost
            </label>

            {isDetail ? (
              <input
                disabled
                value={issue?.quantityLost ?? '-'}
                readOnly
                className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
              />
            ) : (
              <input
                id="quantity-lost"
                type="number"
                min="0"
                step={selectedCategory === 'menu' ? '1' : 'any'}
                placeholder="0"
                {...register('quantityLost')}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              />
            )}

            {!isDetail && errors.quantityLost && (
              <p className="text-xs text-destructive">{errors.quantityLost.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="incident-at" className="text-xs font-medium text-muted-foreground">
              Incident Date
            </label>

            {isDetail ? (
              <input
                disabled
                value={formatDateTime(issue?.incidentAt)}
                readOnly
                className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
              />
            ) : (
              <input
                id="incident-at"
                type="datetime-local"
                {...register('incidentAt')}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              />
            )}

            {!isDetail && errors.incidentAt && (
              <p className="text-xs text-destructive">{errors.incidentAt.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="issue-reason" className="text-xs font-medium text-muted-foreground">
            Reason
          </label>

          {isDetail ? (
            <textarea
              disabled
              rows={4}
              value={issue?.reason ?? '-'}
              readOnly
              className="w-full resize-none rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
            />
          ) : (
            <textarea
              id="issue-reason"
              rows={4}
              placeholder="Provide information about the incident..."
              {...register('reason')}
              className="w-full resize-none rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
            />
          )}

          {!isDetail && errors.reason && (
            <p className="text-xs text-destructive">{errors.reason.message}</p>
          )}
        </div>

        {isDetail && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>

              <input
                disabled
                value={issue?.status ?? '-'}
                readOnly
                className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm capitalize text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Late Report</label>

              <input
                disabled
                value={issue?.isLateReport ? 'Yes' : 'No'}
                readOnly
                className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        )}

        {!isDetail && submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
      </div>

      {!isDetail && (
        <div className="flex justify-end border-t border-neutral-200 bg-muted/30 px-6 py-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPlanLoading || !plan}
            className="rounded-md bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <Save size={16} strokeWidth={2} />
            {isSubmitting ? 'Saving...' : 'Simpan'}
          </Button>
        </div>
      )}
    </form>
  );
}