import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Lightbulb,
  Percent,
  Tag,
} from "lucide-react";
import { usePlanDiscountForm } from "@/hooks/plan/usePlanDiscountForm";
import { cn } from "@/lib/utils";

export default function DiscountModal({
  isOpen,
  onClose,
  plan,
  planId,
  initialSelectedMenuId,
  editPromo,
  onApply,
}) {
  const {
    reason,
    setReason,
    date,
    setDate,
    mode,
    setMode,
    globalPercent,
    setGlobalPercent,
    selectedMenus,
    toggleMenu,
    toggleSelectAll,
    allSelected,
    menuPercents,
    setMenuPercent,
    isSubmitting,
    submit,
  } = usePlanDiscountForm({
    isOpen,
    plan,
    planId,
    editPromo,
    initialSelectedMenuId,
    onApplied: onApply,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await submit();
    if (ok) onClose();
  };

  if (!isOpen) return null;

  const tomorrow = new Date().getTime() + 24 * 60 * 60 * 1000;
  const minDate = plan?.startDate
    ? new Date(Math.max(tomorrow, new Date(plan.startDate).getTime()))
    : new Date(tomorrow);
  const maxDate = plan?.endDate ? new Date(plan.endDate) : undefined;

  const selectedCount = Object.values(selectedMenus).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg sm:max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-full">
        {/* Header */}
        <DialogHeader className="shrink-0 space-y-1.5 border-b bg-background px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tag className="h-4 w-4" />
            </span>
            <span className="translate-y-[3px]">
              {/* or -1px */}
              {editPromo ? "Edit Discount Rule" : "Add Discount Rule"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Set the promo name, validity period, and discount amount for the
            menus in this plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {/* Promo Name + Date Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" htmlFor="promo-name">
                  Promo Name
                </label>
                <Input
                  id="promo-name"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter promo name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date?.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {date?.from
                          ? date.to
                            ? `${format(date.from, "dd/MM/yy")} – ${format(date.to, "dd/MM/yy")}`
                            : format(date.from, "dd MMM yyyy")
                          : "Select date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    sideOffset={8}
                  >
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from || minDate}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={1}
                      className="sm:hidden"
                      disabled={(d) => {
                        const day = new Date(d).setHours(0, 0, 0, 0);
                        const min = new Date(minDate).setHours(0, 0, 0, 0);
                        const max = maxDate
                          ? new Date(maxDate).setHours(23, 59, 59, 999)
                          : null;
                        return day < min || (max && day > max);
                      }}
                    />
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from || minDate}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                      className="hidden sm:block"
                      disabled={(d) => {
                        const day = new Date(d).setHours(0, 0, 0, 0);
                        const min = new Date(minDate).setHours(0, 0, 0, 0);
                        const max = maxDate
                          ? new Date(maxDate).setHours(23, 59, 59, 999)
                          : null;
                        return day < min || (max && day > max);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Discount Scheme */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Discount Scheme</label>
              <Tabs value={mode} onValueChange={setMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sama_rata">Equal</TabsTrigger>
                  <TabsTrigger value="beda_per_menu">Per Menu</TabsTrigger>
                </TabsList>
              </Tabs>

              {mode === "sama_rata" && (
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3.5 sm:flex-row sm:items-stretch">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Discount Amount
                    </label>
                    <div className="relative w-full sm:w-28">
                      <Percent className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={globalPercent}
                        onChange={(e) => setGlobalPercent(e.target.value)}
                        className="pl-8 font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600">
                    <Lightbulb className="h-4 w-4 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      Ensure the discount covers COGS so the plan remains
                      profitable.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Menu List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold">
                  Menu List
                  {selectedCount > 0 && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {selectedCount} selected
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="selectAll"
                    className="cursor-pointer select-none text-xs font-medium"
                  >
                    Select All
                  </label>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border bg-background">
                <div className="divide-y">
                  {plan?.menus?.map((menu) => (
                    <div
                      key={menu.menuId}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/30",
                        selectedMenus[menu.menuId] && "bg-muted/30",
                      )}
                    >
                      <div className="flex min-w-0 items-center space-x-3">
                        <Checkbox
                          id={`menu-${menu.menuId}`}
                          checked={selectedMenus[menu.menuId] || false}
                          onCheckedChange={() => toggleMenu(menu.menuId)}
                        />
                        <label
                          htmlFor={`menu-${menu.menuId}`}
                          className="cursor-pointer select-none truncate text-sm font-medium"
                        >
                          {menu.name}
                        </label>
                      </div>

                      {mode === "beda_per_menu" &&
                        selectedMenus[menu.menuId] && (
                          <div className="relative ml-auto w-24 shrink-0">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={menuPercents[menu.menuId] || ""}
                              onChange={(e) =>
                                setMenuPercent(menu.menuId, e.target.value)
                              }
                              className="h-8 pr-7 font-mono text-sm"
                              required
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              %
                            </span>
                          </div>
                        )}
                    </div>
                  ))}

                  {(!plan?.menus || plan.menus.length === 0) && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No menus in this plan yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:justify-end sm:px-6 mb-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? "Saving..."
                : editPromo
                  ? "Save Changes"
                  : "Add Discount"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
