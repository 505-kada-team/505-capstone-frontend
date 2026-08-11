import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Modal.jsx — components/shared/
 *
 * Shell generik untuk semua modal di app — cuma urusan buka/tutup,
 * overlay, dan struktur header/body. TIDAK tahu apa-apa soal konten
 * di dalamnya — itu ditentukan pemanggil lewat `children`.
 *
 * Props:
 *   open         : boolean
 *   onOpenChange : (open: boolean) => void
 *   title        : string (opsional) — kalau diisi, render DialogHeader
 *   children     : ReactNode — isi modal, biasanya komponen page-specific
 *   className    : string (opsional) — buat atur lebar (misal max-w-lg)
 *
 * Contoh pakai (isi di pages/, bukan di sini):
 *   <Modal open={open} onOpenChange={setOpen} title="Detail Invoice" className="max-w-lg">
 *     <InvoiceDetailContent invoice={invoice} onPrint={handlePrint} />
 *   </Modal>
 */
export default function Modal({ open, onOpenChange, title, children, className }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('gap-0 overflow-hidden p-0', className)}>
        {title && (
          <DialogHeader className="border-b border-neutral-200 px-6 py-4">
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}