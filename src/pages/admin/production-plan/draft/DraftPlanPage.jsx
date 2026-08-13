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
import { getMenuDropdown } from "@/services/api"; // kept temporarily for menu dropdown
import PlanDetailModal from "./components/PlanDetailModal";
import PlanHistoryView from "./components/PlanHistoryView";

/**
 * ─────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH: URL search params.
 *
 * Sebelumnya ada 2 sumber kebenaran yang saling rebutan: `view` (local
 * state) dan `editPlanId` (dari URL). Karena keduanya nggak otomatis
 * saling sinkron, tiap penambahan kondisi baru (back button, sukses
 * update, dst) harus manual nge-patch salah satunya — dan gampang
 * kelewat, itu yang bikin "back" tadi malah balik ke draft, bukan
 * history.
 *
 * Sekarang cuma ada SATU pintu masuk untuk pindah mode: `goTo...()`
 * helper di bawah, yang selalu lewat `setSearchParams()`. Local state
 * (`step`, form fields, cart) murni turunan/reaksi dari situ lewat
 * `useEffect`, nggak pernah jadi sumber kebenaran independen.
 *
 * Query params yang dipakai:
 *   ?view=history        → tampilkan PlanHistoryView
 *   ?edit=<planId>        → mode edit, load data plan tsb
 *   (tanpa param)          → mode create (form kosong)
 * ─────────────────────────────────────────────────────────────────────
 */
export default function DraftPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const isHistoryView = searchParams.get("view") === "history";
  const editPlanId = searchParams.get("edit");

  // ── Navigasi mode: SATU pintu masuk, dipakai di semua tombol ──────
  const goToHistory = () => setSearchParams({ view: "history" });
  const goToNewPlan = () => setSearchParams({}); // reset total: form create kosong

  const [step, setStep] = useState(editPlanId ? 2 : 1);

  // API State
  const [availableMenus, setAvailableMenus] = useState([]);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(!!editPlanId);

  // Form State
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [quantity, setQuantity] = useState("1");

  // ── Sinkronkan step & form dengan editPlanId setiap kali berubah ──
  // Ini satu-satunya tempat yang boleh reset step secara implisit,
  // supaya nggak ada dua tempat berbeda yang berebut nentuin step.
  useEffect(() => {
    if (editPlanId) {
      setStep(2);
    } else {
      // Balik ke mode create murni → form harus kosong, bukan
      // ninggalin sisa data dari sesi edit sebelumnya.
      setStep(1);
      setPlanName("");
      setStartDate("");
      setEndDate("");
      setCart([]);
    }
  }, [editPlanId]);

  // Load existing plan data for edit mode
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

  // Load menu dropdown for step 2
  useEffect(() => {
    if (step === 2 && availableMenus.length === 0) {
      getMenuDropdown()
        .then((res) => {
          let data = null;
          if (Array.isArray(res?.data?.data)) {
            data = res.data.data;
          } else if (Array.isArray(res?.data)) {
            data = res.data;
          }

          if (Array.isArray(data) && data.length > 0) {
            setAvailableMenus(
              data.map((m) => ({
                ...m,
                _id: m._id || m.id,
                name: m.name || m.menuName || "Unnamed Menu",
                sellingPrice: m.sellingPrice || 0,
              })),
            );
          }
        })
        .catch(() => toast.error("Failed to load menu"));
    }
  }, [step, availableMenus.length]);

  const handleNext = () => {
    if (!planName || !startDate || !endDate) {
      toast.error("Please complete plan name and period");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    setStep(2);
  };

  const handleForecast = () => {
    toast.success("Data pulled from forecast (Mock)");
    setPlanName("Forecast Plan - Agustus");
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    setEndDate(nextWeek.toISOString().split("T")[0]);
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

  // Definisi kolom untuk DataTable
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
      render: (row) => row.qty,
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
    if (cart.length === 0) {
      toast.error("Choose at least one menu");
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
        tags: [],
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
          goToHistory(); // ← selalu balik ke history setelah update, sesuai requirement
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

  // ── Mode: history ───────────────────────────────────────────────
  // Dibungkus h-full + min-h-0 supaya PlanHistoryView bisa menyerap tinggi
  // pasti dari layout admin di atasnya (biasanya <main> yang h-screen/h-full),
  // lalu meneruskannya ke dalam agar kolom kanan bisa scroll SENDIRI di
  // dalam batasnya, tanpa menyeret kolom kiri atau menggeser halaman.
  // Mode lain (create/edit) sengaja tidak dibungkus begini karena memang
  // dirancang untuk scroll natural sepanjang halaman seperti form biasa.
  // ── Mode: history ───────────────────────────────────────────────
  if (isHistoryView) {
    return (
      <div className="flex flex-col h-full">
        <PlanHistoryView onNavigateToCreate={goToNewPlan} />
      </div>
    );
  }

  // ── Mode: loading data plan untuk edit ─────────────────────────
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

  // ── Mode: create / edit form ────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/*
        Header row: back-button + title di grup kiri, action button di
        grup kanan, SEMUA dalam satu flex `items-center` — jadi
        vertical-align-nya konsisten apa pun tinggi title/subtitle,
        nggak lagi pakai `mt-1` hack yang gampang meleset.
        `flex-col sm:flex-row` = stack di layar sempit, sejajar di
        layar lebar (responsive & simetris).
      */}
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
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted"
                  onClick={handleForecast}
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

          {step === 2 && (
            <div className="border border-border/80 rounded-xl p-4 sm:p-6 mt-4 flex flex-col gap-6 bg-background">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                  <SelectTrigger
                    className="w-full"
                    style={{ height: "2.75rem" }}
                  >
                    <SelectValue placeholder="Select menu item...">
                      {(value) => {
                        if (!value) return "Select menu item...";
                        const found = availableMenus.find(
                          (m) => m._id === value,
                        );
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

              {/* Tabel Menu dengan DataTable */}
              <div className="w-full min-w-0 rounded-lg border border-border bg-card shadow-sm overflow-x-auto mt-2">
                <DataTable
                  columns={cartColumns}
                  data={cart}
                  emptyMessage="No menu added yet"
                  loading={false}
                />
              </div>

              {/* Total Summary */}
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
