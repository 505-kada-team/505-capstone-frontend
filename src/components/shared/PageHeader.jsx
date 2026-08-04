/**
 * PageHeader.jsx — components/shared/
 *
 * Header generik untuk semua halaman admin & kasir.
 * Props:
 *   title    : string — judul halaman (H1)
 *   subtitle : string (opsional) — deskripsi singkat di bawah judul
 *   action   : ReactNode (opsional) — tombol atau elemen lain di kanan atas
 */

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
