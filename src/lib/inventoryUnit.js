/**
 * KUNCI (dari inventory.service.js addSubInventory): quantity batch
 * disimpan apa adanya, TANPA normalisasi unit dan TANPA field unit
 * per-batch — jadi SubInventory.quantity implisit dalam satuan
 * Inventory.unit (mis. Inventory.unit "kg" -> batch quantity juga kg).
 *
 * checkAvailability()/deduct() membandingkan amountNeeded langsung ke
 * batch.quantity tanpa konversi. Maka Menu.ingredients.quantityNeeded
 * WAJIB dalam satuan yang sama dengan Inventory.unit item tsb, atau FEFO
 * check/deduct salah besaran (bisa selisih 1000x untuk kg/L).
 *
 * Form resep tetap tampil & minta input gram/ml/pcs (natural untuk
 * nulis resep). Konversi terjadi di 2 titik:
 *   - SUBMIT (create/update): gram/ml -> turun ke unit Inventory asli
 *   - LOAD (edit): unit Inventory asli -> naik ke gram/ml untuk ditampilkan
 */

const COARSE_WEIGHT = new Set(["kg"]);
const FINE_WEIGHT = new Set(["g", "gram", "gr"]);
const COARSE_VOLUME = new Set(["l", "liter"]);
const FINE_VOLUME = new Set(["ml"]);
const FACTOR = 1000; // 1 kg = 1000 gram, 1 L = 1000 ml

/** Label unit yang ditampilkan di form resep — SELALU gram/ml/pcs, apa pun Inventory.unit-nya. */
export function getRecipeUnitLabel({ unit, category } = {}) {
  if (category === "packaging") return "pcs";
  const key = (unit || "").toLowerCase().trim();
  if (COARSE_WEIGHT.has(key) || FINE_WEIGHT.has(key)) return "gram";
  if (COARSE_VOLUME.has(key) || FINE_VOLUME.has(key)) return "ml";
  return "-";
}

/** SUBMIT: gram/ml (input form) -> unit Inventory asli (buat dikirim ke backend). */
export function toInventoryUnitQuantity({ unit, category, amount }) {
  if (category === "packaging") return { value: amount, ok: true };

  const key = (unit || "").toLowerCase().trim();
  if (COARSE_WEIGHT.has(key) || COARSE_VOLUME.has(key)) {
    return { value: amount / FACTOR, ok: true };
  }
  if (FINE_WEIGHT.has(key) || FINE_VOLUME.has(key)) {
    return { value: amount, ok: true };
  }
  return {
    value: amount,
    ok: false,
    reason: `Unit inventory "${unit}" tidak dikenali.`,
  };
}

/** LOAD (edit): unit Inventory asli (tersimpan di DB) -> gram/ml (buat ditampilkan di form). */
export function toDisplayQuantity({ unit, category, amount }) {
  if (category === "packaging") return amount;
  const key = (unit || "").toLowerCase().trim();
  if (COARSE_WEIGHT.has(key) || COARSE_VOLUME.has(key)) return amount * FACTOR;
  return amount; // sudah gram/ml, atau unit tak dikenal — biarkan apa adanya
}

/** Dipanggil sebelum submit create/update — convert tiap ingredient turun ke unit Inventory asli. */
export function resolveIngredientsForSubmit(ingredients, inventoryOptions) {
  const errors = [];
  const resolved = ingredients.map((item, index) => {
    const inv = inventoryOptions.find((i) => i.id === item.inventoryId);
    if (!inv) {
      errors.push({
        index,
        message: "Item inventory tidak ditemukan di daftar.",
      });
      return item;
    }
    const converted = toInventoryUnitQuantity({
      unit: inv.unit,
      category: inv.category,
      amount: Number(item.quantityNeeded),
    });
    if (!converted.ok) errors.push({ index, message: converted.reason });
    return { ...item, quantityNeeded: converted.value };
  });
  return { resolved, errors };
}
