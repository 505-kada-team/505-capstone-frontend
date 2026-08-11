/**
 * ConfirmDialog.jsx — components/shared/
 *
 * Dialog konfirmasi generik untuk aksi destruktif (arsip, hapus, reverse, dll).
 * Gunakan komponen ini — JANGAN buat confirm dialog baru di tiap halaman.
 *
 * Props:
 *   open         : boolean
 *   onClose      : () => void — dipanggil saat dialog ditutup (Cancel atau X)
 *   onConfirm    : () => void | Promise<void> — aksi yang dikonfirmasi
 *   title        : string — judul dialog
 *   description  : string | ReactNode — penjelasan konsekuensi aksi
 *   confirmLabel : string (default: 'Konfirmasi')
 *   cancelLabel  : string (default: 'Batal')
 *   variant      : 'destructive' | 'default' (default: 'destructive') — warna tombol konfirmasi
 *   loading      : boolean — tombol disabled + teks "Memproses..."
 */

import { TriangleAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel  = 'Batal',
  variant      = 'destructive',
  loading      = false,
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-sm" id="confirm-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TriangleAlert size={18} strokeWidth={2} className="text-destructive shrink-0" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            id="confirm-dialog-cancel"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            id="confirm-dialog-confirm"
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
