import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { setMenuDiscount, deleteMenuDiscount } from '@/services/api';
import { cn } from '@/lib/utils';

export default function DiscountModal({ isOpen, onClose, plan, initialSelectedMenuId, editPromo, onApply }) {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [mode, setMode] = useState('sama_rata');
  const [globalPercent, setGlobalPercent] = useState('15');
  const [selectedMenus, setSelectedMenus] = useState({});
  const [menuPercents, setMenuPercents] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editPromo) {
        setReason(editPromo.reason);
        setDate({ from: new Date(editPromo.startDate), to: new Date(editPromo.endDate) });
        const uniquePercents = new Set(editPromo.menus.map(m => m.discountPercentage));
        if (uniquePercents.size === 1) {
          setMode('sama_rata');
          setGlobalPercent(String(Array.from(uniquePercents)[0]));
        } else {
          setMode('beda_per_menu');
        }
        const sel = {};
        const perc = {};
        editPromo.menus.forEach(m => {
          sel[m.menuId] = true;
          perc[m.menuId] = String(m.discountPercentage);
        });
        setSelectedMenus(sel);
        setMenuPercents(perc);
      } else {
        setReason('');
        setDate({ from: undefined, to: undefined });
        setMode('sama_rata');
        setGlobalPercent('15');
        if (initialSelectedMenuId) {
          setSelectedMenus({ [initialSelectedMenuId]: true });
          setMenuPercents({ [initialSelectedMenuId]: '15' });
        } else {
          setSelectedMenus({});
          setMenuPercents({});
        }
      }
    }
  }, [isOpen, editPromo, initialSelectedMenuId]);

  const toggleSelectAll = () => {
    const allSelected = plan?.menus?.every(m => selectedMenus[m.menuId]);
    if (allSelected) {
      setSelectedMenus({});
    } else {
      const sel = {};
      plan?.menus?.forEach(m => { sel[m.menuId] = true; });
      setSelectedMenus(sel);
    }
  };

  const toggleMenu = (menuId) => {
    setSelectedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plan?._id) return;
    if (!date?.from || !date?.to) {
      toast.error('Pilih rentang waktu diskon terlebih dahulu');
      return;
    }
    const selectedMenuIds = Object.keys(selectedMenus).filter(id => selectedMenus[id]);
    if (selectedMenuIds.length === 0) {
      toast.error('Pilih minimal satu menu untuk didiskon');
      return;
    }
    setIsSubmitting(true);
    try {
      const promises = [];
      const planId = plan._id;
      const startDate = date.from.toISOString();
      const endDate = date.to.toISOString();

      if (editPromo) {
        const oldMenuIds = editPromo.menus.map(m => m.menuId);
        const removedMenuIds = oldMenuIds.filter(id => !selectedMenus[id]);
        removedMenuIds.forEach(menuId => promises.push(deleteMenuDiscount(planId, menuId)));
      }

      selectedMenuIds.forEach(menuId => {
        const discountPercentage = mode === 'sama_rata'
          ? Number(globalPercent)
          : Number(menuPercents[menuId] || globalPercent);
        promises.push(setMenuDiscount(planId, menuId, { discountPercentage, reason, startDate, endDate }));
      });

      await Promise.all(promises);
      toast.success('Aturan diskon berhasil disimpan');
      onApply();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const minDate = plan?.startDate
    ? new Date(Math.max(new Date().getTime(), new Date(plan.startDate).getTime()))
    : new Date();
  const maxDate = plan?.endDate ? new Date(plan.endDate) : undefined;
  const allSelected = plan?.menus?.every(m => selectedMenus[m.menuId]) || false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editPromo ? 'Edit Aturan Diskon' : 'Tambah Aturan Diskon'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 mt-2 max-h-[65vh] overflow-y-auto pr-1">

            {/* Nama Promo + Rentang Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Nama Promo</label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Masukkan nama promo"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Rentang Waktu</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !date?.from && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {date?.from
                          ? date.to
                            ? `${format(date.from, 'dd/MM/yy')} – ${format(date.to, 'dd/MM/yy')}`
                            : format(date.from, 'dd MMM yyyy')
                          : 'Pilih tanggal'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from || minDate}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                      disabled={(d) => {
                        const day = new Date(d).setHours(0, 0, 0, 0);
                        const min = new Date(minDate).setHours(0, 0, 0, 0);
                        const max = maxDate ? new Date(maxDate).setHours(23, 59, 59, 999) : null;
                        return day < min || (max && day > max);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Skema Diskon */}
            <div className="space-y-3">
              <label className="text-sm font-semibold block">Skema Diskon</label>
              <Tabs value={mode} onValueChange={setMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sama_rata">Sama Rata</TabsTrigger>
                  <TabsTrigger value="beda_per_menu">Beda Per Menu</TabsTrigger>
                </TabsList>
              </Tabs>

              {mode === 'sama_rata' && (
                <div className="flex gap-4 items-start bg-muted/20 p-3 rounded-xl border">
                  <div className="space-y-1.5 shrink-0">
                    <label className="text-xs font-semibold text-muted-foreground">Besar Diskon</label>
                    <div className="relative w-28">
                      <Input
                        type="number" min="1" max="100"
                        value={globalPercent}
                        onChange={e => setGlobalPercent(e.target.value)}
                        className="pr-8 font-mono"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-amber-500/10 text-amber-600 p-3 rounded-lg flex gap-2 items-start border border-amber-500/20 mt-5">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">Pastikan besaran diskon masih menutupi HPP agar plan tidak merugi.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Daftar Menu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Daftar Menu</label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="selectAll" checked={allSelected} onCheckedChange={toggleSelectAll} />
                  <label htmlFor="selectAll" className="text-xs font-medium cursor-pointer select-none">Pilih Semua</label>
                </div>
              </div>

              <div className="border rounded-xl divide-y bg-background">
                {plan?.menus?.map(menu => (
                  <div
                    key={menu.menuId}
                    className={cn(
                      'px-3 py-2.5 flex items-center justify-between transition-colors',
                      selectedMenus[menu.menuId] ? 'bg-muted/20' : ''
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`menu-${menu.menuId}`}
                        checked={selectedMenus[menu.menuId] || false}
                        onCheckedChange={() => toggleMenu(menu.menuId)}
                      />
                      <label htmlFor={`menu-${menu.menuId}`} className="text-sm font-medium cursor-pointer select-none">
                        {menu.name}
                      </label>
                    </div>

                    {mode === 'beda_per_menu' && selectedMenus[menu.menuId] && (
                      <div className="relative w-24">
                        <Input
                          type="number" min="1" max="100"
                          value={menuPercents[menu.menuId] || ''}
                          onChange={e => setMenuPercents(prev => ({ ...prev, [menu.menuId]: e.target.value }))}
                          className="h-8 pr-7 font-mono text-sm"
                          required
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (editPromo ? 'Simpan Perubahan' : 'Tambah Diskon')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
