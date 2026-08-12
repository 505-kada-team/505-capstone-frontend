import { TriangleAlert } from 'lucide-react';

/**
 * WarningBanner.jsx — components/shared/
 *
 * Banner peringatan non-blocking sesuai DESIGN.md §5b: border kiri tebal
 * warna `warning`, ikon triangle-alert, teks singkat. BUKAN toast — harus
 * tetap kelihatan selama user ada di halaman itu, jadi nggak ada tombol
 * dismiss/auto-hide di sini.
 *
 * Generik (nggak tau soal inventory/kasir), jadi bisa dipakai di halaman
 * manapun yang butuh peringatan sejenis (misal Admin: batch nyaris
 * kadaluarsa, dsb) — bukan cuma InventoryPage.
 *
 * Props:
 *   title    : string
 *   messages : string[] — ditampilkan sebagai bullet list
 */
export default function WarningBanner({ title, messages }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="flex gap-3 rounded-md border-l-4 border-warning bg-warning/10 p-4">
      <TriangleAlert size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-warning" />
      <div>
        <p className="text-sm font-semibold text-warning">{title}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-foreground">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}