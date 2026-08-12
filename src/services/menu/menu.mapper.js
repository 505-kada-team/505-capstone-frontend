/**
 * services/menu/menu.mapper.js
 *
 * Mapper layer - Menu.
 * Tanggung jawab TUNGGAL: menerjemahkan (a) response mentah backend menjadi
 * model yang dipakai FE, dan (b) input dari form/komponen menjadi payload
 * request sesuai kontrak `services/menu.service.js` di backend.
 *
 * Semua nama field DIAMBIL APA ADANYA dari implementasi backend
 * (menu.model.js / menu.service.js) — tidak ada field yang dikarang.
 * Fungsi di sini murni (pure function), tidak melakukan I/O, sehingga
 * mudah di-unit-test terpisah dari layer HTTP maupun React.
 */

// ---------------------------------------------------------------------------
// Response mappers
// ---------------------------------------------------------------------------

/**
 * Satu baris breakdown ingredient, dipakai di dalam MenuDetail.
 * Sumber: menu.service.js `buildCostBreakdown()` -> array `ingredients`.
 * currentCostPerUnit/subtotalCost bisa null jika costComplete: false
 * (inventory sudah diarsipkan / belum pernah punya batch cost).
 */
const mapIngredientBreakdown = (ing) => {
  if (!ing) return null;
  return {
    inventoryId: ing.inventoryId,
    nameInventory: ing.nameInventory ?? null,
    category: ing.category ?? null,
    unit: ing.unit ?? null,
    inventoryStatus: ing.inventoryStatus ?? null,
    quantityNeeded: ing.quantityNeeded,
    currentCostPerUnit: ing.currentCostPerUnit ?? null,
    subtotalCost: ing.subtotalCost ?? null,
  };
};

/** Item ringkas untuk GET /menu (list) — menu.service.js getMenus() */
export const mapMenuListItem = (menu) => {
  if (!menu) return null;
  return {
    id: menu._id,
    image: menu.image ?? null,
    name: menu.name,
    sellingPrice: menu.sellingPrice,
    status: menu.status,
    totalIngredients: menu.totalIngredients,
    currentCostEstimate: menu.currentCostEstimate,
    marginEstimate: menu.marginEstimate,
    marginPercentage: menu.marginPercentage,
    costComplete: menu.costComplete,
  };
};

/**
 * Detail lengkap Menu.
 * Dipakai untuk hasil GET /menu/:id (menu.service.js getMenuById) maupun
 * hasil POST /menu (menu.service.js createMenu) — keduanya mengembalikan
 * bentuk field yang sama.
 */
export const mapMenuDetail = (menu) => {
  if (!menu) return null;
  return {
    id: menu._id,
    name: menu.name,
    description: menu.description ?? "",
    image: menu.image ?? null,
    sellingPrice: menu.sellingPrice,
    status: menu.status,
    ingredients: Array.isArray(menu.ingredients)
      ? menu.ingredients.map(mapIngredientBreakdown)
      : [],
    currentCostEstimate: menu.currentCostEstimate,
    marginEstimate: menu.marginEstimate,
    marginPercentage: menu.marginPercentage,
    costComplete: menu.costComplete,
    // Hanya terisi ketika breakdown.warning ada (lihat menu.service.js
    // getMenuById: `if (breakdown.warning) result.warning = ...`).
    warning: menu.warning ?? null,
    createdAt: menu.createdAt ?? null,
    updatedAt: menu.updatedAt ?? null,
  };
};

/**
 * Hasil PUT /menu/:id.
 * menu.service.js updateMenu() sengaja hanya mengembalikan field terbatas
 * ini di `data` (bukan seluruh dokumen Menu) — jangan menambah field lain.
 */
export const mapMenuUpdateResult = (menu) => {
  if (!menu) return null;
  return {
    id: menu._id,
    name: menu.name,
    sellingPrice: menu.sellingPrice,
    updatedAt: menu.updatedAt,
  };
};

/**
 * Hasil DELETE /menu/:id.
 * menu.service.js deleteMenu() -> field terbatas juga.
 */
export const mapMenuDeleteResult = (menu) => {
  if (!menu) return null;
  return {
    id: menu._id,
    status: menu.status,
    deletedAt: menu.deletedAt,
  };
};

/** Item untuk GET /menu/dropdown — menu.service.js getMenuDropdown() */
export const mapMenuDropdownItem = (menu) => {
  if (!menu) return null;
  return {
    id: menu._id,
    name: menu.name,
    sellingPrice: menu.sellingPrice,
    image: menu.image ?? null,
  };
};

/** Pagination GET /menu — menu.controller.js getMenus (extra: { pagination }) */
export const mapPagination = (pagination) => {
  if (!pagination) return null;
  return {
    totalData: pagination.totalData,
    totalPage: pagination.totalPage,
    currentPage: pagination.currentPage,
    limit: pagination.limit,
  };
};

// ---------------------------------------------------------------------------
// Request payload builders
// ---------------------------------------------------------------------------

/** Satu baris ingredient pada payload create/update. */
export const toIngredientRequest = ({ inventoryId, quantityNeeded }) => ({
  inventoryId,
  quantityNeeded,
});

/**
 * Payload POST /menu.
 * menu.service.js createMenu() mewajibkan: name, sellingPrice, ingredients
 * (min. 1 — divalidasi juga oleh menuIngredientSchema di menu.model.js).
 * description/image opsional dan di-default backend jika tidak dikirim.
 */
export const toCreateMenuPayload = ({
  name,
  description,
  image,
  sellingPrice,
  ingredients,
}) => ({
  name,
  description: description ?? "",
  image: image ?? null,
  sellingPrice,
  ingredients: (ingredients ?? []).map(toIngredientRequest),
});

/**
 * Payload PUT /menu/:id.
 * menu.service.js updateMenu() memeriksa tiap field secara independen
 * dengan `!== undefined`, jadi field yang tidak disertakan TIDAK akan
 * tersentuh di backend. Hanya field yang benar-benar diberikan oleh
 * caller yang dimasukkan ke payload.
 *
 * Catatan penting soal `ingredients` (RFC §6, dikutip di menu.service.js):
 * jika ingredients disertakan, itu SELALU full-replace, bukan patch —
 * kirim seluruh daftar akhir ingredient, bukan hanya yang berubah.
 */
export const toUpdateMenuPayload = (changes = {}) => {
  const payload = {};

  if (changes.name !== undefined) payload.name = changes.name;
  if (changes.description !== undefined)
    payload.description = changes.description;
  if (changes.image !== undefined) payload.image = changes.image;
  if (changes.sellingPrice !== undefined)
    payload.sellingPrice = changes.sellingPrice;
  if (changes.ingredients !== undefined) {
    payload.ingredients = changes.ingredients.map(toIngredientRequest);
  }

  return payload;
};

/** Query params GET /menu — menu.service.js getMenus() membaca 4 field ini. */
export const toGetMenusParams = ({
  page,
  limit,
  includeDeleted,
  search,
} = {}) => {
  const params = {};
  if (page !== undefined) params.page = page;
  if (limit !== undefined) params.limit = limit;
  if (includeDeleted !== undefined) params.includeDeleted = includeDeleted;
  if (search) params.search = search;
  return params;
};

/** Query params GET /menu/dropdown — menu.service.js getMenuDropdown() hanya baca `search`. */
export const toGetMenuDropdownParams = ({ search } = {}) => {
  const params = {};
  if (search) params.search = search;
  return params;
};
