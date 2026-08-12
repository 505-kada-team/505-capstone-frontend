import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function ComingSoonCard({ title, description, icon: Icon = Sparkles, className = "" }) {
  return (
    <Card className={`border-dashed border-border/80 bg-muted/10 opacity-80 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold font-heading text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center py-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded">
          Coming Soon
        </span>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 max-w-[220px] leading-relaxed">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
