import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { getActivePlans, getPlanDetail } from '@/services/cashierApi';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const reportSchema = z.object({
  planId: z.string().min(1, 'Active production plan is required'),

  category: z.enum(['menu', 'ingredient'], {
    required_error: 'Please select an item category',
  }),

  refId: z.preprocess(
    (value) => value ?? '',
    z.string().min(1, 'Please select an item'),
  ),

  quantityLost: z.coerce
    .number()
    .min(1, 'Quantity must be at least 1'),

  incidentAt: z
    .string()
    .min(1, 'Please select the incident time'),

  reason: z
    .string()
    .min(1, 'Please provide the incident details'),
});

const toDateTimeLocal = (date) => {
  const value = date ? new Date(date) : new Date();
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

export default function PlanReportForm({ onSubmit }) {
  const { user, role } = useAuth();

  const [plan, setPlan] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [incidentError, setIncidentError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),

    defaultValues: {
      planId: '',
      category: 'menu',
      refId: '',
      quantityLost: '',
      incidentAt: toDateTimeLocal(),
      reason: '',
    },
  });

  const selectedCategory = watch('category');
  const selectedRefId = watch('refId');
  const selectedIncidentAt = watch('incidentAt');

  /*
   * Sama seperti ReportIssueForm Kasir:
   *
   * 1. GET active plan
   * 2. Ambil activePlans[0]
   * 3. GET detail berdasarkan planId
   * 4. Detail plan menjadi source menu + ingredient
   */
  useEffect(() => {
    const fetchActivePlan = async () => {
      try {
        setIsPlanLoading(true);
        setPlanError(null);

        const activePlans = await getActivePlans();
        const activePlan = activePlans?.[0];

        if (!activePlan) {
          setPlan(null);
          setPlanError('No active production plan is currently available.');
          return;
        }

        const planDetail = await getPlanDetail(activePlan.planId);

        setPlan(planDetail);

        setValue('planId', activePlan.planId, {
          shouldValidate: true,
        });
      } catch (error) {
        console.error('[PLAN REPORT ACTIVE PLAN ERROR]', error);
        console.error(
          '[PLAN REPORT ACTIVE PLAN RESPONSE]',
          error.response?.data,
        );

        setPlan(null);
        setPlanError('Failed to load the active production plan.');
      } finally {
        setIsPlanLoading(false);
      }
    };

    fetchActivePlan();
  }, [setValue]);

  /*
   * Setiap kategori berubah,
   * item sebelumnya harus dibuang.
   */
  useEffect(() => {
    setValue('refId', '', {
      shouldValidate: false,
    });

    clearErrors('refId');
  }, [selectedCategory, setValue, clearErrors]);

  /*
   * Sama seperti ReportIssueForm:
   *
   * menu       -> plan.menus
   * ingredient -> plan.committedIngredients
   */
  const referenceOptions = useMemo(() => {
    if (!plan) return [];

    if (selectedCategory === 'menu') {
      return (plan.menus ?? [])
        .map((menu) => ({
          value: menu.menuId,
          label: menu.name,
        }))
        .filter((item) => item.value && item.label);
    }

    if (selectedCategory === 'ingredient') {
      return (plan.committedIngredients ?? [])
        .map((item) => ({
          value: item.inventoryId,
          label: item.nameInventory,
        }))
        .filter((item) => item.value && item.label);
    }

    return [];
  }, [plan, selectedCategory]);

  const selectedItem = useMemo(
    () =>
      referenceOptions.find(
        (item) =>
          String(item.value) === String(selectedRefId),
      ),
    [referenceOptions, selectedRefId],
  );

  /*
   * Tambahan validasi waktu:
   * - tidak boleh future
   * - harus berada di rentang plan
   */
  useEffect(() => {
    if (!selectedIncidentAt || !plan) {
      setIncidentError('');
      return;
    }

    const incidentDate = new Date(selectedIncidentAt);

    if (Number.isNaN(incidentDate.getTime())) {
      setIncidentError('Invalid incident time.');
      return;
    }

    const now = new Date();

    if (incidentDate.getTime() > now.getTime()) {
      setIncidentError(
        'Incident time cannot be in the future.',
      );
      return;
    }

    if (!plan.startDate) {
      setIncidentError('');
      return;
    }

    const startDate = new Date(plan.startDate);

    let endDate = null;

    if (plan.status === 'stopped' && plan.stoppedAt) {
      endDate = new Date(plan.stoppedAt);
    } else if (plan.endDate) {
      endDate = new Date(plan.endDate);
    } else if (plan.duration) {
      endDate = new Date(
        startDate.getTime() +
          plan.duration * 24 * 60 * 60 * 1000,
      );
    }

    if (
      incidentDate.getTime() < startDate.getTime() ||
      (endDate &&
        incidentDate.getTime() > endDate.getTime())
    ) {
      setIncidentError(
        'Incident time is outside the active production plan period.',
      );

      return;
    }

    setIncidentError('');
  }, [selectedIncidentAt, plan]);

  const submitForm = async (values) => {
    if (incidentError) {
      toast.error(
        'Please correct the incident time before submitting.',
      );
      return;
    }

    try {
      setSubmitError(null);

      const incidentDate = new Date(values.incidentAt);

      if (incidentDate.getTime() > Date.now()) {
        setIncidentError(
          'Incident time cannot be in the future.',
        );
        return;
      }

      /*
       * Payload mengikuti ReportIssueForm Kasir.
       */
      const payload = {
        planId: values.planId,
        category: values.category,
        refId: values.refId,
        quantityLost: Number(values.quantityLost),
        incidentAt: incidentDate.toISOString(),
        reason: values.reason,
      };

      console.log('[PLAN REPORT PAYLOAD]', payload);

      await onSubmit(payload);
    } catch (error) {
      console.error('[PLAN REPORT SUBMIT ERROR]', error);
      console.error(
        '[PLAN REPORT BACKEND RESPONSE]',
        error.response?.data,
      );

      setSubmitError(
        error.response?.data?.message ??
          'Failed to submit report. Please try again.',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(
        submitForm,
        (validationErrors) => {
          console.log(
            '[PLAN REPORT VALIDATION ERROR]',
            validationErrors,
          );

          setSubmitError(
            'Please complete all required fields correctly.',
          );
        },
      )}
      className="grid gap-4 py-4"
    >
      {/* Active Plan */}
      <div className="grid gap-2">
        <Label>Active Production Plan</Label>

        <Input
          disabled
          readOnly
          value={
            isPlanLoading
              ? 'Loading active plan...'
              : plan?.name ?? 'No active plan'
          }
          className="bg-muted/40"
        />

        <input
          type="hidden"
          {...register('planId')}
        />

        {planError && (
          <span className="text-xs text-destructive">
            {planError}
          </span>
        )}

        {errors.planId && (
          <span className="text-xs text-destructive">
            {errors.planId.message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div className="grid gap-2">
          <Label>Item Category</Label>

          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setValue('category', value, {
                shouldValidate: true,
              });

              setValue('refId', '', {
                shouldValidate: false,
              });

              clearErrors('refId');
            }}
            disabled={!plan || isPlanLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="menu">
                Menu
              </SelectItem>

              <SelectItem value="ingredient">
                Ingredient
              </SelectItem>
            </SelectContent>
          </Select>

          {errors.category && (
            <span className="text-xs text-destructive">
              {errors.category.message}
            </span>
          )}
        </div>

        {/* Item */}
        <div className="grid gap-2">
          <Label>
            {selectedCategory === 'menu'
              ? 'Menu'
              : 'Ingredient'}
          </Label>

          <Select
            value={selectedRefId || ''}
            onValueChange={(value) =>
              setValue('refId', value, {
                shouldValidate: true,
              })
            }
            disabled={
              !plan ||
              isPlanLoading ||
              referenceOptions.length === 0
            }
          >
            <SelectTrigger>
              {selectedItem ? (
                <span className="truncate">
                  {selectedItem.label}
                </span>
              ) : (
                <SelectValue
                  placeholder={
                    !plan
                      ? 'No active plan'
                      : selectedCategory === 'menu'
                        ? 'Select menu'
                        : 'Select ingredient'
                  }
                />
              )}
            </SelectTrigger>

            <SelectContent>
              {referenceOptions.map((option) => (
                <SelectItem
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {plan &&
            referenceOptions.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No{' '}
                {selectedCategory === 'menu'
                  ? 'menu'
                  : 'ingredient'}{' '}
                is available in the active plan.
              </span>
            )}

          {errors.refId && (
            <span className="text-xs text-destructive">
              {errors.refId.message}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quantity */}
        <div className="grid gap-2">
          <Label>Quantity Lost</Label>

          <Input
            type="number"
            min="0"
            step={
              selectedCategory === 'menu'
                ? '1'
                : 'any'
            }
            placeholder="e.g. 2"
            {...register('quantityLost')}
          />

          {errors.quantityLost && (
            <span className="text-xs text-destructive">
              {errors.quantityLost.message}
            </span>
          )}
        </div>

        {/* Incident Time */}
        <div className="grid gap-2">
          <Label>Incident Time</Label>

          <Input
            type="datetime-local"
            max={toDateTimeLocal()}
            {...register('incidentAt')}
          />

          {errors.incidentAt &&
            !incidentError && (
              <span className="text-xs text-destructive">
                {errors.incidentAt.message}
              </span>
            )}

          {incidentError && (
            <span className="text-xs text-destructive">
              {incidentError}
            </span>
          )}
        </div>
      </div>

      {/* Reason */}
      <div className="grid gap-2">
        <Label>Incident Details</Label>

        <Textarea
          rows={4}
          placeholder="Briefly explain what happened..."
          {...register('reason')}
        />

        {errors.reason && (
          <span className="text-xs text-destructive">
            {errors.reason.message}
          </span>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
        >
          {submitError}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent px-6 text-accent-foreground hover:bg-accent/90"
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}