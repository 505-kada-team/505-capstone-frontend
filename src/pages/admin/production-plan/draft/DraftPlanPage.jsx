import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { History } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { planApi } from '@/services/plan/plan.api';
import { getMenuDropdown } from '@/services/api'; // kept temporarily for menu dropdown
import PlanDetailModal from './components/PlanDetailModal';
import PlanHistoryView from './components/PlanHistoryView';

export default function DraftPlanPage() {
  const [view, setView] = useState('create'); // 'create' | 'history'
  const [step, setStep] = useState(1);
  
  // API State
  const [availableMenus, setAvailableMenus] = useState([]);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [planName, setPlanName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (step === 2 && availableMenus.length === 0) {
      getMenuDropdown().then(res => {
        // Debug: log raw response to understand structure
        console.log('[DraftPlan] getMenuDropdown raw response:', res);
        console.log('[DraftPlan] res.data:', res?.data);

        // getMenuDropdown returns Axios response: { data: envelope }
        // Try multiple paths to find the menu array
        let data = null;
        if (Array.isArray(res?.data?.data)) {
          // Path: res.data = { success, data: [...] }
          data = res.data.data;
        } else if (Array.isArray(res?.data)) {
          // Path: res.data = [...]
          data = res.data;
        } else if (Array.isArray(res?.data?.success ? res.data.data : null)) {
          data = res.data.data;
        }

        console.log('[DraftPlan] parsed menu data:', data);

        if (Array.isArray(data) && data.length > 0) {
          console.log('[DraftPlan] first menu item keys:', Object.keys(data[0]));
          setAvailableMenus(data.map(m => ({
            ...m,
            _id: m._id || m.id,
            name: m.name || m.menuName || m.nama || 'Unnamed Menu',
            sellingPrice: m.sellingPrice || m.harga || 0,
          })));
        } else {
          console.warn('[DraftPlan] No menu data found in response');
        }
      }).catch(err => {
        console.error('[DraftPlan] Failed to load menu:', err);
        toast.error('Failed to load menu');
      });
    }
  }, [step, availableMenus.length]);

  const handleNext = () => {
    if (!planName || !startDate || !endDate) {
      toast.error('Please complete plan name and period');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    setStep(2);
  };

  const handleForecast = () => {
    toast.success('Data pulled from forecast (Mock)');
    setPlanName('Forecast Plan - Agustus');
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  };

  const handleAddToCart = () => {
    if (!selectedMenu || !quantity || Number(quantity) <= 0) return;
    const menu = availableMenus.find(m => m._id === selectedMenu);
    if (!menu) {
      console.warn('[DraftPlan] Menu not found for selectedMenu:', selectedMenu, 'availableMenus:', availableMenus);
      return;
    }

    console.log('[DraftPlan] Adding to cart:', { _id: menu._id, name: menu.name, qty: Number(quantity) });
    setCart([...cart, {
      _id: menu._id,
      name: menu.name,
      price: menu.sellingPrice,
      qty: Number(quantity),
      subtotal: menu.sellingPrice * Number(quantity)
    }]);
    
    setSelectedMenu('');
    setQuantity('1');
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalEstimated = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const formatRp = (num) => `Rp ${num.toLocaleString('id-ID')}`;

  const handleCreatePlan = async () => {
    if (cart.length === 0) {
      toast.error('Choose at least one menu');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Hitung duration (hari)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      
      const payload = {
        name: planName,
        tags: [],
        startDate: new Date(startDate).toISOString(),
        duration,
        menus: cart.map(item => ({
          menuId: item._id,
          quantityPlanned: item.qty
        }))
      };
      
      console.log('[DraftPlan] Create plan payload:', JSON.stringify(payload, null, 2));
      const res = await planApi.create(payload);
      console.log('[DraftPlan] Create plan response:', res);
      // planApi.create returns the envelope: { data: planObject, message }
      // planApi already unwraps res.data, so res = { data: ..., message: ... }
      const planData = res?.data;
      if (planData?._id) {
        toast.success(res.message || 'Plan created');
        setCreatedPlanId(planData._id);
      } else {
        toast.error(res?.message || 'Failed to create draft plan');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'System error';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'history') {
    return <PlanHistoryView onNavigateToCreate={() => setView('create')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Production Planning" 
          badges={[{ label: 'DRAFT PLAN', variant: 'low stock' }]} 
        />
        <Button
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium"
            onClick={() => setView('history')}
          >
            <History className="w-4 h-4" />
            Plan History
          </Button>
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Draft Plan</CardTitle>
          <CardDescription>Plan your selling and estimate the flow</CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="border border-border/80 rounded-xl p-6 mt-4 flex flex-col gap-6 bg-background">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground capitalize">Plan Title</label>
                <Input 
                  placeholder="Enter plan title" 
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground capitalize">Start Date</label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground capitalize">End Date</label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="outline" className="border-border hover:bg-muted" onClick={handleForecast}>
                  Create from Forecast
                </Button>
                <Button className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-6" onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="border border-border/80 rounded-xl p-6 mt-4 flex flex-col gap-6 bg-background">
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground capitalize">Choose Menu</label>
                  <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select menu item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMenus.map(m => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-sm font-medium text-foreground capitalize">Quantity</label>
                  <Input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <Button 
                  variant="secondary" 
                  onClick={handleAddToCart}
                  className="bg-[#E6D5C3] text-primary hover:bg-[#E6D5C3]/80 border border-[#E6D5C3]/40 px-6 font-medium"
                >
                  Add
                </Button>
              </div>

              {/* Tabel Menu */}
              <div className="border rounded-md overflow-hidden mt-2">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium capitalize">Menu</th>
                      <th className="py-3 px-4 text-center font-medium capitalize">Quantity</th>
                      <th className="py-3 px-4 text-left font-medium capitalize">Subtotal</th>
                      <th className="py-3 px-4 text-center font-medium capitalize">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4 text-foreground capitalize">{item.name}</td>
                        <td className="py-3 px-4 text-center font-mono">{item.qty}</td>
                        <td className="py-3 px-4 font-mono">{formatRp(item.subtotal)}</td>
                        <td className="py-3 px-4 text-center">
                          <button 
                            className="text-destructive text-sm hover:underline"
                            onClick={() => handleRemoveFromCart(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No menu added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-end mt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground capitalize font-medium">Total Estimated (Selling Price)</span>
                  <span className="text-2xl font-bold font-mono text-foreground">{formatRp(totalEstimated)}</span>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="border-border hover:bg-muted" onClick={() => setStep(1)} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-6" onClick={handleCreatePlan} disabled={isSubmitting}>
                    {isSubmitting ? 'Prosessing...' : 'Create Plan'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanDetailModal 
        isOpen={!!createdPlanId} 
        onClose={() => setCreatedPlanId(null)}
        planId={createdPlanId}
      />
    </div>
  );
}