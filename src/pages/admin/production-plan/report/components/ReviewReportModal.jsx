import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReviewPlanReport } from "@/hooks/report/useReviewPlanReport";

export default function ReviewReportModal({
  open,
  report,
  onClose,
  onRefresh,
  readOnly = false,
}) {
  const [adminNote, setAdminNote] = useState("");
  // Hook review — hanya akan dipanggil saat submit
  const { review, isReviewing } = useReviewPlanReport(report?.id ?? null);

  useEffect(() => {
    setAdminNote(report?.adminNote ?? "");
  }, [report]);

  if (!report) return null;

  const handleReview = async (decision) => {
    try {
      await review({
        decision,
        adminNote: adminNote.trim(),
      });

      toast.success("Report reviewed successfully");
      await onRefresh?.();
      onClose();
    } catch (error) {
      console.error("[REVIEW ERROR]", error);

      toast.error(
        error.response?.data?.details?.[0] ??
          error.response?.data?.message ??
          error.message ??
          "Failed to review report",
      );
    }
  };

  const isMenu = report.category === "menu";
  const valuation = report.valuation;

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleString("en-GB", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>
            {readOnly ? "Incident Report Details" : "Review Incident Report"}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? "Review the details of this incident report."
              : "Review the incident details and provide a decision."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="mb-1 block font-semibold text-muted-foreground">
                Reported By
              </span>
              <p>
                {report.reportedBy} ({report.reportedByRole})
              </p>
            </div>
            <div>
              <span className="mb-1 block font-semibold text-muted-foreground">
                Incident Time
              </span>
              <p>{formatTime(report.incidentAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-md bg-muted/30 p-3">
            <div>
              <span className="mb-1 block font-semibold text-muted-foreground">
                Category / Item
              </span>
              <span className="capitalize">{report.category}</span>
            </div>
            <div>
              <span className="mb-1 block font-semibold text-muted-foreground">
                Quantity Lost
              </span>
              <span className="font-semibold text-destructive">
                {report.quantityLost}
              </span>
            </div>
          </div>

          <div>
            <span className="mb-1 block font-semibold text-muted-foreground">
              Incident Reason
            </span>
            <p className="text-foreground">{report.reason || "-"}</p>
          </div>

          {isMenu && valuation && (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <span className="mb-1 font-semibold">
                Estimated Loss Valuation
              </span>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Ingredient Cost Loss
                </span>
                <span className="font-semibold">
                  {formatRupiah(valuation.costLoss)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Potential Revenue Loss
                </span>
                <span className="font-semibold text-accent">
                  {formatRupiah(valuation.lostRevenueEstimate)}
                </span>
              </div>
            </div>
          )}

          <div className="mt-2 grid gap-2">
            <Label htmlFor="adminNote">
              Admin Note {readOnly ? "" : "(Optional)"}
            </Label>
            {readOnly ? (
              <p className="min-h-10 rounded-md border border-border bg-muted/20 p-2 text-foreground">
                {report.adminNote || "-"}
              </p>
            ) : (
              <Textarea
                id="adminNote"
                placeholder="Add a note for the reporter..."
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {readOnly ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isReviewing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview("rejected")}
                disabled={isReviewing}
              >
                {isReviewing ? "Processing..." : "Reject"}
              </Button>
              <Button
                onClick={() => handleReview("approved")}
                disabled={isReviewing}
              >
                {isReviewing ? "Processing..." : "Approve"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
