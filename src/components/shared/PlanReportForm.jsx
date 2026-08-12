import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getPlanList, getMenuDropdown, getInventoryList } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const reportSchema = z.object({
  planId: z.string().min(1, 'Pilih plan terkait'),
  category: z.enum(['menu', 'ingredient'], { required_error: 'Pilih kategori item' }),
  refId: z.string().min(1, 'Pilih item yang rusak/hilang'),
  quantityLost: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  incidentAt: z.string().min(1, 'Pilih waktu kejadian'),
  reason: z.string().min(1, 'Alasan wajib diisi'),
});

export default function PlanReportForm({ onSubmit, defaultPlanId = '' }) {
  const { user, role } = useAuth();

  const [plans, setPlans] = useState([]);
  const [menus, setMenus] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidentError, setIncidentError] = useState('');

  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: { planId: defaultPlanId, category: 'menu', refId: '', quantityLost: '', incidentAt: '', reason: '' },
  });

  const selectedCategory = form.watch('category');
  const selectedPlanId = form.watch('planId');
  const selectedIncidentAt = form.watch('incidentAt');
  const selectedRefId = form.watch('refId');

  const selectedPlan = plans.find((plan) => (plan.id ?? plan._id) === selectedPlanId);
  const selectedItems = selectedCategory === 'menu' ? menus : ingredients;
  const selectedItem = selectedItems.find((item) => (item.id ?? item._id) === selectedRefId);

  useEffect(() => {
    async function fetchData() {
      setIsLoadingPlans(true);

      try {
        const [plansRes, menusRes, invRes] = await Promise.all([getPlanList(), getMenuDropdown(), getInventoryList()]);

        const planData = plansRes.data?.data ?? [];
        const menuData = menusRes.data?.data ?? [];
        const inventoryPayload = invRes.data?.data;

        const inventoryData = Array.isArray(inventoryPayload)
          ? inventoryPayload
          : Array.isArray(inventoryPayload?.items)
            ? inventoryPayload.items
            : [];

        const validPlans = Array.isArray(planData)
          ? planData.filter((plan) => ['active', 'stopped', 'completed'].includes(plan.status))
          : [];

        setPlans(validPlans);
        setMenus(Array.isArray(menuData) ? menuData : []);
        setIngredients(inventoryData);
      } catch (error) {
        console.error('[PLAN REPORT SUPPORTING DATA ERROR]', error);
        console.error('[PLAN REPORT SUPPORTING DATA RESPONSE]', error.response?.data);

        setPlans([]);
        setMenus([]);
        setIngredients([]);
        toast.error('Gagal memuat data pendukung laporan');
      } finally {
        setIsLoadingPlans(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedIncidentAt || !selectedPlanId) {
      setIncidentError('');
      return;
    }

    const incidentDate = new Date(selectedIncidentAt);
    const now = new Date();

    if (incidentDate > now) {
      setIncidentError('Waktu kejadian tidak boleh di masa depan.');
      return;
    }

    const plan = plans.find((item) => (item.id ?? item._id) === selectedPlanId);

    if (!plan?.startDate) {
      setIncidentError('');
      return;
    }

    const start = new Date(plan.startDate);
    let end = null;

    if (plan.status === 'stopped' && plan.stoppedAt) end = new Date(plan.stoppedAt);
    else if (plan.endDate) end = new Date(plan.endDate);
    else if (plan.duration) end = new Date(start.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    if (incidentDate < start || (end && incidentDate > end)) {
      setIncidentError('Waktu kejadian berada di luar rentang durasi plan yang dipilih.');
      return;
    }

    setIncidentError('');
  }, [selectedIncidentAt, selectedPlanId, plans]);

  const handleSubmit = async (values) => {
    if (incidentError) {
      toast.error('Perbaiki error pada tanggal kejadian sebelum submit.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        incidentAt: new Date(values.incidentAt).toISOString(),
        reportedBy: user?.name || 'Unknown',
        reportedByRole: role || 'unknown',
      };

      await onSubmit(payload);
      form.reset({ planId: defaultPlanId, category: 'menu', refId: '', quantityLost: '', incidentAt: '', reason: '' });
    } catch (error) {
      console.error('[PLAN REPORT SUBMIT ERROR]', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
      {/* Production Plan */}
      <div className="grid gap-2">
        <Label>Production Plan</Label>

        <Select
          value={selectedPlanId}
          onValueChange={(value) => form.setValue('planId', value, { shouldValidate: true })}
          disabled={isLoadingPlans}
        >
          <SelectTrigger>
            {selectedPlan ? (
              <span className="truncate">{selectedPlan.name} ({selectedPlan.status})</span>
            ) : (
              <SelectValue placeholder="Pilih plan aktif/selesai" />
            )}
          </SelectTrigger>

          <SelectContent>
            {plans.map((plan) => {
              const planId = plan.id ?? plan._id;

              return (
                <SelectItem key={planId} value={planId}>
                  {plan.name} ({plan.status})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {form.formState.errors.planId && (
          <span className="text-xs text-destructive">{form.formState.errors.planId.message}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div className="grid gap-2">
          <Label>Kategori Item</Label>

          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              form.setValue('category', value, { shouldValidate: true });
              form.setValue('refId', '', { shouldValidate: true });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="menu">Menu / Produk Jadi</SelectItem>
              <SelectItem value="ingredient">Bahan Mentah (Ingredient)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Item */}
        <div className="grid gap-2">
          <Label>Item (Nama)</Label>

          <Select
            value={selectedRefId}
            onValueChange={(value) => form.setValue('refId', value, { shouldValidate: true })}
          >
            <SelectTrigger>
              {selectedItem ? (
                <span className="truncate">{selectedItem.name}</span>
              ) : (
                <SelectValue placeholder="Pilih Item" />
              )}
            </SelectTrigger>

            <SelectContent>
              {selectedCategory === 'menu'
                ? menus.map((menu) => {
                    const menuId = menu.id ?? menu._id;
                    return <SelectItem key={menuId} value={menuId}>{menu.name}</SelectItem>;
                  })
                : ingredients.map((ingredient) => {
                    const ingredientId = ingredient.id ?? ingredient._id;
                    return <SelectItem key={ingredientId} value={ingredientId}>{ingredient.name}</SelectItem>;
                  })}
            </SelectContent>
          </Select>

          {form.formState.errors.refId && (
            <span className="text-xs text-destructive">{form.formState.errors.refId.message}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quantity */}
        <div className="grid gap-2">
          <Label>Kuantitas Rusak</Label>

          <Input type="number" min="1" placeholder="Misal: 2" {...form.register('quantityLost')} />

          {form.formState.errors.quantityLost && (
            <span className="text-xs text-destructive">{form.formState.errors.quantityLost.message}</span>
          )}
        </div>

        {/* Incident Time */}
        <div className="grid gap-2">
          <Label>Waktu Kejadian (Riil)</Label>

          <Input type="datetime-local" {...form.register('incidentAt')} />

          {form.formState.errors.incidentAt && !incidentError && (
            <span className="text-xs text-destructive">{form.formState.errors.incidentAt.message}</span>
          )}

          {incidentError && <span className="text-xs text-destructive">{incidentError}</span>}
        </div>
      </div>

      {/* Reason */}
      <div className="grid gap-2">
        <Label>Alasan / Detail Kejadian</Label>

        <Textarea placeholder="Jelaskan secara singkat kenapa item ini rusak/hilang..." {...form.register('reason')} />

        {form.formState.errors.reason && (
          <span className="text-xs text-destructive">{form.formState.errors.reason.message}</span>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting || isLoadingPlans || !!incidentError} className="mt-2">
        {isSubmitting ? 'Submitting...' : 'Submit Laporan'}
      </Button>
    </form>
  );
}