import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Calendar as CalendarIcon, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DiscountDetailModal({ isOpen, onClose, promo, onEdit, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !promo) return null;

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus promo diskon ini dari semua menu terkait?')) {
      setIsDeleting(true);
      try {
        await onDelete(promo);
        onClose();
      } catch (err) {
        toast.error('Gagal menghapus diskon');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Detail Diskon</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Informasi Utama */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Informasi Utama</h4>
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Nama Promo</span>
                <p className="font-semibold text-sm">{promo.reason}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Periode</span>
                <div className="flex items-center text-sm font-medium gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(new Date(promo.startDate), 'd MMM yyyy')} – {format(new Date(promo.endDate), 'd MMM yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Menu */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Daftar Menu Diskon</h4>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-semibold">{promo.menus.length} Menu</span>
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Nama Menu</th>
                    <th className="px-4 py-2.5 font-medium text-right">Harga Asli</th>
                    <th className="px-4 py-2.5 font-medium text-center">Diskon</th>
                    <th className="px-4 py-2.5 font-medium text-right">Harga Promo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {promo.menus.map((menu, idx) => (
                    <tr key={idx} className="bg-background">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          {menu.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        Rp {menu.originalPrice?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md text-xs">
                          {menu.discountPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        Rp {menu.discountedPrice?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Promo
          </Button>
          <Button type="button" onClick={() => { onClose(); onEdit(promo); }}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Diskon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
