import { AlertTriangle, History } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL = {
  success: 'In Stock',
  warning: 'Low Stock',
};

const STATUS_CLASS = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
};

export default function SmartInventory({ batches = [], movements = [] }) {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Inventory"
          title="Know What You Have—and What Should Be Used First."
          description="Track ingredients by batch, monitor expiration dates, and understand where every unit of stock goes."
        />

        <Card className="mt-10 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Inventory Batches
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Real-time stock and expiration visibility
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-normal">
                Batch Tracking
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Ingredient
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Batch Code
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Expiry Date
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Available Stock
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((batch) => {
                    const Icon = batch.icon;

                    return (
                      <tr
                        key={`${batch.name}-${batch.batchCode}`}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Icon size={14} strokeWidth={2} />
                              </div>
                            )}

                            <span className="text-xs font-medium text-foreground">
                              {batch.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {batch.batchCode ?? '—'}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {batch.expiry ?? '—'}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                          {batch.stock ?? '—'}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_CLASS[batch.status] ?? ''}`}
                          >
                            {STATUS_LABEL[batch.status] ?? batch.status ?? 'Unknown'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-warning/30 bg-warning/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                  <AlertTriangle size={15} strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Approaching Expiry
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    Matcha Powder and Fresh Milk are within 5 days of expiry.
                    Prioritize them in the next production plan to reduce potential waste.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <History size={15} strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Inventory Movement History
                  </h3>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Recent stock changes and operational activity
                  </p>
                </div>
              </div>

              <div className="mt-3 divide-y divide-border">
                {movements.map((move) => (
                  <div
                    key={`${move.item}-${move.date}`}
                    className="grid gap-2 py-2.5 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-5"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {move.item}
                      </p>

                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {move.reason ?? 'Inventory movement'}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-medium text-foreground">
                      {move.change}
                    </span>

                    <span className="font-mono text-[11px] text-muted-foreground">
                      {move.date}
                    </span>
                  </div>
                ))}

                {movements.length === 0 && (
                  <p className="py-4 text-xs text-muted-foreground">
                    No recent inventory movements.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}