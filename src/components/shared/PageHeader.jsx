/**
 * PageHeader.jsx — components/shared/
 *
 * Header generik untuk semua halaman admin & kasir.
 * Props:
 *   title    : string — judul halaman (H1)
 *   subtitle : string (opsional) — deskripsi singkat di bawah judul
 *   action   : ReactNode (opsional) — tombol atau elemen lain di kanan atas
 */

export default function PageHeader({ title, subtitle, badges = [], action }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold font-heading text-foreground leading-tight">
            {title}
          </h1>

          {badges.map((badge, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700"
            >
              {badge.label}
            </span>
          ))}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>

      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
