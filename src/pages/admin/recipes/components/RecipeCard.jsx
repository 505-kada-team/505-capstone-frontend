import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
<<<<<<< HEAD
import { formatCurrency } from "@/lib/formatCurrency";
=======
import { formatCurrency } from "@/lib/FormatCurrency";
>>>>>>> f9bcf2747526b3bcef7968793918086e241b1847
import { ImageIcon } from "lucide-react";

export default function RecipeCard({ recipe, onDetail }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative h-48 bg-muted w-full flex-shrink-0">
        <div className="absolute top-3 left-3 z-10">
          <StatusBadge variant={recipe.status} />
        </div>
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
            <ImageIcon size={48} className="opacity-20" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-semibold text-lg text-foreground line-clamp-1 mb-1">
          {recipe.name}
        </h3>
<<<<<<< HEAD
        {/* getMenus() (list endpoint) tidak mengembalikan description — pakai field yang memang ada di mapMenuListItem */}
=======
        {/* getMenus() tidak mengembalikan description — pakai field yang memang ada di list response */}
>>>>>>> f9bcf2747526b3bcef7968793918086e241b1847
        <p className="text-xs text-muted-foreground mb-4 flex-1">
          {recipe.totalIngredients} bahan
          {recipe.costComplete && typeof recipe.marginPercentage === "number"
            ? ` · margin ${recipe.marginPercentage.toFixed(0)}%`
            : ""}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Ext. Cost</p>
            <p className="font-mono text-sm text-foreground">
              {recipe.costComplete
                ? formatCurrency(recipe.currentCostEstimate)
                : "Rp -"}
            </p>
          </div>
          <button
            onClick={onDetail}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
          >
            Detail <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
