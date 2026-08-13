import { Coffee } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Coffee size={14} strokeWidth={2} />
          </span>
          <span className="font-display text-sm font-semibold text-foreground">Artisan Inventory</span>
        </div>
        <p className="font-body text-xs text-foreground/50">
          © {new Date().getFullYear()} Artisan Inventory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
