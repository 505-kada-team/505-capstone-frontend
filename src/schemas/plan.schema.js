/**
 * schemas/plan.schema.js
 *
 * Validasi sisi client untuk form-form modul Plan, SEBELUM request dikirim
 * ke backend -- supaya error umum (field kosong, rentang tanggal salah,
 * durasi di luar 7-30 hari) ketahuan tanpa bolak-balik ke server, dan pesan
 * errornya konsisten di semua form terkait plan.
 *
 * Ini TIDAK menggantikan validasi backend (validations/plan.validation.js) --
 * backend tetap sumber kebenaran, skema ini murni buat UX form.
 */
import { z } from "zod";

// --- A1: Create plan (wizard Draft Plan) ------------------------------

export const planMenuItemSchema = z.object({
  menuId: z.string().min(1, "menuId wajib diisi"),
  quantityPlanned: z.coerce.number().int().min(1, "Quantity minimal 1"),
});

/** Backend: endDate = startDate + duration (hari kalender), duration 7-30. */
export function computePlanDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/** Validasi field mentah dari wizard (step 1 + step 2 cart) sebelum submit. */
export const createPlanFormSchema = z
  .object({
    planName: z.string().trim().min(1, "Nama plan wajib diisi"),
    startDate: z.string().min(1, "Start date wajib diisi"),
    endDate: z.string().min(1, "End date wajib diisi"),
    cart: z.array(planMenuItemSchema).min(1, "Pilih minimal 1 menu"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date tidak boleh sebelum start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const duration = computePlanDuration(data.startDate, data.endDate);
      return duration >= 7 && duration <= 30;
    },
    { message: "Durasi plan harus di antara 7-30 hari", path: ["endDate"] },
  );

/** Bentuk payload persis yang diterima POST /plan (A1). */
export const createPlanPayloadSchema = z.object({
  name: z.string().trim().min(1),
  tags: z.array(z.string()).optional(),
  startDate: z.string().min(1),
  duration: z.number().int().min(7).max(30),
  menus: z.array(planMenuItemSchema).min(1),
});

// --- A9: Set discount ----------------------------------------------------

/** Validasi form DiscountModal sebelum submit (bisa multi-menu sekaligus). */
export const discountFormSchema = z
  .object({
    reason: z.string().trim().min(1, "Nama promo wajib diisi"),
    startDate: z.date({
      required_error: "Pilih rentang waktu diskon terlebih dahulu",
    }),
    endDate: z.date({
      required_error: "Pilih rentang waktu diskon terlebih dahulu",
    }),
    selectedMenuIds: z
      .array(z.string())
      .min(1, "Pilih minimal satu menu untuk didiskon"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Tanggal akhir tidak boleh sebelum tanggal mulai",
    path: ["endDate"],
  });

/** Bentuk payload persis yang diterima PUT /plan/:id/menus/:menuId/discount (A9). */
export const setDiscountPayloadSchema = z.object({
  discountPercentage: z.coerce
    .number()
    .min(1, "Minimal 1%")
    .max(100, "Maksimal 100%"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional().default(""),
});

// --- A7: Stop plan ---------------------------------------------------------

export const stopPlanPayloadSchema = z.object({
  reason: z.string().trim().min(1, "Alasan stop wajib diisi"),
  stoppedBy: z.string().optional(),
});

/** Ambil pesan error pertama dari ZodError, siap ditampilkan lewat toast. */
export function firstZodErrorMessage(zodError) {
  return zodError?.issues?.[0]?.message || "Data tidak valid";
}
