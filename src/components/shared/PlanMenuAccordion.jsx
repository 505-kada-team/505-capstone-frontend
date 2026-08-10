import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import StatusBadge from './StatusBadge';

export default function PlanMenuAccordion({ 
  // menuId, // pass this if needed as value
  menuName, 
  badges = [], 
  summary = {}, 
  ingredients = [],
  defaultOpen = false
}) {
  const formatRp = (num) => num != null ? `Rp ${num.toLocaleString('id-ID')}` : '-';

  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? 'item-1' : ''} className="w-full">
      <AccordionItem value="item-1" className="border rounded-lg mb-4 bg-card px-4 border-destructive/20 data-[state=open]:border-destructive/30">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center justify-between w-full pr-4">
            <span className="font-bold text-[#C4441F]">{menuName}</span>
            <div className="flex items-center gap-4">
              {summary.discountPercent > 0 && (
                <span className="text-sm font-bold text-[#C4441F]">{summary.discountPercent}%</span>
              )}
              <div className="flex gap-2">
                {badges.map((b, i) => (
                  <StatusBadge key={i} variant={b} />
                ))}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="flex flex-col gap-6">
            {/* Summary Finansial */}
            <div className={`bg-muted/10 border border-muted-foreground/20 rounded-md p-4 grid gap-y-4 gap-x-6 text-sm ${
              summary.discountPercent > 0 ? 'grid-cols-6' : 'grid-cols-3'
            }`}>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">jumlah</span>
                <span className="font-mono">{summary.quantity} cup</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">harga jual</span>
                <span className="font-mono">{formatRp(summary.originalPrice)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">estimasi profit</span>
                <span className="font-mono">{formatRp(summary.estimatedProfit)}</span>
              </div>
              
              {summary.discountPercent > 0 && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">diskon</span>
                    <span className="font-mono">{summary.discountPercent}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">harga jual baru</span>
                    <span className="font-mono">{formatRp(summary.newPrice)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">estimasi profit baru</span>
                    <span className="font-mono">{formatRp(summary.newProfit)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Tabel Ingredients */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-2 font-medium">nama item</th>
                    <th className="py-2 font-medium text-center">butuh</th>
                    <th className="py-2 font-medium text-center">tersedia</th>
                    <th className="py-2 font-medium text-center">kurang</th>
                    <th className="py-2 font-medium text-center">kadaluarsa</th>
                    <th className="py-2 font-medium">status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ingredients.map((ing, i) => (
                    <tr key={i} className="hover:bg-muted/5">
                      <td className="py-3 font-medium text-foreground">{ing.name}</td>
                      <td className="py-3 font-mono text-center">{ing.needed}</td>
                      <td className="py-3 font-mono text-center">{ing.available}</td>
                      <td className="py-3 font-mono text-center text-destructive">{ing.shortage || '-'}</td>
                      <td className="py-3 font-mono text-center">{ing.expired || '-/-/-'}</td>
                      <td className="py-3">
                        <StatusBadge variant={ing.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
