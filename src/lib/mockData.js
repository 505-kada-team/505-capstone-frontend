/**
 * mockData.js — Modul Inventory
 *
 * Bentuk data WAJIB sama persis dengan API contract (505_Database Schema_inventory.md).
 * Dipakai oleh services/api.js saat USE_MOCK = true.
 * Setiap response sukses DAN error penting dari contract harus ada representasinya di sini.
 *
 * Referensi: 14 endpoint, detail di section 5 dokumen contract.
 */

// =============================================================================
// ENDPOINT 1 — POST /api/inventory
// Buat inventory baru
// =============================================================================

/** Endpoint 1 → 201 Created: inventory baru berhasil dibuat */
export const mockAddInventory = {
  success: true,
  message: "Inventory berhasil dibuat",
  data: {
    _id: "66c1a2b3d4e5f6a7b8c9d0e1",
    nameInventory: "Bubuk Kopi Arabica",
    category: "ingredients",
    unit: "gr",
    description: "Bubuk kopi arabica berkualitas premium",
    status: "active",
    quantityTotal: null,
    lastCostBatch: null,
    totalSubInventory: 0,
    createdAt: "2026-07-29T03:00:00.000Z",
    updatedAt: "2026-07-29T03:00:00.000Z",
  },
};

/** Endpoint 1 → 409 Conflict: nama inventory sudah terdaftar di kategori yang sama (case-insensitive) */
export const mockAddInventoryConflict = {
  success: false,
  message: "Nama inventory sudah terdaftar pada kategori ini",
  errors: [
    {
      field: "nameInventory",
      message: "Duplikat nama dalam kategori yang sama",
    },
  ],
};

// =============================================================================
// ENDPOINT 2 — GET /api/inventory
// List semua inventory (paginated, halaman manajemen)
// =============================================================================

/**
 * Endpoint 2 → 200 OK: list inventory berisi data.
 * Sengaja dibuat 2 item (1 ingredients + 1 packaging) untuk mewakili kedua kategori di UI.
 */
export const mockInventoryList = {
  success: true,
  data: [
    {
      _id: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      category: "ingredients",
      unit: "gr",
      description: "Bubuk kopi arabica berkualitas premium",
      status: "active",
      quantityTotal: 15000,
      lastCostBatch: 12000,
      totalSubInventory: 2,
    },
    {
      _id: "66c1a2b3d4e5f6a7b8c9d0e2",
      nameInventory: "Kardus Box Kecil",
      category: "packaging",
      unit: "pcs",
      description: "Kardus pengemas ukuran kecil",
      status: "active",
      quantityTotal: 500,
      lastCostBatch: 3000,
      totalSubInventory: 1,
    },
    {
      _id: "60c1a2r3d4e3f6a7b8c9d0e8",
      nameInventory: "Sirup Vanilla",
      category: "ingredients",
      unit: "ml",
      description: "Sirup untuk vanilla latte",
      status: "active",
      quantityTotal: 200,
      lastCostBatch: 5000,
      totalSubInventory: 2,
    },
  ],
  pagination: { totalData: 42, totalPage: 5, currentPage: 1, limit: 10 },
};

/**
 * Endpoint 2 → 200 OK (empty state): tidak ada inventory yang cocok dengan filter.
 * Dipakai untuk render tampilan empty state di UI (ilustrasi/pesan "belum ada data").
 */
export const mockInventoryListEmpty = {
  success: true,
  data: [],
  pagination: { totalData: 0, totalPage: 0, currentPage: 1, limit: 10 },
};

// =============================================================================
// ENDPOINT 3 — GET /api/inventory/dropdown
// List ringkas inventory aktif (untuk dropdown create Menu/Plan)
// Tanpa pagination, field minimal: _id, nameInventory, category, unit
// =============================================================================

/** Endpoint 3 → 200 OK: list dropdown inventory aktif */
export const mockInventoryDropdown = {
  success: true,
  data: [
    {
      _id: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      category: "ingredients",
      unit: "gr",
    },
    {
      _id: "66c1a2b3d4e5f6a7b8c9d0e2",
      nameInventory: "Kardus Box Kecil",
      category: "packaging",
      unit: "pcs",
    },
  ],
};

// =============================================================================
// ENDPOINT 4 — GET /api/inventory/:id
// Detail inventory + list subinventory aktif (lazy expired check dijalankan di backend)
// =============================================================================

/**
 * Endpoint 4 → 200 OK: detail inventory kategori ingredients.
 * subInventories berisi batch aktif, diurutkan expired ASC lalu inDate ASC.
 * Kategori ingredients → expired wajib ada (bukan null).
 */
export const mockInventoryDetail = {
  success: true,
  data: {
    _id: "66c1a2b3d4e5f6a7b8c9d0e1",
    nameInventory: "Bubuk Kopi Arabica",
    category: "ingredients",
    unit: "gr",
    description: "Bubuk kopi arabica berkualitas premium",
    status: "active",
    quantityTotal: 15000,
    lastCostBatch: 12000,
    totalSubInventory: 2,
    subInventories: [
      {
        _id: "sub_001",
        initialQuantity: 5000,
        quantity: 5000,
        costPrices: 10000,
        inDate: "2026-07-01T00:00:00.000Z",
        expired: "2026-08-10T00:00:00.000Z",
        status: "active",
      },
      {
        _id: "sub_002",
        initialQuantity: 10000,
        quantity: 10000,
        costPrices: 12000,
        inDate: "2026-07-15T00:00:00.000Z",
        expired: "2026-08-20T00:00:00.000Z",
        status: "active",
      },
    ],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
  },
};

/**
 * Endpoint 4 → 200 OK: detail inventory kategori packaging.
 * Kategori packaging → expired: null (tidak perlu tanggal kedaluwarsa).
 */
export const mockInventoryDetailPackaging = {
  success: true,
  data: {
    _id: "66c1a2b3d4e5f6a7b8c9d0e2",
    nameInventory: "Kardus Box Kecil",
    category: "packaging",
    unit: "pcs",
    description: "Kardus pengemas ukuran kecil",
    status: "active",
    quantityTotal: 500,
    lastCostBatch: 3000,
    totalSubInventory: 1,
    subInventories: [
      {
        _id: "sub_010",
        initialQuantity: 500,
        quantity: 500,
        costPrices: 3000,
        inDate: "2026-07-10T00:00:00.000Z",
        expired: null, // packaging tidak punya expired
        status: "active",
      },
    ],
    createdAt: "2026-07-10T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
  },
};

/** Endpoint 4 → 404 Not Found: inventory tidak ditemukan atau sudah diarsipkan */
export const mockInventoryNotFound = {
  success: false,
  message: "Inventory tidak ditemukan",
};

// =============================================================================
// ENDPOINT 5 — PUT /api/inventory/:id
// Edit nama/deskripsi inventory (category dan unit terkunci, tidak bisa diubah)
// =============================================================================

/** Endpoint 5 → 200 OK: nama atau deskripsi inventory berhasil diperbarui */
export const mockEditInventory = {
  success: true,
  message: "Inventory berhasil diperbarui",
  data: {
    _id: "66c1a2b3d4e5f6a7b8c9d0e1",
    nameInventory: "Bubuk Kopi Arabica Premium",
    category: "ingredients",
    unit: "gr",
    description: "Update: ganti supplier kopi",
    updatedAt: "2026-07-29T04:00:00.000Z",
  },
};

/** Endpoint 5 → 400 Bad Request: payload menyertakan field terkunci (category atau unit) */
export const mockEditInventoryLockedField = {
  success: false,
  message: "Field category/unit tidak dapat diubah",
  errors: [
    {
      field: "category",
      message: "Field ini terkunci setelah inventory dibuat",
    },
  ],
};

// =============================================================================
// ENDPOINT 6 — DELETE /api/inventory/:id
// Arsipkan inventory (soft-delete). Hard delete tidak ada di modul ini.
// =============================================================================

/** Endpoint 6 → 200 OK: inventory berhasil diarsipkan */
export const mockDeleteInventory = {
  success: true,
  message: "Inventory berhasil diarsipkan",
  data: {
    _id: "66c1a2b3d4e5f6a7b8c9d0e1",
    status: "deleted",
    deletedAt: "2026-07-30T02:00:00.000Z",
  },
};

/** Endpoint 6 → 409 Conflict: masih ada batch (subinventory) aktif dengan sisa stok > 0 */
export const mockDeleteInventoryConflict = {
  success: false,
  message:
    "Inventory masih memiliki batch aktif dengan stok tersisa, kosongkan atau hapus batch terlebih dahulu",
  errors: [
    {
      field: "id",
      message: "Ditemukan SubInventory dengan status active dan quantity > 0",
    },
  ],
};

/** Endpoint 6 → 404 Not Found: inventory tidak ditemukan atau sudah diarsipkan sebelumnya */
export const mockDeleteInventoryNotFound = {
  success: false,
  message: "Inventory tidak ditemukan",
};

// =============================================================================
// ENDPOINT 7 — POST /api/inventory/:id/subinventory
// Tambah batch baru ke inventory
// =============================================================================

/**
 * Endpoint 7 → 201 Created: batch baru berhasil ditambahkan.
 * updatedInventorySummary berisi ringkasan inventory induk yang sudah dihitung ulang.
 */
export const mockAddSubInventoryBatch = {
  success: true,
  message: "Subinventory berhasil ditambahkan",
  data: {
    _id: "sub_003",
    inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
    initialQuantity: 5000,
    quantity: 5000,
    costPrices: 10000,
    inDate: "2026-07-29T00:00:00.000Z",
    expired: "2026-09-15T00:00:00.000Z",
    status: "active",
    createdAt: "2026-07-29T04:10:00.000Z",
  },
  updatedInventorySummary: {
    quantityTotal: 20000,
    lastCostBatch: 10000,
    totalSubInventory: 3,
  },
};

/** Endpoint 7 → 400 Bad Request: field expired kosong padahal kategori ingredients (wajib isi expired) */
export const mockAddSubInventoryError = {
  success: false,
  message: "Validation error: expired wajib diisi untuk kategori ingredients",
  errors: [
    {
      field: "expired",
      message: "expired wajib diisi untuk kategori ingredients",
    },
  ],
};

// =============================================================================
// ENDPOINT 8 — GET /api/inventory/:id/subinventory
// List batch milik 1 inventory (bisa filter by status: active, depleted, expired, deleted, all)
// =============================================================================

/**
 * Endpoint 8 → 200 OK: list batch aktif.
 * Default query ?status=active. Diurutkan expired ASC, inDate ASC.
 * Batch dengan status lain (depleted, expired, deleted) tidak muncul kecuali di-query eksplisit.
 */
export const mockSubInventoryList = {
  success: true,
  data: [
    {
      _id: "sub_001",
      initialQuantity: 5000,
      quantity: 3000,
      costPrices: 10000,
      inDate: "2026-07-01T00:00:00.000Z",
      expired: "2026-08-10T00:00:00.000Z",
      status: "active",
    },
    {
      _id: "sub_002",
      initialQuantity: 10000,
      quantity: 10000,
      costPrices: 12000,
      inDate: "2026-07-15T00:00:00.000Z",
      expired: "2026-08-20T00:00:00.000Z",
      status: "active",
    },
  ],
};

/**
 * Endpoint 8 → 200 OK (all status): semua batch termasuk depleted, expired, dan deleted.
 * Dipakai untuk halaman histori batch atau debugging.
 */
export const mockSubInventoryListAll = {
  success: true,
  data: [
    {
      _id: "sub_001",
      initialQuantity: 5000,
      quantity: 3000,
      costPrices: 10000,
      inDate: "2026-07-01T00:00:00.000Z",
      expired: "2026-08-10T00:00:00.000Z",
      status: "active",
    },
    {
      _id: "sub_004",
      initialQuantity: 8000,
      quantity: 0,
      costPrices: 9500,
      inDate: "2026-06-01T00:00:00.000Z",
      expired: "2026-07-20T00:00:00.000Z",
      status: "depleted", // habis via FEFO, quantity = 0
    },
    {
      _id: "sub_005",
      initialQuantity: 3000,
      quantity: 1200,
      costPrices: 11000,
      inDate: "2026-06-15T00:00:00.000Z",
      expired: "2026-07-10T00:00:00.000Z",
      status: "expired", // tanggal expired sudah lewat, lazy check mengubah status ini
    },
  ],
};

// =============================================================================
// ENDPOINT 9 — DELETE /api/subinventory/:id
// Arsipkan (soft-delete) 1 batch secara manual (misal batch rusak/salah input)
// =============================================================================

/**
 * Endpoint 9 → 200 OK: batch berhasil diarsipkan.
 * updatedInventorySummary berisi ringkasan inventory induk yang sudah dihitung ulang.
 */
export const mockDeleteSubInventory = {
  success: true,
  message: "Subinventory berhasil diarsipkan",
  data: {
    _id: "sub_001",
    status: "deleted",
    deletedAt: "2026-07-30T02:10:00.000Z",
    deletedBy: "Pencit",
    reason: "Batch rusak sebelum masuk produksi",
  },
  updatedInventorySummary: {
    quantityTotal: 10000,
    lastCostBatch: 12000,
    totalSubInventory: 1,
  },
};

/** Endpoint 9 → 404/409: batch tidak ditemukan atau sudah tidak active (sudah depleted/expired/deleted) */
export const mockDeleteSubInventoryError = {
  success: false,
  message: "Subinventory tidak ditemukan atau tidak dapat diarsipkan",
};

// =============================================================================
// ENDPOINT 10 — GET /api/history-sub-inventory
// Log semua transaksi pembelian batch (tidak bisa dihapus, rekaman permanen)
// =============================================================================

/**
 * Endpoint 10 → 200 OK: log pembelian batch, diurutkan inDate menurun (terbaru di atas).
 * nameInventory di sini adalah snapshot nama saat pembelian — tetap valid walau inventory diarsipkan.
 */
export const mockHistorySubInventory = {
  success: true,
  data: [
    {
      _id: "hist_001",
      inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      nameResponsible: "Pencit",
      costPrices: 10000,
      quantity: 5000,
      inDate: "2026-07-01T00:00:00.000Z",
    },
    {
      _id: "hist_002",
      inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      nameResponsible: "Budi",
      costPrices: 12000,
      quantity: 10000,
      inDate: "2026-07-15T00:00:00.000Z",
    },
  ],
  pagination: { totalData: 20, totalPage: 2, currentPage: 1, limit: 10 },
};

// =============================================================================
// ENDPOINT 11 — POST /api/subinventory/check-availability
// Cek ketersediaan stok (dry-run, tidak mengubah data apapun)
// Dipanggil Production Plan saat draft/simulasi sebelum approve
// Ada 3 skenario response berbeda — semua tetap 200 (bukan error)
// =============================================================================

/**
 * Endpoint 11 → 200 OK — Skenario A: stok CUKUP, semua batch yang diambil AMAN (safe).
 * hasUnsafeBatch: false → semua batch yang terambil masih segar sampai plan selesai.
 */
export const mockCheckAvailabilitySufficient = {
  success: true,
  data: {
    sufficient: true,
    availableQuantity: 12000,
    quantityNeeded: 8000,
    hasUnsafeBatch: false,
    eligibleBatches: [
      {
        subInventoryId: "sub_002",
        quantityTaken: 8000,
        expired: "2026-09-15T00:00:00.000Z",
        batchSafetyStatus: "safe",
      },
    ],
  },
};

/**
 * Endpoint 11 → 200 OK — Skenario B: stok CUKUP, tapi ada batch yang akan EXPIRED di tengah plan (unsafe).
 * hasUnsafeBatch: true → admin perlu waspada, tapi plan tidak diblokir otomatis.
 * Keputusan lanjut/tidak ada di modul Production Plan, bukan di sini.
 */
export const mockCheckAvailabilityUnsafe = {
  success: true,
  data: {
    sufficient: true,
    availableQuantity: 15000,
    quantityNeeded: 8000,
    hasUnsafeBatch: true,
    eligibleBatches: [
      {
        subInventoryId: "sub_001",
        quantityTaken: 3000,
        expired: "2026-08-10T00:00:00.000Z",
        batchSafetyStatus: "unsafe", // expired < availableUntil, batch akan busuk sebelum plan selesai
      },
      {
        subInventoryId: "sub_002",
        quantityTaken: 5000,
        expired: "2026-08-20T00:00:00.000Z",
        batchSafetyStatus: "safe",
      },
    ],
  },
};

/**
 * Endpoint 11 → 200 OK — Skenario C: stok TIDAK CUKUP secara kuantitas.
 * sufficient: false → shortfall menunjukkan kekurangan.
 * Ini bukan error (tetap 200), hanya hasil valid dari simulasi.
 */
export const mockCheckAvailabilityInsufficient = {
  success: true,
  data: {
    sufficient: false,
    availableQuantity: 5000,
    quantityNeeded: 8000,
    shortfall: 3000,
    hasUnsafeBatch: true,
    eligibleBatches: [
      {
        subInventoryId: "sub_001",
        quantityTaken: 5000,
        expired: "2026-08-10T00:00:00.000Z",
        batchSafetyStatus: "unsafe",
      },
    ],
  },
};

// =============================================================================
// ENDPOINT 12 — POST /api/subinventory/deduct
// Potong stok FEFO (mutasi nyata, berbeda dari endpoint 11 yang dry-run)
// Logic FEFO + batchSafetyStatus wajib identik dengan endpoint 11
// =============================================================================

/**
 * Endpoint 12 → 200 OK: stok berhasil dipotong via FEFO.
 * deductions: rincian per batch yang dipotong, termasuk costPriceUsed (untuk COGS laporan).
 * batchSafetyStatus: null jika availableUntil tidak dikirim di payload.
 */
export const mockDeductStock = {
  success: true,
  message: "Stok berhasil dipotong (FEFO)",
  data: {
    hasUnsafeBatch: true,
    deductions: [
      {
        subInventoryId: "sub_001",
        quantityUsed: 3000,
        costPriceUsed: 10000,
        remainingQuantity: 0,
        batchSafetyStatus: "unsafe", // batch ini expired sebelum plan selesai
      },
      {
        subInventoryId: "sub_002",
        quantityUsed: 5000,
        costPriceUsed: 12000,
        remainingQuantity: 5000,
        batchSafetyStatus: "safe",
      },
    ],
  },
  updatedInventorySummary: { quantityTotal: 7000, totalSubInventory: 1 },
};

/** Endpoint 12 → 409 Conflict: total stok aktif tidak cukup memenuhi quantityNeeded */
export const mockDeductStockInsufficient = {
  success: false,
  message: "Stok tidak mencukupi untuk memenuhi kebutuhan plan",
  errors: [
    { field: "quantityNeeded", message: "Tersedia 5000, dibutuhkan 8000" },
  ],
};

/** Endpoint 12 → 409 Conflict: planId ini sudah pernah melakukan deduction sebelumnya (double-deduct guard) */
export const mockDeductStockDoubleDeduct = {
  success: false,
  message:
    "Plan ini sudah pernah melakukan deduction, gunakan reverse dulu jika ingin mengulang",
  errors: [
    { field: "planId", message: "planId sudah memiliki HistoryUsage aktif" },
  ],
};

// =============================================================================
// ENDPOINT 13 — POST /api/subinventory/deduct/reverse
// Batalkan pemotongan stok (kembalikan quantity ke SubInventory)
// =============================================================================

/**
 * Endpoint 13 → 200 OK: deduction berhasil dibatalkan.
 * reversedCount: jumlah HistoryUsage yang ditandai isReversed: true.
 */
export const mockDeductReverse = {
  success: true,
  message: "Deduction untuk plan_00123 berhasil dibatalkan",
  data: { reversedCount: 2 },
  updatedInventorySummary: { quantityTotal: 15000, totalSubInventory: 2 },
};

/** Endpoint 13 → 409 Conflict: tidak ada HistoryUsage aktif (isReversed: false) untuk planId ini */
export const mockDeductReverseNotFound = {
  success: false,
  message: "Tidak ada deduction aktif untuk planId ini",
  errors: [
    {
      field: "planId",
      message:
        "Tidak ditemukan HistoryUsage dengan isReversed: false untuk planId ini",
    },
  ],
};

// =============================================================================
// ENDPOINT 14 — GET /api/history-usage
// Log semua transaksi pemakaian stok (COGS, rekaman permanen)
// =============================================================================

/**
 * Endpoint 14 → 200 OK: log pemakaian stok via FEFO.
 * costPriceUsed: cost aktual batch yang dipotong (berbeda dari lastCostBatch di Menu yang hanya estimasi).
 * isReversed: true jika deduction ini sudah dibatalkan via endpoint 13.
 * batchSafetyStatus: null jika saat deduct availableUntil tidak dikirim.
 */
export const mockHistoryUsage = {
  success: true,
  data: [
    {
      _id: "usage_001",
      inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      subInventoryId: "sub_001",
      quantityUsed: 3000,
      costPriceUsed: 10000,
      planId: "plan_00123",
      usedDate: "2026-07-29T05:00:00.000Z",
      batchSafetyStatus: "unsafe",
      isReversed: false,
      reversedAt: null,
    },
    {
      _id: "usage_002",
      inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameInventory: "Bubuk Kopi Arabica",
      subInventoryId: "sub_002",
      quantityUsed: 5000,
      costPriceUsed: 12000,
      planId: "plan_00123",
      usedDate: "2026-07-29T05:00:00.000Z",
      batchSafetyStatus: "safe",
      isReversed: false,
      reversedAt: null,
    },
  ],
  pagination: { totalData: 5, totalPage: 1, currentPage: 1, limit: 10 },
};

// =============================================================================
// MODUL MENU / RESEP — 505_Database Schema_resep.md
// 6 endpoint: POST, GET list, GET :id, PUT :id, DELETE :id, GET dropdown
//
// Koreksi typo OCR dari contract PDF:
//   "inventoryld"    → inventoryId    (huruf 'l' terbaca sebagai 'I')
//   "totallngredients" → totalIngredients (huruf 'I' terbaca sebagai 'l')
//
// Inventory IDs yang dipakai konsisten dengan mockInventoryList di atas:
//   66c1a2b3d4e5f6a7b8c9d0e1 → Bubuk Kopi Arabica (ingredients, gr)
//   66c1a2b3d4e5f6a7b8c9d0e2 → Kardus Box Kecil    (packaging,  pcs)
//   60c1a2r3d4e3f6a7b8c9d0e8 → Sirup Vanilla       (ingredients, ml)
//   66c1a2b3d4e5f6a7b8c9d0e9 → [SUDAH DIARSIPKAN]  — dipakai di mockMenuDetailIncomplete
// =============================================================================

// =============================================================================
// ENDPOINT 1 — POST /api/menu
// Buat menu baru
// =============================================================================

/**
 * Endpoint 1 → 201 Created: menu berhasil dibuat.
 * Ingredient field yang dikembalikan: inventoryId, nameInventory, category, unit,
 * quantityNeeded, currentCostPerUnit, subtotalCost.
 * TIDAK ada inventoryStatus — field itu hanya muncul di GET /:id (detail).
 *
 * Verifikasi math:
 *   Ingredient A: 200gr × Rp15/gr = Rp3.000
 *   Ingredient B: 1pcs × Rp1.500/pcs = Rp1.500
 *   currentCostEstimate = 3000 + 1500 = 4.500
 *   marginEstimate      = 25.000 - 4.500 = 20.500
 *   marginPercentage    = round(20500/25000 × 100) = 82
 */
export const mockMenuCreated = {
  success: true,
  message: "Menu berhasil dibuat",
  data: {
    _id: "menu_003",
    name: "Iced Americano",
    description: "Espresso dengan air dingin dan es batu",
    image: "https://cdn.example.com/menu/nasi-goreng.jpg",
    sellingPrice: 25000,
    status: "active",
    ingredients: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Bubuk Kopi Arabica",
        category: "ingredients",
        unit: "gr",
        // inventoryStatus TIDAK ADA di response POST — hanya muncul di GET /:id
        quantityNeeded: 200,
        currentCostPerUnit: 15, // = lastCostBatch dari Inventory (diambil live)
        subtotalCost: 3000, // 200 × 15
      },
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e2",
        nameInventory: "Kardus Box Kecil",
        category: "packaging",
        unit: "pcs",
        quantityNeeded: 1,
        currentCostPerUnit: 1500,
        subtotalCost: 1500, // 1 × 1500
      },
    ],
    currentCostEstimate: 4500, // 3000 + 1500
    marginEstimate: 20500, // 25000 - 4500
    marginPercentage: 82, // round(20500/25000 × 100)
    costComplete: true,
    createdAt: "2026-07-31T03:00:00.000Z",
    updatedAt: "2026-07-31T03:00:00.000Z",
  },
};

/**
 * Endpoint 1 → 400 Bad Request: salah satu inventoryId tidak ditemukan atau sudah deleted.
 * errors adalah array (sesuai format error contract section 2).
 */
export const mockMenuCreatedInvalidIngredient = {
  success: false,
  message: "Validation error: ada ingredient yang inventoryId-nya tidak valid",
  errors: [
    {
      field: "ingredients[1].inventoryId",
      message: "Inventory tidak ditemukan atau berstatus deleted",
    },
  ],
};

/**
 * Endpoint 1 → 400 Bad Request: ada inventoryId yang muncul lebih dari satu kali
 * dalam satu payload (duplikat ingredient).
 */
export const mockMenuCreatedDuplicateIngredient = {
  success: false,
  message:
    "Validation error: terdapat inventoryId yang sama lebih dari satu kali",
  errors: [
    {
      field: "ingredients",
      message:
        "inventoryId '66c1a2b3d4e5f6a7b8c9d0e1' muncul lebih dari sekali",
    },
  ],
};

// =============================================================================
// ENDPOINT 2 — GET /api/menu
// List semua menu (paginated). Field lebih ringkas dari GET /:id (tanpa ingredients[]).
// =============================================================================

/**
 * Endpoint 2 → 200 OK: list menu berisi data.
 * Field per item: _id, image, name, sellingPrice, status,
 *   totalIngredients, currentCostEstimate, marginEstimate, marginPercentage, costComplete.
 * Sengaja dibuat 4 item:
 *   - 3 item costComplete: true  (tampilkan angka cost/margin)
 *   - 1 item costComplete: false (tampilkan null + highlight UI berbeda)
 *
 * Verifikasi math tiap item:
 *   menu_001 Es Kopi Susu: cost=4300, sell=18000 → margin=13700, pct=round(13700/18000×100)=76
 *   menu_003 Iced Americano : cost=4500, sell=25000 → margin=20500, pct=82
 *   menu_004 Es Teh Manis: cost=1200, sell=8000  → margin=6800,  pct=round(6800/8000×100)=85
 *   menu_002 Matcha Latte: semua null (costComplete: false)
 */
export const mockMenuList = {
  success: true,
  data: [
    {
      _id: "menu_001",
      image: "https://cdn.example.com/menu/es-kopi-susu.jpg",
      name: "Es Kopi Susu",
      sellingPrice: 18000,
      status: "active",
      totalIngredients: 3, // 3 bahan: kopi, sirup, kardus
      currentCostEstimate: 4300,
      marginEstimate: 13700,
      marginPercentage: 76,
      costComplete: true,
    },
    {
      _id: "menu_002",
      image: "https://cdn.example.com/menu/matcha-latte.jpg",
      name: "Matcha Latte",
      sellingPrice: 22000,
      status: "active",
      totalIngredients: 2,
      // Semua null karena ada ingredient dengan inventory deleted
      currentCostEstimate: null,
      marginEstimate: null,
      marginPercentage: null,
      costComplete: false,
    },
    {
      _id: "menu_003",
      image: "https://cdn.example.com/menu/nasi-goreng.jpg",
      name: "Iced Americano",
      sellingPrice: 25000,
      status: "active",
      totalIngredients: 2,
      currentCostEstimate: 4500,
      marginEstimate: 20500,
      marginPercentage: 82,
      costComplete: true,
    },
    {
      _id: "menu_004",
      image: "https://cdn.example.com/menu/es-teh.jpg",
      name: "Es Teh Manis",
      sellingPrice: 8000,
      status: "active",
      totalIngredients: 2,
      currentCostEstimate: 1200,
      marginEstimate: 6800,
      marginPercentage: 85,
      costComplete: true,
    },
  ],
  pagination: { totalData: 12, totalPage: 2, currentPage: 1, limit: 10 },
};

/**
 * Endpoint 2 → 200 OK (empty state): tidak ada menu yang cocok dengan filter/search.
 * Dipakai untuk render empty state di UI.
 */
export const mockMenuListEmpty = {
  success: true,
  data: [],
  pagination: { totalData: 0, totalPage: 0, currentPage: 1, limit: 10 },
};

// =============================================================================
// ENDPOINT 3 — GET /api/menu/:id
// Detail menu + breakdown cost & margin per ingredient (diambil live dari Inventory).
// Field tambahan vs list: ingredients[] full, description, createdAt, updatedAt.
// Field tambahan vs POST response: inventoryStatus per ingredient.
// =============================================================================

/**
 * Endpoint 3 → 200 OK — kondisi NORMAL (costComplete: true).
 * Semua ingredient aktif, semua cost tersedia, estimasi dapat dihitung penuh.
 *
 * Verifikasi math:
 *   Kopi Arabica : 15gr  × Rp120/gr   = Rp1.800
 *   Sirup Vanilla: 20ml  × Rp50/ml    = Rp1.000
 *   Kardus Box   : 1pcs  × Rp1.500/pcs = Rp1.500
 *   currentCostEstimate  = 4.300
 *   marginEstimate       = 18.000 - 4.300 = 13.700
 *   marginPercentage     = round(13700/18000 × 100) = 76
 */
export const mockMenuDetail = {
  success: true,
  data: {
    _id: "menu_001",
    image: "https://cdn.example.com/menu/es-kopi-susu.jpg",
    name: "Es Kopi Susu",
    description: "Kopi susu premium dengan sirup vanilla, disajikan dingin",
    sellingPrice: 18000,
    status: "active",
    ingredients: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Bubuk Kopi Arabica",
        category: "ingredients",
        unit: "gr",
        inventoryStatus: "active", // field live dari Inventory — HANYA ada di endpoint detail
        quantityNeeded: 15,
        currentCostPerUnit: 120, // = lastCostBatch dari Inventory (Rp120/gr)
        subtotalCost: 1800, // 15 × 120
      },
      {
        inventoryId: "60c1a2r3d4e3f6a7b8c9d0e8",
        nameInventory: "Sirup Vanilla",
        category: "ingredients",
        unit: "ml",
        inventoryStatus: "active",
        quantityNeeded: 20,
        currentCostPerUnit: 50, // = lastCostBatch Sirup Vanilla (Rp50/ml)
        subtotalCost: 1000, // 20 × 50
      },
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e2",
        nameInventory: "Kardus Box Kecil",
        category: "packaging",
        unit: "pcs",
        inventoryStatus: "active",
        quantityNeeded: 1,
        currentCostPerUnit: 1500,
        subtotalCost: 1500, // 1 × 1500
      },
    ],
    currentCostEstimate: 4300, // 1800 + 1000 + 1500
    marginEstimate: 13700, // 18000 - 4300
    marginPercentage: 76, // round(13700/18000 × 100) = 76.1 → 76
    costComplete: true,
    // 'warning' TIDAK ADA saat costComplete: true
    createdAt: "2026-07-30T03:00:00.000Z",
    updatedAt: "2026-07-30T03:00:00.000Z",
  },
};

/**
 * Endpoint 3 → 200 OK — kondisi COST TIDAK LENGKAP (costComplete: false).
 * Terjadi saat ≥ 1 ingredient:
 *   (a) inventoryStatus: "deleted"  → inventory sudah diarsipkan, OR
 *   (b) lastCostBatch masih null    → inventory baru, belum pernah ada batch.
 *
 * Skenario ini: Matcha Latte dengan 1 ingredient inventoryStatus: "deleted".
 * Konsekuensi: seluruh top-level cost (currentCostEstimate, marginEstimate, marginPercentage)
 * menjadi null — tidak dihitung parsial karena contract melarang kalkulasi tidak lengkap.
 * Field "warning" muncul HANYA saat costComplete: false.
 *
 * Catatan: ingredient Sirup Vanilla tetap aktif dan punya subtotalCost,
 * tapi karena ada 1 ingredient null, seluruh estimasi menu = null.
 */
export const mockMenuDetailIncomplete = {
  success: true,
  data: {
    _id: "menu_002",
    image: "https://cdn.example.com/menu/matcha-latte.jpg",
    name: "Matcha Latte",
    description: "Minuman matcha segar dengan susu dan sirup vanilla",
    sellingPrice: 22000,
    status: "active",
    ingredients: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e9",
        nameInventory: "Bubuk Matcha Premium",
        category: "ingredients",
        unit: "gr",
        inventoryStatus: "deleted", // ← inventory sudah diarsipkan
        quantityNeeded: 20,
        currentCostPerUnit: null, // tidak bisa diambil dari inventory deleted
        subtotalCost: null, // null karena currentCostPerUnit null
      },
      {
        inventoryId: "60c1a2r3d4e3f6a7b8c9d0e8",
        nameInventory: "Sirup Vanilla",
        category: "ingredients",
        unit: "ml",
        inventoryStatus: "active",
        quantityNeeded: 15,
        currentCostPerUnit: 50,
        subtotalCost: 750, // 15 × 50 (dihitung, tapi bukan penentu estimasi total)
      },
    ],
    // Semua top-level cost null karena costComplete: false
    currentCostEstimate: null,
    marginEstimate: null,
    marginPercentage: null,
    costComplete: false,
    warning:
      "Terdapat ingredient yang inventory-nya sudah diarsipkan atau belum pernah punya batch, estimasi cost tidak dapat dihitung penuh",
    createdAt: "2026-07-28T03:00:00.000Z",
    updatedAt: "2026-07-28T03:00:00.000Z",
  },
};

/** Endpoint 3 → 404 Not Found: menu tidak ditemukan (termasuk menu status: deleted) */
export const mockMenuNotFound = {
  success: false,
  message: "Menu tidak ditemukan",
};

// =============================================================================
// ENDPOINT 4 — PUT /api/menu/:id
// Edit menu (name, description, image, sellingPrice, ingredients).
// Field baru v2: affectedDraftPlans — daftar draft Plan yang perlu di-refresh.
// =============================================================================

/**
 * Endpoint 4 → 200 OK: edit berhasil, perubahan menyentuh ingredients/sellingPrice.
 * affectedDraftPlans berisi _id draft Plan yang ditandai checkResultStale: true.
 * Response data hanya mengembalikan field yang diubah + _id + updatedAt (bukan full object).
 */
export const mockEditMenu = {
  success: true,
  message: "Menu berhasil diperbarui",
  data: {
    _id: "menu_001",
    name: "Es Kopi Susu Special",
    sellingPrice: 20000,
    updatedAt: "2026-07-31T04:00:00.000Z",
  },
  // ada 1 draft plan yang referensi menu ini → ditandai stale
  affectedDraftPlans: ["plan_002"],
};

/**
 * Endpoint 4 → 200 OK: edit berhasil, perubahan HANYA menyentuh name/description/image.
 * affectedDraftPlans kosong — kedua field ini tidak memicu efek samping ke draft Plan.
 */
export const mockEditMenuNoEffect = {
  success: true,
  message: "Menu berhasil diperbarui",
  data: {
    _id: "menu_001",
    name: "Es Kopi Susu Artisan",
    sellingPrice: 18000,
    updatedAt: "2026-07-31T04:30:00.000Z",
  },
  affectedDraftPlans: [], // kosong karena hanya name yang berubah
};

/**
 * Endpoint 4 → 400 Bad Request: validasi ingredient gagal (sama seperti endpoint 1).
 */
export const mockEditMenuInvalidIngredient = {
  success: false,
  message: "Validation error: ada ingredient yang inventoryId-nya tidak valid",
  errors: [
    {
      field: "ingredients[1].inventoryId",
      message: "Inventory tidak ditemukan atau berstatus deleted",
    },
  ],
};

// =============================================================================
// ENDPOINT 5 — DELETE /api/menu/:id
// Arsipkan menu (soft-delete). Tidak diblokir kondisi apapun.
// Efek samping: draft Plan yang mereferensikan menu ini ditandai checkResultStale: true.
// =============================================================================

/**
 * Endpoint 5 → 200 OK: menu berhasil diarsipkan.
 * affectedDraftPlans berisi draft Plan yang ditandai staleReason: "menu_archived".
 */
export const mockDeleteMenu = {
  success: true,
  message: "Menu berhasil diarsipkan",
  data: {
    _id: "menu_001",
    status: "deleted",
    deletedAt: "2026-07-31T05:00:00.000Z",
  },
  affectedDraftPlans: ["plan_003"], // 1 draft plan perlu di-refresh setelah arsip
};

/**
 * Endpoint 5 → 200 OK: menu berhasil diarsipkan, tidak ada draft Plan yang terdampak.
 */
export const mockDeleteMenuNoEffect = {
  success: true,
  message: "Menu berhasil diarsipkan",
  data: {
    _id: "menu_004",
    status: "deleted",
    deletedAt: "2026-07-31T05:30:00.000Z",
  },
  affectedDraftPlans: [], // tidak ada draft yang mereferensikan menu ini
};

/** Endpoint 5 → 404: menu tidak ditemukan atau sudah berstatus deleted sebelumnya */
export const mockDeleteMenuNotFound = {
  success: false,
  message: "Menu tidak ditemukan",
};

// =============================================================================
// ENDPOINT 6 — GET /api/menu/dropdown
// List ringkas menu aktif untuk dropdown di modul Production Plan.
// Berbeda dari endpoint 2: tanpa pagination, field minimal, hanya status active.
// Field: _id, name, sellingPrice, image — TIDAK ada ingredients/cost/pagination.
// =============================================================================

/**
 * Endpoint 6 → 200 OK: list dropdown semua menu aktif.
 * Sengaja 3 item — menu_002 (Matcha Latte, deleted) tidak muncul sesuai filter active.
 * Dipanggil Production Plan saat membuat draft (A1).
 */
export const mockMenuDropdown = {
  success: true,
  data: [
    {
      _id: "menu_001",
      name: "Es Kopi Susu",
      sellingPrice: 18000,
      image: "https://cdn.example.com/menu/es-kopi-susu.jpg",
    },
    {
      _id: "menu_003",
      name: "Iced Americano",
      sellingPrice: 25000,
      image: "https://cdn.example.com/menu/nasi-goreng.jpg",
    },
    {
      _id: "menu_004",
      name: "Es Teh Manis",
      sellingPrice: 8000,
      image: "https://cdn.example.com/menu/es-teh.jpg",
    },
  ],
  // Tanpa pagination — semua hasil dikembalikan sekaligus (sesuai contract endpoint 6)
};

// =============================================================================
// MODUL PRODUCTION PLAN — 505_Database Schema_producitonplan.md
// 10 endpoint (A1 - A10): POST, GET list, GET :id, PUT, POST check-availability,
// POST approve, POST stop, DELETE, PUT discount, DELETE discount.
// =============================================================================

// =============================================================================
// ENDPOINT A1 — POST /api/plan
// Buat plan baru (draft)
// =============================================================================

export const mockCreatePlan = {
  success: true,
  message: "Plan berhasil dibuat sebagai draft",
  data: {
    _id: "plan_001",
    name: "Promo Nasi Goreng Agustus",
    tags: ["promo"],
    status: "draft",
    startDate: "2026-08-05T00:00:00.000Z",
    duration: 14,
    endDate: "2026-08-19T00:00:00.000Z",
    menus: [
      {
        menuId: "menu_001",
        name: "Nasi Goreng Spesial",
        quantityPlanned: 100,
        soldQuantity: 0,
        lossQuantity: 0,
        soldOutAt: null,
        frozenSellingPrice: null,
        effectiveSellingPrice: 25000,
        currentPrice: 25000,
        discount: null,
      },
    ],
    checkResult: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Beras Premium",
        quantityNeeded: 20000,
        sufficient: true,
        availableQuantity: 25000,
        hasUnsafeBatch: true,
        eligibleBatches: [
          {
            subInventoryId: "sub_001",
            quantityTaken: 8000,
            expired: "2026-08-12T00:00:00.000Z",
            batchSafetyStatus: "unsafe",
          },
          {
            subInventoryId: "sub_002",
            quantityTaken: 12000,
            expired: "2026-09-01T00:00:00.000Z",
            batchSafetyStatus: "safe",
          },
        ],
      },
    ],
    checkResultStale: false,
    staleReason: null,
    readyToApprove: true,
    hasPendingLossReplacement: false,
    createdAt: "2026-08-01T02:00:00.000Z",
  },
};

export const mockCreatePlanInvalidMenu = {
  success: false,
  message:
    "Validation error: ada menuId yang tidak ditemukan atau sudah diarsipkan",
  errors: [
    {
      field: "menus[1].menuId",
      message: "Menu tidak ditemukan atau berstatus deleted",
    },
  ],
};

// =============================================================================
// ENDPOINT A2 — GET /api/plan
// List semua plan
// =============================================================================

export const mockPlanList = {
  success: true,
  data: [
    {
      _id: "plan_001",
      name: "Promo Nasi Goreng Agustus",
      tags: ["promo"],
      status: "active",
      startDate: "2026-08-05T00:00:00.000Z",
      endDate: "2026-08-19T00:00:00.000Z",
      totalMenu: 2,
      readyToApprove: true,
      hasPendingLossReplacement: false,
      hasActiveDiscount: true,
      hasUnsafeBatch: true,
    },
  ],
  pagination: { totalData: 8, totalPage: 1, currentPage: 1, limit: 10 },
};

// =============================================================================
// ENDPOINT A3 — GET /api/plan/:id
// Detail plan
// =============================================================================

export const mockPlanDetailDraft = {
  success: true,
  data: {
    _id: "plan_001",
    name: "Promo Nasi Goreng Agustus",
    status: "draft",
    startDate: "2026-08-05T00:00:00.000Z",
    duration: 14,
    menus: [
      {
        menuId: "menu_001",
        name: "Nasi Goreng Spesial",
        quantityPlanned: 100,
        frozenSellingPrice: null,
        effectiveSellingPrice: 25000,
        currentPrice: 25000,
        discount: {
          discountPercentage: 15,
          startDate: "2026-08-12T00:00:00.000Z",
          endDate: "2026-08-19T00:00:00.000Z",
          reason: "Beras Premium mendekati expired",
          discountedPrice: 21250,
          discountStatus: "upcoming",
          setBy: "Admin A",
          setAt: "2026-08-05T03:00:00.000Z",
        },
      },
    ],
    checkResult: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Beras Premium",
        quantityNeeded: 20000,
        sufficient: true,
        availableQuantity: 25000,
        hasUnsafeBatch: true,
        eligibleBatches: [
          {
            subInventoryId: "sub_001",
            quantityTaken: 8000,
            expired: "2026-08-12T00:00:00.000Z",
            batchSafetyStatus: "unsafe",
          },
        ],
      },
    ],
    checkResultStale: false,
    staleReason: null,
    readyToApprove: true,
  },
};

export const mockPlanDetailActive = {
  success: true,
  data: {
    _id: "plan_001",
    name: "Promo Nasi Goreng Agustus",
    status: "active",
    startDate: "2026-08-05T00:00:00.000Z",
    duration: 14,
    hasPendingLossReplacement: true,
    warning:
      "Ada laporan kerugian bahan yang sudah disetujui tapi belum diganti stoknya",
    menus: [
      {
        menuId: "menu_001",
        name: "Nasi Goreng Spesial",
        quantityPlanned: 100,
        soldQuantity: 62,
        lossQuantity: 0,
        remainingQuantity: 38,
        soldOutAt: null,
        frozenSellingPrice: 25000,
        effectiveSellingPrice: 25000,
        currentPrice: 21250,
        discount: {
          discountPercentage: 15,
          startDate: "2026-08-12T00:00:00.000Z",
          endDate: "2026-08-19T00:00:00.000Z",
          reason: "Beras Premium mendekati expired",
          discountedPrice: 21250,
          discountStatus: "active",
          setBy: "Admin A",
          setAt: "2026-08-05T03:00:00.000Z",
        },
      },
    ],
    committedIngredients: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Beras Premium",
        quantityNeeded: 20000,
        batches: [
          {
            subInventoryId: "sub_001",
            quantityUsed: 8000,
            costPriceUsed: 10000,
            batchSafetyStatus: "unsafe",
          },
          {
            subInventoryId: "sub_002",
            quantityUsed: 12000,
            costPriceUsed: 12000,
            batchSafetyStatus: "safe",
          },
        ],
      },
    ],
  },
};

export const mockPlanDetailStale = {
  success: true,
  data: {
    _id: "plan_002",
    status: "draft",
    checkResultStale: true,
    staleReason: "recipe_changed",
    readyToApprove: false,
    warning:
      "Resep salah satu menu di plan ini berubah sejak simulasi terakhir. Refresh check-availability wajib dilakukan sebelum approve.",
  },
};

export const mockPlanNotFound = {
  success: false,
  message: "Plan tidak ditemukan",
};

// =============================================================================
// ENDPOINT A4 — PUT /api/plan/:id
// Edit plan (hanya saat draft)
// =============================================================================

export const mockUpdatePlan = {
  success: true,
  message: "Plan berhasil diperbarui, simulasi ketersediaan sudah di-refresh",
  data: {
    _id: "plan_001",
    endDate: "2026-08-17T00:00:00.000Z",
    readyToApprove: true,
    checkResultStale: false,
    staleReason: null,
    updatedAt: "2026-08-02T01:00:00.000Z",
  },
};

export const mockUpdatePlanNotDraft = {
  success: false,
  message: "Plan hanya bisa diedit selagi berstatus draft",
  errors: [{ field: "status", message: "Status saat ini: active" }],
};

export const mockUpdatePlanDiscountOutOfRange = {
  success: false,
  message:
    "Perubahan durasi plan membuat slot diskon menu_001 berada di luar rentang plan baru, hapus atau sesuaikan diskon tersebut dulu",
  errors: [
    {
      field: "duration",
      message:
        "Diskon menu_001 (2026-08-12 s/d 2026-08-19) melebihi endDate baru 2026-08-15",
    },
  ],
};

// =============================================================================
// ENDPOINT A5 — POST /api/plan/:id/check-availability
// Refresh simulasi ketersediaan bahan
// =============================================================================

export const mockCheckAvailabilityPlan = {
  success: true,
  data: {
    readyToApprove: false,
    checkResultStale: false,
    staleReason: null,
    checkResult: [
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e1",
        nameInventory: "Beras Premium",
        quantityNeeded: 20000,
        sufficient: true,
        availableQuantity: 25000,
        hasUnsafeBatch: true,
        eligibleBatches: [
          {
            subInventoryId: "sub_001",
            quantityTaken: 20000,
            expired: "2026-08-12T00:00:00.000Z",
            batchSafetyStatus: "unsafe",
          },
        ],
      },
      {
        inventoryId: "66c1a2b3d4e5f6a7b8c9d0e2",
        nameInventory: "Kardus Box Kecil",
        quantityNeeded: 150,
        sufficient: false,
        availableQuantity: 90,
        shortfall: 60,
        hasUnsafeBatch: false,
        eligibleBatches: [
          {
            subInventoryId: "sub_010",
            quantityTaken: 90,
            expired: null,
            batchSafetyStatus: "safe",
          },
        ],
      },
    ],
  },
};

// =============================================================================
// ENDPOINT A6 — POST /api/plan/:id/approve
// Setujui plan → deduct Inventory, bekukan frozenSellingPrice, draft → active
// =============================================================================

export const mockApprovePlan = {
  success: true,
  message:
    "Plan disetujui, stok bahan telah dialokasikan dan harga jual dibekukan",
  data: {
    _id: "plan_001",
    status: "active",
    approvedAt: "2026-08-04T02:00:00.000Z",
  },
};

export const mockApprovePlanStaleRecipe = {
  success: false,
  message:
    "Resep salah satu menu berubah sejak simulasi terakhir, wajib refresh check-availability sebelum approve",
  errors: [{ field: "staleReason", message: "staleReason: recipe_changed" }],
};

export const mockApprovePlanInsufficient = {
  success: false,
  message:
    "Ketersediaan stok berubah sejak simulasi terakhir, silakan check-availability ulang",
  errors: [
    {
      field: "checkResult",
      message: "1 atau lebih inventoryId tidak lagi mencukupi",
    },
  ],
};

export const mockApprovePlanConflict = {
  success: false,
  message:
    "Masih ada plan lain yang sedang aktif, selesaikan atau hentikan plan tersebut dulu",
  errors: [
    {
      field: "status",
      message: "Hanya boleh 1 plan berstatus active pada satu waktu",
    },
  ],
};

// =============================================================================
// ENDPOINT A7 — POST /api/plan/:id/stop
// Hentikan paksa, active → stopped
// =============================================================================

export const mockStopPlan = {
  success: true,
  message: "Plan dihentikan, laporan akhir telah dibuat",
  data: {
    _id: "plan_001",
    status: "stopped",
    stoppedAt: "2026-08-12T09:00:00.000Z",
    stoppedBy: "Admin A",
    stopReason: "Kehabisan stok bahan utama",
  },
};

export const mockStopPlanNotActive = {
  success: false,
  message: "Hanya plan berstatus active yang bisa dihentikan",
  errors: [{ field: "status", message: "Status saat ini: draft" }],
};

// =============================================================================
// ENDPOINT A8 — DELETE /api/plan/:id
// Batalkan draft (hanya saat draft)
// =============================================================================

export const mockCancelPlan = {
  success: true,
  message: "Draft plan berhasil dibatalkan",
  data: {
    _id: "plan_001",
    status: "cancelled",
    cancelledAt: "2026-08-02T03:00:00.000Z",
  },
};

export const mockCancelPlanNotDraft = {
  success: false,
  message: "Hanya plan berstatus draft yang bisa dibatalkan",
  errors: [
    {
      field: "status",
      message:
        "Status saat ini: active — hentikan lewat endpoint stop, bukan dibatalkan",
    },
  ],
};

// =============================================================================
// ENDPOINT A9 — PUT /api/plan/:id/menus/:menuId/discount
// Set/ganti slot diskon untuk satu menu
// =============================================================================

export const mockSetDiscount = {
  success: true,
  message: "Diskon berhasil diterapkan pada menu",
  data: {
    menuId: "menu_001",
    effectiveSellingPrice: 25000,
    discount: {
      discountPercentage: 15,
      startDate: "2026-08-12T00:00:00.000Z",
      endDate: "2026-08-19T00:00:00.000Z",
      reason: "Beras Premium mendekati expired",
      discountedPrice: 21250,
      discountStatus: "upcoming",
      setBy: "Admin A",
      setAt: "2026-08-05T03:00:00.000Z",
    },
  },
};

// =============================================================================
// ENDPOINT A10 — DELETE /api/plan/:id/menus/:menuId/discount
// Hapus slot diskon untuk satu menu
// =============================================================================

export const mockDeleteDiscount = {
  success: true,
  message: "Diskon pada menu berhasil dihapus",
  data: { menuId: "menu_001", discount: null },
};

export const mockDeleteDiscountNotFound = {
  success: false,
  message: "Menu ini tidak memiliki diskon aktif untuk dihapus",
  errors: [{ field: "menuId", message: "discount: null" }],
};

// =============================================================================
// MODUL SELLING — 505_Database Schema_selling.md
// 3 endpoint (B1 - B3): GET active, POST sale, GET history.
// =============================================================================

// =============================================================================
// ENDPOINT B1 — GET /api/selling/active
// List plan aktif + sisa stok + harga berlaku per menu
// =============================================================================

export const mockSellingActiveList = {
  success: true,
  data: [
    {
      planId: "plan_001",
      name: "Promo Nasi Goreng Agustus",
      startDate: "2026-08-05T00:00:00.000Z",
      endDate: "2026-08-19T00:00:00.000Z",
      sellable: true,
      menus: [
        {
          menuId: "menu_001",
          name: "Nasi Goreng Spesial",
          sellingPrice: 25000,
          currentPrice: 21250,
          isDiscounted: true,
          discountPercentage: 15,
          discountEndsAt: "2026-08-19T00:00:00.000Z",
          remainingQuantity: 47,
          warning: null,
        },
        {
          menuId: "menu_002",
          name: "Es Teh Manis",
          sellingPrice: 8000,
          currentPrice: 8000,
          isDiscounted: false,
          discountPercentage: null,
          discountEndsAt: null,
          remainingQuantity: 30,
          warning: null,
        },
      ],
    },
  ],
};

// =============================================================================
// ENDPOINT B2 — POST /api/selling
// Catat penjualan
// =============================================================================

export const mockCreateSaleNormal = {
  success: true,
  message: "Penjualan berhasil dicatat",
  data: {
    _id: "sale_045",
    planId: "plan_001",
    menuId: "menu_001",
    quantitySold: 2,
    originalPrice: 25000,
    priceUsed: 25000,
    discountApplied: false,
    discountPercentage: null,
    cashierName: "Sari",
    soldAt: "2026-08-10T04:30:00.000Z",
    remainingQuantity: 36,
  },
};

export const mockCreateSaleDiscount = {
  success: true,
  message: "Penjualan berhasil dicatat (harga diskon)",
  data: {
    _id: "sale_046",
    planId: "plan_001",
    menuId: "menu_001",
    quantitySold: 2,
    originalPrice: 25000,
    priceUsed: 21250,
    discountApplied: true,
    discountPercentage: 15,
    cashierName: "Sari",
    soldAt: "2026-08-13T04:30:00.000Z",
    remainingQuantity: 34,
  },
};

export const mockCreateSaleNotStarted = {
  success: false,
  message: "Plan belum dimulai, penjualan baru bisa dicatat mulai 2026-08-05",
  errors: [
    {
      field: "startDate",
      message: "Tanggal sekarang masih sebelum startDate plan",
    },
  ],
};

export const mockCreateSaleInsufficient = {
  success: false,
  message: "Sisa porsi menu ini tidak mencukupi",
  errors: [{ field: "quantitySold", message: "Sisa 1, diminta 2" }],
};

// =============================================================================
// ENDPOINT B3 — GET /api/selling/history
// Riwayat penjualan
// =============================================================================

export const mockSellingHistory = {
  success: true,
  data: [
    {
      _id: "sale_045",
      menuId: "menu_001",
      menuName: "Nasi Goreng Spesial",
      quantitySold: 2,
      originalPrice: 25000,
      priceUsed: 25000,
      discountApplied: false,
      discountPercentage: null,
      cashierName: "Sari",
      soldAt: "2026-08-10T04:30:00.000Z",
    },
    {
      _id: "sale_046",
      menuId: "menu_001",
      menuName: "Nasi Goreng Spesial",
      quantitySold: 2,
      originalPrice: 25000,
      priceUsed: 21250,
      discountApplied: true,
      discountPercentage: 15,
      cashierName: "Sari",
      soldAt: "2026-08-13T04:30:00.000Z",
    },
  ],
  summary: {
    totalTransaction: 14,
    totalRevenue: 1150000,
    totalDiscountGiven: 63750,
  },
};

// =============================================================================
// MODUL PLAN REPORT — 505_Database Schema_planreport.md
// 4 endpoint (C1 - C4): POST create, GET list, PUT review, POST add-inventory.
// =============================================================================

// =============================================================================
// ENDPOINT C1 — POST /api/plan-reports
// Lapor kerusakan/kehilangan
// =============================================================================

export const mockCreatePlanReportMenuDiscount = {
  success: true,
  message: "Laporan berhasil dikirim, menunggu review admin",
  data: {
    _id: "report_012",
    planId: "plan_001",
    category: "menu",
    refId: "menu_001",
    quantityLost: 2,
    incidentAt: "2026-08-13T03:15:00.000Z",
    isLateReport: false,
    reason: "Terjatuh saat penyajian",
    reportedBy: "Sari",
    reportedByRole: "cashier",
    status: "pending",
    valuation: {
      unitCostAtLoss: 4500,
      costLoss: 9000,
      originalPriceAtLoss: 25000,
      discountAppliedAtLoss: true,
      discountPercentageAtLoss: 15,
      priceUsedAtLoss: 21250,
      lostRevenueEstimate: 42500,
    },
    createdAt: "2026-08-13T05:00:00.000Z",
  },
};

export const mockCreatePlanReportMenuNoDiscount = {
  success: true,
  message: "Laporan berhasil dikirim, menunggu review admin",
  data: {
    _id: "report_014",
    category: "menu",
    refId: "menu_002",
    quantityLost: 1,
    incidentAt: "2026-08-09T10:00:00.000Z",
    isLateReport: true,
    status: "pending",
    valuation: {
      unitCostAtLoss: 2200,
      costLoss: 2200,
      originalPriceAtLoss: 8000,
      discountAppliedAtLoss: false,
      discountPercentageAtLoss: null,
      priceUsedAtLoss: 8000,
      lostRevenueEstimate: 8000,
    },
    createdAt: "2026-08-11T02:00:00.000Z",
  },
};

export const mockCreatePlanReportIngredientAdmin = {
  success: true,
  message: "Laporan tercatat dan otomatis disetujui",
  data: {
    _id: "report_013",
    category: "ingredient",
    refId: "66c1a2b3d4e5f6a7b8c9d0e1",
    quantityLost: 200,
    incidentAt: "2026-08-10T08:00:00.000Z",
    isLateReport: false,
    reportedBy: "Admin A",
    reportedByRole: "admin",
    status: "approved",
    reviewedBy: "Admin A",
    reviewedAt: "2026-08-10T08:05:00.000Z",
    valuation: null,
  },
};

export const mockCreatePlanReportNotActive = {
  success: false,
  message: "Laporan hanya bisa dibuat untuk plan yang sudah pernah aktif",
  errors: [{ field: "planId", message: "Status plan saat ini: draft" }],
};

export const mockCreatePlanReportOutOfRange = {
  success: false,
  message: "Validation error: incidentAt berada di luar rentang durasi plan",
  errors: [
    {
      field: "incidentAt",
      message: "incidentAt (2026-08-20) melebihi endDate plan (2026-08-19)",
    },
  ],
};

export const mockCreatePlanReportFuture = {
  success: false,
  message: "Validation error: incidentAt tidak boleh di masa depan",
  errors: [
    { field: "incidentAt", message: "incidentAt melebihi waktu saat ini" },
  ],
};

// =============================================================================
// ENDPOINT C2 — GET /api/plan-reports
// List laporan
// =============================================================================

export const mockPlanReportList = {
  success: true,
  data: [
    {
      _id: "report_012",
      planId: "plan_001",
      category: "menu",
      refId: "menu_001",
      nameRef: "Nasi Goreng Spesial",
      quantityLost: 2,
      incidentAt: "2026-08-13T03:15:00.000Z",
      isLateReport: false,
      status: "pending",
      valuation: {
        costLoss: 9000,
        lostRevenueEstimate: 42500,
      },
      createdAt: "2026-08-13T05:00:00.000Z",
    },
    {
      _id: "report_010",
      planId: "plan_001",
      category: "ingredient",
      refId: "66c1a2b3d4e5f6a7b8c9d0e1",
      nameRef: "Beras Premium",
      quantityLost: 500,
      incidentAt: "2026-08-09T02:00:00.000Z",
      isLateReport: false,
      status: "approved",
      replacementDeducted: false,
      valuation: null,
      createdAt: "2026-08-09T02:30:00.000Z",
    },
    {
      _id: "report_013",
      planId: "plan_001",
      category: "menu",
      refId: "menu_002",
      nameRef: "Ayam Bakar Madu",
      quantityLost: 1,
      incidentAt: "2026-08-10T11:00:00.000Z",
      isLateReport: true,
      status: "approved",
      valuation: {
        costLoss: 15000,
        lostRevenueEstimate: 35000,
      },
      reason:
        "Tumpah saat akan dihidangkan ke meja pelanggan (oleh waiter baru).",
      adminNote: "Sudah di-acc, mohon lebih hati-hati lain kali.",
      createdAt: "2026-08-11T09:00:00.000Z",
    },
  ],
};

// =============================================================================
// ENDPOINT C3 — PUT /api/plan-reports/:id/review
// ACC/tolak laporan
// =============================================================================

export const mockReviewPlanReport = {
  success: true,
  message: "Laporan disetujui",
  data: {
    _id: "report_012",
    status: "approved",
    reviewedBy: "Admin A",
    reviewedAt: "2026-08-13T06:00:00.000Z",
    adminNote: "Sudah dicek, sesuai",
  },
};

export const mockReviewPlanReportConflict = {
  success: false,
  message: "Laporan ini sudah pernah direview",
  errors: [{ field: "status", message: "Status saat ini: approved" }],
};

// =============================================================================
// ENDPOINT C4 — POST /api/plan-reports/:id/add-inventory
// Tarik stok pengganti akibat rugi (khusus category ingredient)
// =============================================================================

export const mockAddInventoryReplacement = {
  success: true,
  message: "Stok pengganti berhasil ditarik dan dicatat di laporan",
  data: {
    reportId: "report_010",
    replacementBatches: [
      { subInventoryId: "sub_004", quantityUsed: 2000, costPriceUsed: 11000 },
    ],
    replacementCost: 22000,
  },
};

// ==================================Transaction Cashier Mock Data==================================

// Bentuk data WAJIB sama persis dengan API contract (lihat CONVENTIONS.md section 5).
// Swap ke getProducts() di services/api.js begitu backend siap.
export const mockProducts = [
  {
    id: "prod-001",
    name: "Latte",
    image: "https://picsum.photos/seed/latte/300/200",
    price: 12700,
    discountPrice: null,
    discountPercent: null,
    stockRemaining: 10,
    isAvailable: true,
  },
  {
    id: "prod-002",
    name: "Ice Americano",
    image: "https://picsum.photos/seed/ice-americano/300/200",
    price: 18750,
    discountPrice: 15000,
    discountPercent: 20,
    stockRemaining: null,
    isAvailable: true,
  },
  {
    id: "prod-003",
    name: "Matcha Drink",
    image: "https://picsum.photos/seed/matcha/300/200",
    price: 26000,
    discountPrice: null,
    discountPercent: null,
    stockRemaining: null,
    isAvailable: true,
  },
  {
    id: "prod-004",
    name: "Cappuccino",
    image: "https://picsum.photos/seed/cappuccino/300/200",
    price: 18000,
    discountPrice: null,
    discountPercent: null,
    stockRemaining: 0,
    isAvailable: false,
  },
  {
    id: "prod-005",
    name: "Lemonade",
    image: "https://picsum.photos/seed/lemonade/300/200",
    price: 15500,
    discountPrice: null,
    discountPercent: null,
    stockRemaining: null,
    isAvailable: true,
  },
];

// =============================================================================
// MODUL DASHBOARD — 505_Database Schema_dashboard.md
// 1 endpoint (D1): GET summary
// =============================================================================

export const mockDashboardHourly = {
  success: true,
  message: "Data dashboard harian (hourly) berhasil didapatkan",
  filter: {
    selectedDate: "2026-08-07",
    startDate: "2026-08-07T00:00:00.000Z",
    endDate: "2026-08-07T23:59:59.999Z",
  },
  data: {
    kpi: {
      totalRevenue: 1250000,
      totalCupsSold: 58,
    },
    hourlyTrend: [
      {
        hour: "08:00",
        hourlyRevenue: 150000,
        hourlyCupsSold: 8,
        totalTransactions: 5,
      },
      {
        hour: "09:00",
        hourlyRevenue: 220000,
        hourlyCupsSold: 11,
        totalTransactions: 7,
      },
      {
        hour: "14:00",
        hourlyRevenue: 340000,
        hourlyCupsSold: 15,
        totalTransactions: 10,
      },
      {
        hour: "19:00",
        hourlyRevenue: 180000,
        hourlyCupsSold: 8,
        totalTransactions: 6,
      },
    ],
  },
};

export const mockDashboardDaily = {
  success: true,
  message: "Data dashboard rentang tanggal berhasil didapatkan",
  filter: {
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2026-08-07T23:59:59.999Z",
  },
  data: {
    kpi: {
      totalRevenue: 14250000,
      totalCupsSold: 680,
    },
    dailyTrend: [
      {
        date: "2026-08-01",
        dailyRevenue: 1850000,
        dailyCupsSold: 88,
        totalTransactions: 52,
      },
      {
        date: "2026-08-02",
        dailyRevenue: 2100000,
        dailyCupsSold: 102,
        totalTransactions: 61,
      },
    ],
  },
};

export const mockDashboardEmpty = {
  success: true,
  message: "Data dashboard berhasil didapatkan (kosong)",
  filter: {
    selectedDate: "2026-08-08",
    startDate: "2026-08-08T00:00:00.000Z",
    endDate: "2026-08-08T23:59:59.999Z",
  },
  data: {
    kpi: {
      totalRevenue: 0,
      totalCupsSold: 0,
    },
    hourlyTrend: [],
    dailyTrend: [],
  },
};
