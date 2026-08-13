// RecipeCard.jsx
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/formatCurrency";
import { ImageIcon, ArrowRight } from "lucide-react";

export default function RecipeCard({ recipe, onDetail }) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
      <div className="relative aspect-square w-full flex-shrink-0 bg-muted overflow-hidden">
        <div className="absolute top-2 left-2 z-10">
          <StatusBadge variant={recipe.status} />
        </div>
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
            <ImageIcon size={32} className="opacity-20" />
          </div>
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-1 mb-0.5">
          {recipe.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-2 flex-1 line-clamp-1">
          {recipe.totalIngredients} bahan
          {recipe.costComplete && typeof recipe.marginPercentage === "number"
            ? ` · margin ${recipe.marginPercentage.toFixed(0)}%`
            : ""}
        </p>

        <div className="flex items-end justify-between mt-auto gap-1">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">Price</p>
            <p className="font-mono text-xs text-foreground truncate">
              {recipe.costComplete
                ? formatCurrency(recipe.sellingPrice)
                : "Rp -"}
            </p>
          </div>
          <button
            onClick={onDetail}
            className="shrink-0 text-xs font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-0.5"
          >
            Detail
            <ArrowRight
              size={12}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
