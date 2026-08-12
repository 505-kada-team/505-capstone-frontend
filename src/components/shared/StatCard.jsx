import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, subtitle, icon: Icon, className = "" }) {
  return (
    <Card className={`bg-card border-border shadow-xs ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
