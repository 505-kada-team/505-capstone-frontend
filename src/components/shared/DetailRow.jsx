/**
 * DetailRow.jsx — components/shared/
 *
 * Baris "Label : Value" di panel/modal detail — generik, nggak tau
 * konteksnya invoice/report issue/apapun. Dipakai pertama kali di
 * InvoicePage.jsx (No. Invoice, Tanggal, Cashier name), tapi
 * bentuknya reusable buat modal detail manapun.
 *
 * Props:
 *   label    : string
 *   children : ReactNode — nilainya
 */
export default function DetailRow({ label, children }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">: {children}</span>
    </div>
  );
}