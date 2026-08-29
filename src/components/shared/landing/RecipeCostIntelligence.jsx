import { ChefHat } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/card';

export default function RecipeCostIntelligence({ recipe }) {
  return (
    <section className="mx-auto max-w-content px-8 py-20 bg-muted/20">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="Recipe & Cost" title="Recipe & Cost Intelligence" description="Every ingredient is connected to a menu recipe, so cost, margin, and expected consumption are always known — not estimated." />
          <p className="mt-6 font-body text-sm leading-relaxed text-foreground/70">Recipe-based consumption creates expected inventory usage automatically, which keeps portions consistent and stock counts accurate after every sale.</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/50 text-foreground">
              <ChefHat size={18} strokeWidth={2} />
            </span>
            <span className="font-display text-base font-semibold text-foreground">{recipe.name}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4">
            <div>
              <p className="font-body text-xs text-foreground/60">Ingredient Cost</p>
              <p className="mt-1 font-mono text-base font-semibold text-foreground">{recipe.ingredientCost}</p>
            </div>
            <div>
              <p className="font-body text-xs text-foreground/60">Selling Price</p>
              <p className="mt-1 font-mono text-base font-semibold text-foreground">{recipe.sellingPrice}</p>
            </div>
            <div>
              <p className="font-body text-xs text-foreground/60">Estimated Margin</p>
              <p className="mt-1 font-mono text-base font-semibold text-success">{recipe.margin}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-foreground/60">Ingredient Requirements</p>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name} className="flex items-center justify-between font-body text-sm">
                  <span className="text-foreground">{ing.name}</span>
                  <span className="font-mono text-foreground/60">{ing.amount}</span>
                  <span className="font-mono text-foreground/60">{ing.cost}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </section>
  );
}
