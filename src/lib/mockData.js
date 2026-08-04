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
  message: 'Inventory berhasil dibuat',
  data: {
    _id: '66c1a2b3d4e5f6a7b8c9d0e1',
    nameInventory: 'Bubuk Kopi Arabica',
    category: 'ingredients',
    unit: 'gr',
    description: 'Bubuk kopi arabica berkualitas premium',
    status: 'active',
    quantityTotal: null,
    lastCostBatch: null,
    totalSubInventory: 0,
    createdAt: '2026-07-29T03:00:00.000Z',
    updatedAt: '2026-07-29T03:00:00.000Z',
  },
};

/** Endpoint 1 → 409 Conflict: nama inventory sudah terdaftar di kategori yang sama (case-insensitive) */
export const mockAddInventoryConflict = {
  success: false,
  message: 'Nama inventory sudah terdaftar pada kategori ini',
  errors: [{ field: 'nameInventory', message: 'Duplikat nama dalam kategori yang sama' }],
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
      _id: '66c1a2b3d4e5f6a7b8c9d0e1',
      nameInventory: 'Bubuk Kopi Arabica',
      category: 'ingredients',
      unit: 'gr',
      description: 'Bubuk kopi arabica berkualitas premium',
      status: 'active',
      quantityTotal: 15000,
      lastCostBatch: 12000,
      totalSubInventory: 2,
    },
    {
      _id: '66c1a2b3d4e5f6a7b8c9d0e2',
      nameInventory: 'Kardus Box Kecil',
      category: 'packaging',
      unit: 'pcs',
      description: 'Kardus pengemas ukuran kecil',
      status: 'active',
      quantityTotal: 500,
      lastCostBatch: 3000,
      totalSubInventory: 1,
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
    { _id: '66c1a2b3d4e5f6a7b8c9d0e1', nameInventory: 'Bubuk Kopi Arabica', category: 'ingredients', unit: 'gr' },
    { _id: '66c1a2b3d4e5f6a7b8c9d0e2', nameInventory: 'Kardus Box Kecil', category: 'packaging', unit: 'pcs' },
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
    _id: '66c1a2b3d4e5f6a7b8c9d0e1',
    nameInventory: 'Bubuk Kopi Arabica',
    category: 'ingredients',
    unit: 'gr',
    description: 'Bubuk kopi arabica berkualitas premium',
    status: 'active',
    quantityTotal: 15000,
    lastCostBatch: 12000,
    totalSubInventory: 2,
    subInventories: [
      {
        _id: 'sub_001',
        initialQuantity: 5000,
        quantity: 5000,
        costPrices: 10000,
        inDate: '2026-07-01T00:00:00.000Z',
        expired: '2026-08-10T00:00:00.000Z',
        status: 'active',
      },
      {
        _id: 'sub_002',
        initialQuantity: 10000,
        quantity: 10000,
        costPrices: 12000,
        inDate: '2026-07-15T00:00:00.000Z',
        expired: '2026-08-20T00:00:00.000Z',
        status: 'active',
      },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
  },
};

/**
 * Endpoint 4 → 200 OK: detail inventory kategori packaging.
 * Kategori packaging → expired: null (tidak perlu tanggal kedaluwarsa).
 */
export const mockInventoryDetailPackaging = {
  success: true,
  data: {
    _id: '66c1a2b3d4e5f6a7b8c9d0e2',
    nameInventory: 'Kardus Box Kecil',
    category: 'packaging',
    unit: 'pcs',
    description: 'Kardus pengemas ukuran kecil',
    status: 'active',
    quantityTotal: 500,
    lastCostBatch: 3000,
    totalSubInventory: 1,
    subInventories: [
      {
        _id: 'sub_010',
        initialQuantity: 500,
        quantity: 500,
        costPrices: 3000,
        inDate: '2026-07-10T00:00:00.000Z',
        expired: null, // packaging tidak punya expired
        status: 'active',
      },
    ],
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
};

/** Endpoint 4 → 404 Not Found: inventory tidak ditemukan atau sudah diarsipkan */
export const mockInventoryNotFound = {
  success: false,
  message: 'Inventory tidak ditemukan',
};

// =============================================================================
// ENDPOINT 5 — PUT /api/inventory/:id
// Edit nama/deskripsi inventory (category dan unit terkunci, tidak bisa diubah)
// =============================================================================

/** Endpoint 5 → 200 OK: nama atau deskripsi inventory berhasil diperbarui */
export const mockEditInventory = {
  success: true,
  message: 'Inventory berhasil diperbarui',
  data: {
    _id: '66c1a2b3d4e5f6a7b8c9d0e1',
    nameInventory: 'Bubuk Kopi Arabica Premium',
    category: 'ingredients',
    unit: 'gr',
    description: 'Update: ganti supplier kopi',
    updatedAt: '2026-07-29T04:00:00.000Z',
  },
};

/** Endpoint 5 → 400 Bad Request: payload menyertakan field terkunci (category atau unit) */
export const mockEditInventoryLockedField = {
  success: false,
  message: 'Field category/unit tidak dapat diubah',
  errors: [{ field: 'category', message: 'Field ini terkunci setelah inventory dibuat' }],
};

// =============================================================================
// ENDPOINT 6 — DELETE /api/inventory/:id
// Arsipkan inventory (soft-delete). Hard delete tidak ada di modul ini.
// =============================================================================

/** Endpoint 6 → 200 OK: inventory berhasil diarsipkan */
export const mockDeleteInventory = {
  success: true,
  message: 'Inventory berhasil diarsipkan',
  data: {
    _id: '66c1a2b3d4e5f6a7b8c9d0e1',
    status: 'deleted',
    deletedAt: '2026-07-30T02:00:00.000Z',
  },
};

/** Endpoint 6 → 409 Conflict: masih ada batch (subinventory) aktif dengan sisa stok > 0 */
export const mockDeleteInventoryConflict = {
  success: false,
  message: 'Inventory masih memiliki batch aktif dengan stok tersisa, kosongkan atau hapus batch terlebih dahulu',
  errors: [{ field: 'id', message: 'Ditemukan SubInventory dengan status active dan quantity > 0' }],
};

/** Endpoint 6 → 404 Not Found: inventory tidak ditemukan atau sudah diarsipkan sebelumnya */
export const mockDeleteInventoryNotFound = {
  success: false,
  message: 'Inventory tidak ditemukan',
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
  message: 'Subinventory berhasil ditambahkan',
  data: {
    _id: 'sub_003',
    inventoryId: '66c1a2b3d4e5f6a7b8c9d0e1',
    initialQuantity: 5000,
    quantity: 5000,
    costPrices: 10000,
    inDate: '2026-07-29T00:00:00.000Z',
    expired: '2026-09-15T00:00:00.000Z',
    status: 'active',
    createdAt: '2026-07-29T04:10:00.000Z',
  },
  updatedInventorySummary: { quantityTotal: 20000, lastCostBatch: 10000, totalSubInventory: 3 },
};

/** Endpoint 7 → 400 Bad Request: field expired kosong padahal kategori ingredients (wajib isi expired) */
export const mockAddSubInventoryError = {
  success: false,
  message: 'Validation error: expired wajib diisi untuk kategori ingredients',
  errors: [{ field: 'expired', message: 'expired wajib diisi untuk kategori ingredients' }],
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
      _id: 'sub_001',
      initialQuantity: 5000,
      quantity: 3000,
      costPrices: 10000,
      inDate: '2026-07-01T00:00:00.000Z',
      expired: '2026-08-10T00:00:00.000Z',
      status: 'active',
    },
    {
      _id: 'sub_002',
      initialQuantity: 10000,
      quantity: 10000,
      costPrices: 12000,
      inDate: '2026-07-15T00:00:00.000Z',
      expired: '2026-08-20T00:00:00.000Z',
      status: 'active',
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
      _id: 'sub_001',
      initialQuantity: 5000,
      quantity: 3000,
      costPrices: 10000,
      inDate: '2026-07-01T00:00:00.000Z',
      expired: '2026-08-10T00:00:00.000Z',
      status: 'active',
    },
    {
      _id: 'sub_004',
      initialQuantity: 8000,
      quantity: 0,
      costPrices: 9500,
      inDate: '2026-06-01T00:00:00.000Z',
      expired: '2026-07-20T00:00:00.000Z',
      status: 'depleted', // habis via FEFO, quantity = 0
    },
    {
      _id: 'sub_005',
      initialQuantity: 3000,
      quantity: 1200,
      costPrices: 11000,
      inDate: '2026-06-15T00:00:00.000Z',
      expired: '2026-07-10T00:00:00.000Z',
      status: 'expired', // tanggal expired sudah lewat, lazy check mengubah status ini
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
  message: 'Subinventory berhasil diarsipkan',
  data: {
    _id: 'sub_001',
    status: 'deleted',
    deletedAt: '2026-07-30T02:10:00.000Z',
    deletedBy: 'Pencit',
    reason: 'Batch rusak sebelum masuk produksi',
  },
  updatedInventorySummary: { quantityTotal: 10000, lastCostBatch: 12000, totalSubInventory: 1 },
};

/** Endpoint 9 → 404/409: batch tidak ditemukan atau sudah tidak active (sudah depleted/expired/deleted) */
export const mockDeleteSubInventoryError = {
  success: false,
  message: 'Subinventory tidak ditemukan atau tidak dapat diarsipkan',
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
      _id: 'hist_001',
      inventoryId: '66c1a2b3d4e5f6a7b8c9d0e1',
      nameInventory: 'Bubuk Kopi Arabica',
      nameResponsible: 'Pencit',
      costPrices: 10000,
      quantity: 5000,
      inDate: '2026-07-01T00:00:00.000Z',
    },
    {
      _id: 'hist_002',
      inventoryId: '66c1a2b3d4e5f6a7b8c9d0e1',
      nameInventory: 'Bubuk Kopi Arabica',
      nameResponsible: 'Budi',
      costPrices: 12000,
      quantity: 10000,
      inDate: '2026-07-15T00:00:00.000Z',
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
        subInventoryId: 'sub_002',
        quantityTaken: 8000,
        expired: '2026-09-15T00:00:00.000Z',
        batchSafetyStatus: 'safe',
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
        subInventoryId: 'sub_001',
        quantityTaken: 3000,
        expired: '2026-08-10T00:00:00.000Z',
        batchSafetyStatus: 'unsafe', // expired < availableUntil, batch akan busuk sebelum plan selesai
      },
      {
        subInventoryId: 'sub_002',
        quantityTaken: 5000,
        expired: '2026-08-20T00:00:00.000Z',
        batchSafetyStatus: 'safe',
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
        subInventoryId: 'sub_001',
        quantityTaken: 5000,
        expired: '2026-08-10T00:00:00.000Z',
        batchSafetyStatus: 'unsafe',
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
  message: 'Stok berhasil dipotong (FEFO)',
  data: {
    hasUnsafeBatch: true,
    deductions: [
      {
        subInventoryId: 'sub_001',
        quantityUsed: 3000,
        costPriceUsed: 10000,
        remainingQuantity: 0,
        batchSafetyStatus: 'unsafe', // batch ini expired sebelum plan selesai
      },
      {
        subInventoryId: 'sub_002',
        quantityUsed: 5000,
        costPriceUsed: 12000,
        remainingQuantity: 5000,
        batchSafetyStatus: 'safe',
      },
    ],
  },
  updatedInventorySummary: { quantityTotal: 7000, totalSubInventory: 1 },
};

/** Endpoint 12 → 409 Conflict: total stok aktif tidak cukup memenuhi quantityNeeded */
export const mockDeductStockInsufficient = {
  success: false,
  message: 'Stok tidak mencukupi untuk memenuhi kebutuhan plan',
  errors: [{ field: 'quantityNeeded', message: 'Tersedia 5000, dibutuhkan 8000' }],
};

/** Endpoint 12 → 409 Conflict: planId ini sudah pernah melakukan deduction sebelumnya (double-deduct guard) */
export const mockDeductStockDoubleDeduct = {
  success: false,
  message: 'Plan ini sudah pernah melakukan deduction, gunakan reverse dulu jika ingin mengulang',
  errors: [{ field: 'planId', message: 'planId sudah memiliki HistoryUsage aktif' }],
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
  message: 'Deduction untuk plan_00123 berhasil dibatalkan',
  data: { reversedCount: 2 },
  updatedInventorySummary: { quantityTotal: 15000, totalSubInventory: 2 },
};

/** Endpoint 13 → 409 Conflict: tidak ada HistoryUsage aktif (isReversed: false) untuk planId ini */
export const mockDeductReverseNotFound = {
  success: false,
  message: 'Tidak ada deduction aktif untuk planId ini',
  errors: [{ field: 'planId', message: 'Tidak ditemukan HistoryUsage dengan isReversed: false untuk planId ini' }],
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
      _id: 'usage_001',
      inventoryId: '66c1a2b3d4e5f6a7b8c9d0e1',
      nameInventory: 'Bubuk Kopi Arabica',
      subInventoryId: 'sub_001',
      quantityUsed: 3000,
      costPriceUsed: 10000,
      planId: 'plan_00123',
      usedDate: '2026-07-29T05:00:00.000Z',
      batchSafetyStatus: 'unsafe',
      isReversed: false,
      reversedAt: null,
    },
    {
      _id: 'usage_002',
      inventoryId: '66c1a2b3d4e5f6a7b8c9d0e1',
      nameInventory: 'Bubuk Kopi Arabica',
      subInventoryId: 'sub_002',
      quantityUsed: 5000,
      costPriceUsed: 12000,
      planId: 'plan_00123',
      usedDate: '2026-07-29T05:00:00.000Z',
      batchSafetyStatus: 'safe',
      isReversed: false,
      reversedAt: null,
    },
  ],
  pagination: { totalData: 5, totalPage: 1, currentPage: 1, limit: 10 },
};

// ==================================Authentification Mock Data==================================
/**
 * mockData.js — Modul Authentication
 *
 * Bentuk data harus mengikuti API contract authentication.
 * Dipakai oleh services/api.js saat USE_MOCK = true.
 * Response sukses dan error penting dari setiap endpoint
 * direpresentasikan di file ini.
 *
 * Alur authentication:
 * 1. Register
 * 2. Login
 * 3. Verify Email
 * 4. Resend Verification Code
 * 5. Forgot Password
 * 6. Verify Reset Code
 * 7. Reset Password
 * 8. Logout
 */

// =============================================================================
// INTERNAL MOCK DATA
// Data ini digunakan oleh mock service untuk simulasi database.
// Tidak dikembalikan langsung sebagai response API.
// =============================================================================

export const initialMockAuthUsers = [
  {
    id: "admin-001",
    name: "Admin Utama",
    email: "admin123@gmail.com",
    role: "admin",
    isEmailVerified: true,
    createdAt: "2026-08-03T08:00:00.000Z",
    updatedAt: "2026-08-03T08:00:00.000Z",
  },
  {
    id: "kasir-001",
    name: "Kasir Utama",
    email: "kasir123@gmail.com",
    role: "kasir",
    isEmailVerified: true,
    createdAt: "2026-08-03T08:00:00.000Z",
    updatedAt: "2026-08-03T08:00:00.000Z",
  },
]

export const initialMockAuthCredentials = [
  {
    userId: "admin-001",
    email: "admin123@gmail.com",
    password: "password123",
  },
  {
    userId: "kasir-001",
    email: "kasir123@gmail.com",
    password: "password123",
  },
]

export const mockAuthCodes = {
  verificationCode: "123456",
  resetCode: "654321",
}

// =============================================================================
// ENDPOINT 1 — POST /api/auth/register
// Mendaftarkan akun pengguna baru
// =============================================================================

/** Endpoint 1 → 201 Created: registrasi berhasil */
export const mockRegisterSuccess = {
  success: true,
  message: "Registrasi berhasil",
  data: {
    user: {
      id: "user-001",
      name: "Pengguna Baru",
      email: "user@gmail.com",
      role: "kasir",
      isEmailVerified: false,
      createdAt: "2026-08-04T03:00:00.000Z",
      updatedAt: "2026-08-04T03:00:00.000Z",
    },
  },
}

/** Endpoint 1 → 409 Conflict: email sudah digunakan */
export const mockRegisterEmailConflict = {
  success: false,
  message: "Email sudah terdaftar",
  errors: [
    {
      field: "email",
      message: "Gunakan alamat email lain",
    },
  ],
}

/** Endpoint 1 → 422 Unprocessable Entity: data registrasi tidak valid */
export const mockRegisterValidationError = {
  success: false,
  message: "Data registrasi tidak valid",
  errors: [
    {
      field: "email",
      message: "Format email tidak valid",
    },
    {
      field: "password",
      message: "Password minimal 8 karakter",
    },
  ],
}

// =============================================================================
// ENDPOINT 2 — POST /api/auth/login
// Masuk menggunakan email dan password
// =============================================================================

/** Endpoint 2 → 200 OK: login berhasil */
export const mockLoginSuccess = {
  success: true,
  message: "Login berhasil",
  data: {
    token: "mock-access-token",
    user: {
      id: "kasir-001",
      name: "Kasir Utama",
      email: "kasir123@gmail.com",
      role: "kasir",
      isEmailVerified: true,
      createdAt: "2026-08-03T08:00:00.000Z",
      updatedAt: "2026-08-03T08:00:00.000Z",
    },
  },
}

/** Endpoint 2 → 401 Unauthorized: email atau password salah */
export const mockLoginInvalidCredentials = {
  success: false,
  message: "Email atau password salah",
  errors: [],
}

/** Endpoint 2 → 403 Forbidden: email belum diverifikasi */
export const mockLoginEmailNotVerified = {
  success: false,
  message: "Email belum diverifikasi",
  errors: [
    {
      field: "email",
      message: "Verifikasi email sebelum melakukan login",
    },
  ],
}

// =============================================================================
// ENDPOINT 3 — POST /api/auth/verify-email
// Memverifikasi email menggunakan kode verifikasi
// =============================================================================

/** Endpoint 3 → 200 OK: email berhasil diverifikasi */
export const mockVerifyEmailSuccess = {
  success: true,
  message: "Email berhasil diverifikasi",
  data: {
    email: "user@gmail.com",
    isEmailVerified: true,
  },
}

/** Endpoint 3 → 400 Bad Request: kode verifikasi salah */
export const mockVerifyEmailInvalidCode = {
  success: false,
  message: "Kode verifikasi tidak valid",
  errors: [
    {
      field: "code",
      message: "Kode verifikasi yang dimasukkan salah",
    },
  ],
}

/** Endpoint 3 → 410 Gone: kode verifikasi kedaluwarsa */
export const mockVerifyEmailExpiredCode = {
  success: false,
  message: "Kode verifikasi telah kedaluwarsa",
  errors: [
    {
      field: "code",
      message: "Kirim ulang kode verifikasi untuk mendapatkan kode baru",
    },
  ],
}

// =============================================================================
// ENDPOINT 4 — POST /api/auth/resend-verification
// Mengirim ulang kode verifikasi email
// =============================================================================

/** Endpoint 4 → 200 OK: kode verifikasi berhasil dikirim ulang */
export const mockResendVerificationSuccess = {
  success: true,
  message: "Kode verifikasi telah dikirim ke email kamu",
  data: {
    email: "user@gmail.com",
  },
}

/** Endpoint 4 → 404 Not Found: email tidak ditemukan */
export const mockResendVerificationEmailNotFound = {
  success: false,
  message: "Email tidak ditemukan",
  errors: [
    {
      field: "email",
      message: "Tidak ada akun yang terdaftar dengan email tersebut",
    },
  ],
}

/** Endpoint 4 → 409 Conflict: email sudah diverifikasi */
export const mockResendVerificationAlreadyVerified = {
  success: false,
  message: "Email sudah diverifikasi",
  errors: [
    {
      field: "email",
      message: "Silakan masuk menggunakan akun tersebut",
    },
  ],
}

// =============================================================================
// ENDPOINT 5 — POST /api/auth/forgot-password
// Mengirim kode reset password
// =============================================================================

/** Endpoint 5 → 200 OK: permintaan reset password diterima */
export const mockForgotPasswordSuccess = {
  success: true,
  message: "Jika email terdaftar, kode reset password telah dikirim",
  data: null,
}

/**
 * Untuk keamanan, email yang tidak terdaftar dapat tetap menggunakan response
 * yang sama agar keberadaan akun tidak dapat ditebak dari response API.
 */
export const mockForgotPasswordUnknownEmail = {
  success: true,
  message: "Jika email terdaftar, kode reset password telah dikirim",
  data: null,
}

// =============================================================================
// ENDPOINT 6 — POST /api/auth/verify-reset-code
// Memverifikasi kode reset password
// =============================================================================

/** Endpoint 6 → 200 OK: kode reset password valid */
export const mockVerifyResetCodeSuccess = {
  success: true,
  message: "Kode terverifikasi",
  data: {
    resetToken: "mock-reset-password-token",
  },
}

/** Endpoint 6 → 400 Bad Request: kode reset salah */
export const mockVerifyResetCodeInvalid = {
  success: false,
  message: "Kode reset password tidak valid",
  errors: [
    {
      field: "code",
      message: "Kode reset password yang dimasukkan salah",
    },
  ],
}

/** Endpoint 6 → 410 Gone: kode reset kedaluwarsa */
export const mockVerifyResetCodeExpired = {
  success: false,
  message: "Kode reset password telah kedaluwarsa",
  errors: [
    {
      field: "code",
      message: "Ajukan ulang permintaan reset password",
    },
  ],
}

// =============================================================================
// ENDPOINT 7 — POST /api/auth/reset-password
// Mengubah password menggunakan reset token
// =============================================================================

/** Endpoint 7 → 200 OK: password berhasil diubah */
export const mockResetPasswordSuccess = {
  success: true,
  message: "Password berhasil direset, silakan login ulang",
  data: null,
}

/** Endpoint 7 → 401 Unauthorized: reset token tidak valid */
export const mockResetPasswordInvalidToken = {
  success: false,
  message: "Sesi reset password tidak valid",
  errors: [
    {
      field: "resetToken",
      message: "Verifikasi kembali kode reset password",
    },
  ],
}

/** Endpoint 7 → 422 Unprocessable Entity: password baru tidak valid */
export const mockResetPasswordValidationError = {
  success: false,
  message: "Password baru tidak valid",
  errors: [
    {
      field: "password",
      message: "Password minimal 8 karakter",
    },
  ],
}

// =============================================================================
// ENDPOINT 8 — POST /api/auth/logout
// Mengakhiri sesi pengguna
// =============================================================================

/** Endpoint 8 → 200 OK: logout berhasil */
export const mockLogoutSuccess = {
  success: true,
  message: "Logout berhasil",
  data: null,
}

/** Endpoint 8 → 401 Unauthorized: pengguna tidak memiliki sesi aktif */
export const mockLogoutUnauthorized = {
  success: false,
  message: "Sesi pengguna tidak valid atau telah berakhir",
  errors: [],
}