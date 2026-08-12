import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getPlanList, getMenuDropdown } from '@/services/api';
// Assuming getInventoryList is available, else we mock/skip
import { getInventoryList } from '@/services/api'; 
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Zod Schema
const reportSchema = z.object({
  planId: z.string().min(1, 'Pilih plan terkait'),
  category: z.enum(['menu', 'ingredient'], { required_error: 'Pilih kategori item' }),
  refId: z.string().min(1, 'Pilih item yang rusak/hilang'),
  quantityLost: z.coerce.number().min(1, 'Kuantitas minimal 1'),
  incidentAt: z.string().min(1, 'Pilih waktu kejadian'),
  reason: z.string().min(1, 'Alasan wajib diisi')
});

export default function PlanReportForm({ onSubmit, defaultPlanId = '' }) {
  const { user, role } = useAuth();
  const [plans, setPlans] = useState([]);
  const [menus, setMenus] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      planId: defaultPlanId,
      category: 'menu',
      refId: '',
      quantityLost: '',
      incidentAt: '',
      reason: ''
    }
  });

  const selectedCategory = form.watch('category');
  const selectedPlanId = form.watch('planId');
  const selectedIncidentAt = form.watch('incidentAt');

  useEffect(() => {
    async function fetchData() {
      setIsLoadingPlans(true);
      try {
        const [plansRes, menusRes, invRes] = await Promise.all([
          getPlanList(),
          getMenuDropdown(),
          getInventoryList ? getInventoryList() : Promise.resolve({ data: { data: [] } })
        ]);
        
        // Filter only active, stopped, completed
        const validPlans = (plansRes.data?.data || []).filter(p => ['active', 'stopped', 'completed'].includes(p.status));
        setPlans(validPlans);
        setMenus(menusRes.data?.data || []);
        setIngredients(invRes.data?.data || []);
      } catch (err) {
        console.error('Gagal memuat data pendukung', err);
      } finally {
        setIsLoadingPlans(false);
      }
    }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual inline validation for incidentAt
  const [incidentError, setIncidentError] = useState('');

  useEffect(() => {
    if (selectedIncidentAt && selectedPlanId) {
      const incidentDate = new Date(selectedIncidentAt);
      const now = new Date();
      if (incidentDate > now) {
        setIncidentError('Waktu kejadian tidak boleh di masa depan.');
        return;
      }
      const plan = plans.find(p => p._id === selectedPlanId);
      if (plan && plan.startDate) {
        const start = new Date(plan.startDate);
        // Estimate end date if duration exists
        const end = new Date(start.getTime() + (plan.duration || 1) * 24 * 60 * 60 * 1000);
        if (incidentDate < start || incidentDate > end) {
          setIncidentError('Waktu kejadian berada di luar rentang durasi plan yang dipilih.');
          return;
        }
      }
      setIncidentError('');
    } else {
      setIncidentError('');
    }
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
        reportedBy: user?.name || 'Unknown',
        reportedByRole: role || 'unknown'
      };
      await onSubmit(payload);
      form.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Production Plan</Label>
        <Select 
          value={selectedPlanId} 
          onValueChange={(val) => form.setValue('planId', val)} 
          disabled={isLoadingPlans}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih plan aktif/selesai" />
          </SelectTrigger>
          <SelectContent>
            {plans.map(p => (
              <SelectItem key={p._id} value={p._id}>{p.name} ({p.status})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.planId && <span className="text-xs text-destructive">{form.formState.errors.planId.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Kategori Item</Label>
          <Select 
            value={selectedCategory} 
            onValueChange={(val) => {
              form.setValue('category', val);
              form.setValue('refId', ''); // reset item
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

        <div className="grid gap-2">
          <Label>Item (Nama)</Label>
          <Select 
            value={form.watch('refId')} 
            onValueChange={(val) => form.setValue('refId', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Item" />
            </SelectTrigger>
            <SelectContent>
              {selectedCategory === 'menu' 
                ? menus.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)
                : ingredients.map(i => <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>)
              }
            </SelectContent>
          </Select>
          {form.formState.errors.refId && <span className="text-xs text-destructive">{form.formState.errors.refId.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Kuantitas Rusak</Label>
          <Input 
            type="number" 
            min="1" 
            placeholder="Misal: 2" 
            {...form.register('quantityLost')} 
          />
          {form.formState.errors.quantityLost && <span className="text-xs text-destructive">{form.formState.errors.quantityLost.message}</span>}
        </div>

        <div className="grid gap-2">
          <Label>Waktu Kejadian (Riil)</Label>
          <Input 
            type="datetime-local" 
            {...form.register('incidentAt')} 
          />
          {form.formState.errors.incidentAt && !incidentError && (
            <span className="text-xs text-destructive">{form.formState.errors.incidentAt.message}</span>
          )}
          {incidentError && (
             <span className="text-xs text-destructive">{incidentError}</span>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Alasan / Detail Kejadian</Label>
        <Textarea 
          placeholder="Jelaskan secara singkat kenapa item ini rusak/hilang..."
          {...form.register('reason')} 
        />
        {form.formState.errors.reason && <span className="text-xs text-destructive">{form.formState.errors.reason.message}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting || !!incidentError} className="mt-2">
        {isSubmitting ? 'Submitting...' : 'Submit Laporan'}
      </Button>
    </form>
  );
}
