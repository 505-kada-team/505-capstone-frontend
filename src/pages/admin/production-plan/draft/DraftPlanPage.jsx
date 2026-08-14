import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { History, ArrowLeft } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planApi } from "@/services/plan/plan.api";
import { getMenuList } from "@/services/api";
import { getSalesPredictions } from "@/AI/contextEngine/contextEngineApi";
import PlanDetailModal from "./components/PlanDetailModal";
import PlanHistoryView from "./components/PlanHistoryView";

/**
 * ─────────────────────────────────────────────────────────────────────
 * `step` bisa berupa:
 *   1                 → form Plan Title / Start Date / End Date (manual)
 *   "forecast-input"  → form input untuk ML (duration / startDate / tags)
 *   2                 → tabel cart (bisa diedit, sebelum Create Plan) --
 *                        diisi manual ATAU otomatis dari hasil ML forecast
 * ─────────────────────────────────────────────────────────────────────
 */
export default function DraftPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const isHistoryView = searchParams.get("view") === "history";
  const editPlanId = searchParams.get("edit");

  const goToHistory = () => setSearchParams({ view: "history" });
  const goToNewPlan = () => setSearchParams({});

  const [step, setStep] = useState(editPlanId ? 2 : 1);

  // API State
  const [availableMenus, setAvailableMenus] = useState([]);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(!!editPlanId);

  // Form State
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tags, setTags] = useState("");

  // Forecast input State (form kedua, sebelum manggil ML)
  const [forecastDuration, setForecastDuration] = useState("7");
  const [forecastStartDate, setForecastStartDate] = useState("");
  const [forecastTags, setForecastTags] = useState("");

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (editPlanId) {
      setStep(2);
    } else {
      setStep(1);
      setPlanName("");
      setStartDate("");
      setEndDate("");
      setCart([]);
    }
  }, [editPlanId]);

  useEffect(() => {
    if (!editPlanId) {
      setIsLoadingPlan(false);
      return;
    }
    setIsLoadingPlan(true);
    planApi
      .detail(editPlanId)
      .then((res) => {
        const plan = res?.data;
        if (!plan) {
          toast.error("Plan not found");
          goToHistory();
          return;
        }
        setPlanName(plan.name || "");
        const sd = plan.startDate ? new Date(plan.startDate) : null;
        const ed = plan.endDate ? new Date(plan.endDate) : null;
        if (sd) setStartDate(sd.toISOString().split("T")[0]);
        if (ed) setEndDate(ed.toISOString().split("T")[0]);
        if (Array.isArray(plan.menus)) {
          setCart(
            plan.menus.map((m) => ({
              _id: m.menuId,
              name: m.name || "Menu",
              price: m.frozenSellingPrice || m.effectiveSellingPrice || 0,
              qty: m.quantityPlanned || 0,
              subtotal:
                (m.frozenSellingPrice || m.effectiveSellingPrice || 0) *
                (m.quantityPlanned || 0),
            })),
          );
        }
      })
      .catch(() => {
        toast.error("Failed to load plan data");
        goToHistory();
      })
      .finally(() => setIsLoadingPlan(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPlanId]);

  useEffect(() => {
    if (step === 2 && availableMenus.length === 0) {
      loadAvailableMenus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function loadAvailableMenus() {
    try {
      const res = await getMenuList();
      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const menus = data
        // Cuma menu yang BENERAN punya resep (>= 1 ingredient) & harga
        // valid yang dianggap "ada di recipes". getMenuDropdown() yang
        // dipakai sebelumnya gak nyertain info ini sama sekali, jadi menu
        // tanpa resep bisa lolos tanpa sengaja.
        .filter(
          (m) => (m.totalIngredients ?? 0) > 0 && (m.sellingPrice ?? 0) > 0,
        )
        .map((m) => ({
          ...m,
          _id: m._id || m.id,
          name: m.name || m.menuName || "Unnamed Menu",
          sellingPrice: m.sellingPrice || 0,
          // ML cuma butuh JUMLAH ingredient (pakai len()), bukan isinya --
          // getMenuList() cuma balikin totalIngredients (angka), bukan
          // array penuh, jadi kita bikin array placeholder sepanjang itu
          // biar fitur ingredient_count di ML sekarang akurat, gak selalu 0.
          ingredients: new Array(m.totalIngredients ?? 0).fill({}),
        }));
      setAvailableMenus(menus);
      return menus;
    } catch {
      toast.error("Failed to load menu");
      return [];
    }
  }

  const handleNext = () => {
    if (!planName || !startDate || !endDate) {
      toast.error("Please complete plan name and period");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toast.error("End date cannot be before start date");
      return;
    }

    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (duration < 7 || duration > 30) {
      toast.error("Plan duration must be between 7-30 days");
      return;
    }

    setStep(2);
  };

  const openForecastInput = () => {
    if (startDate) setForecastStartDate(startDate);
    setStep("forecast-input");
  };

  // ── Submit form forecast input -> panggil ML -> LANGSUNG isi cart (step 2) ──
  const handleForecastSubmit = async () => {
    if (!forecastStartDate) {
      toast.error("Please fill in Start Date");
      return;
    }

    const duration = Number(forecastDuration);
    if (!duration || duration < 7 || duration > 30) {
      toast.error("Duration must be between 7-30 days");
      return;
    }

    setIsForecasting(true);
    try {
      let menus = availableMenus;
      if (menus.length === 0) {
        menus = await loadAvailableMenus();
      }

      const tags = forecastTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { data: predictions } = await getSalesPredictions({
        duration,
        startDate: new Date(forecastStartDate),
        tags,
        menus: menus.map((m) => ({
          _id: m._id,
          name: m.name,
          sellingPrice: m.sellingPrice,
          ingredients: m.ingredients ?? [],
        })),
      });

      // Cuma menu yang beneran ketemu di daftar resep (availableMenus) yang
      // ikut masuk cart. Kalau ML balikin menuId yang gak match apapun di
      // sini (misal udah dihapus/diarsipkan sejak terakhir sinkron), item
      // itu di-skip diam-diam -- bukan dianggap "Unknown Menu".
      const forecastCart = predictions
        .map((p) => {
          const menu = menus.find((m) => m._id === p.menuId);
          if (!menu) return null;
          return {
            _id: menu._id,
            name: menu.name,
            price: menu.sellingPrice,
            qty: p.quantity,
            subtotal: menu.sellingPrice * p.quantity,
          };
        })
        .filter(Boolean);

      if (forecastCart.length === 0) {
        toast.error("None of the recommended menus matched your recipes");
      } else if (forecastCart.length < predictions.length) {
        toast.success(
          `${forecastCart.length} of ${predictions.length} recommended menus matched and were added`,
        );
      } else {
        toast.success(
          `${forecastCart.length} menu items loaded from ML forecast`,
        );
      }

      setCart(forecastCart);

      const sd = new Date(forecastStartDate);
      const ed = new Date(sd.getTime() + duration * 24 * 60 * 60 * 1000);
      setStartDate(sd.toISOString().split("T")[0]);
      setEndDate(ed.toISOString().split("T")[0]);

      setStep(2);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch ML forecast");
    } finally {
      setIsForecasting(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedMenu || !quantity || Number(quantity) <= 0) return;
    const menu = availableMenus.find((m) => m._id === selectedMenu);
    if (!menu) return;

    setCart([
      ...cart,
      {
        _id: menu._id,
        name: menu.name,
        price: menu.sellingPrice,
        qty: Number(quantity),
        subtotal: menu.sellingPrice * Number(quantity),
      },
    ]);

    setSelectedMenu("");
    setQuantity("1");
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleUpdateQuantity = (index, newQty) => {
    const qty = Math.max(0, Number(newQty) || 0);
    const newCart = [...cart];
    newCart[index] = {
      ...newCart[index],
      qty,
      subtotal: newCart[index].price * qty,
    };
    setCart(newCart);
  };

  const cartColumns = [
    {
      key: "name",
      header: "Menu",
      render: (row) => (
        <span className="text-foreground capitalize">{row.name}</span>
      ),
    },
    {
      key: "qty",
      header: "Quantity",
      headerClass: "text-center",
      cellClass: "text-center font-mono",
      render: (row) => (
        <Input
          type="number"
          min="0"
          value={row.qty}
          onChange={(e) =>
            handleUpdateQuantity(cart.indexOf(row), e.target.value)
          }
          className="w-24 h-8 text-center font-mono mx-auto"
        />
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      cellClass: "font-mono",
      render: (row) => formatRp(row.subtotal),
    },
    {
      key: "action",
      header: "Action",
      headerClass: "text-center",
      cellClass: "text-center",
      render: (row) => (
        <button
          className="text-destructive text-sm hover:underline"
          onClick={() => handleRemoveFromCart(cart.indexOf(row))}
        >
          Remove
        </button>
      ),
    },
  ];

  const totalEstimated = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const formatRp = (num) => `Rp ${num.toLocaleString("id-ID")}`;

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      toast.error("Plan title is required");
      return;
    }

    if (cart.length === 0) {
      toast.error("Choose at least one menu");
      return;
    }

    const invalidItem = cart.find((item) => !item.qty || item.qty <= 0);
    if (invalidItem) {
      toast.error(`Quantity for "${invalidItem.name}" must be greater than 0`);
      return;
    }
    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.max(
        1,
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      );

      const payload = {
        name: planName,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        startDate: new Date(startDate).toISOString(),
        duration,
        menus: cart.map((item) => ({
          menuId: item._id,
          quantityPlanned: item.qty,
        })),
      };

      if (editPlanId) {
        const res = await planApi.update(editPlanId, payload);
        if (res?.data?._id) {
          toast.success(res.message || "Plan updated");
          goToHistory();
        } else {
          toast.error(res?.message || "Failed to update plan");
        }
      } else {
        const res = await planApi.create(payload);
        const planData = res?.data;
        if (planData?._id) {
          toast.success(res.message || "Plan created");
          setCreatedPlanId(planData._id);
        } else {
          toast.error(res?.message || "Failed to create draft plan");
        }
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "System error";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isHistoryView) {
    return (
      <div className="flex flex-col h-full">
        <PlanHistoryView onNavigateToCreate={goToNewPlan} />
      </div>
    );
  }

  if (isLoadingPlan) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Draft Plan"
          subtitle="Plan your selling and estimate the flow"
        />
        <Card className="w-full shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading plan data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <PageHeader
          title="Draft Plan"
          subtitle="Plan your selling and estimate the flow"
        />

        <Button
          className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium shrink-0 self-start sm:self-auto"
          onClick={goToHistory}
        >
          <History className="w-4 h-4" />
          Plan History
        </Button>
      </div>

      <CardContent>
        {step === 1 && (
          <div className="border border-border/80 rounded-xl p-4 sm:p-6 flex flex-col gap-6 bg-background">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Plan Title
              </label>
              <Input
                placeholder="Enter plan title"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Tags (optional, comma separated)
              </label>
              <Input
                placeholder="promo, discount"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground capitalize">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground capitalize">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  max={
                    startDate
                      ? new Date(
                          new Date(startDate).getTime() +
                            30 * 24 * 60 * 60 * 1000,
                        )
                          .toISOString()
                          .split("T")[0]
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
              <Button
                variant="outline"
                className="border-border hover:bg-muted"
                onClick={openForecastInput}
              >
                Create from Forecast
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-6"
                onClick={handleNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "forecast-input" && (
          <div className="border border-border/80 rounded-xl p-4 sm:p-6 flex flex-col gap-6 bg-background">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Duration (days, 7-30)
              </label>
              <Input
                type="number"
                min="7"
                max="30"
                value={forecastDuration}
                onChange={(e) => setForecastDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Start Date
              </label>
              <Input
                type="date"
                value={forecastStartDate}
                onChange={(e) => setForecastStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Tags (optional, comma separated)
              </label>
              <Input
                placeholder="promo, discount"
                value={forecastTags}
                onChange={(e) => setForecastTags(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
              <Button
                variant="outline"
                className="border-border hover:bg-muted"
                onClick={() => setStep(1)}
                disabled={isForecasting}
              >
                Back
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-6"
                onClick={handleForecastSubmit}
                disabled={isForecasting}
              >
                {isForecasting ? "Predicting..." : "Next"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="border border-border/80 rounded-xl p-4 sm:p-6 mt-4 flex flex-col gap-6 bg-background">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground capitalize">
                Plan Title
              </label>
              <Input
                placeholder="Enter plan title"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                <SelectTrigger className="w-full" style={{ height: "2.75rem" }}>
                  <SelectValue placeholder="Select menu item...">
                    {(value) => {
                      if (!value) return "Select menu item...";
                      const found = availableMenus.find((m) => m._id === value);
                      return found ? found.name : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMenus.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-full sm:w-32 space-y-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ height: "2.75rem" }}
                />
              </div>

              <Button
                variant="secondary"
                onClick={handleAddToCart}
                className="w-full sm:w-auto bg-[#E6D5C3] text-primary hover:bg-[#E6D5C3]/80 border border-[#E6D5C3]/40 px-6 font-medium shrink-0"
                style={{ height: "2.75rem" }}
              >
                Add
              </Button>
            </div>

            <div className="w-full min-w-0 rounded-lg border border-border bg-card shadow-sm overflow-x-auto mt-2">
              <DataTable
                columns={cartColumns}
                data={cart}
                emptyMessage="No menu added yet"
                loading={false}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground capitalize font-medium">
                  Total Estimated (Selling Price)
                </span>
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatRp(totalEstimated)}
                </span>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium px-6"
                  onClick={handleCreatePlan}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Processing..."
                    : editPlanId
                      ? "Update Plan"
                      : "Create Plan"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <PlanDetailModal
        isOpen={!!createdPlanId}
        onClose={() => setCreatedPlanId(null)}
        planId={createdPlanId}
      />
    </div>
  );
}
