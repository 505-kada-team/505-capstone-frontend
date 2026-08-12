## **1\. Konsep Dasar**

Production Plan adalah "jembatan" antara Menu (resep) dan Inventory (stok bahan). Selling mencatat realisasi penjualan, Plan Report menangani insiden di luar rencana, dan Forecasting mengubah ketiganya jadi data siap-analisis — keempatnya dokumentasi terpisah.

Ide inti: Plan dibuat untuk memproduksi sejumlah porsi dari satu atau lebih Menu, dalam satu rentang durasi (7–30 hari). Bahan baku dipotong (deduct) sekaligus di muka saat Plan disetujui — bukan per transaksi kasir. Kasir hanya menjual dari "stok porsi jadi" yang sudah dialokasikan, bukan memotong Inventory lagi.

**Banyak draft boleh hidup berdampingan, apapun durasinya.** Karena draft belum memotong stok apapun (`check-availability` bersifat dry-run), tidak ada batasan jumlah atau tumpang-tindih durasi antar draft. Admin bebas menyiapkan beberapa draft sekaligus (mis. plan minggu ini dan minggu depan) untuk dibandingkan sebelum memilih mana yang di-approve. **Yang exclusive hanya titik `approve`** — begitu satu draft jadi `active`, draft lain tetap boleh ada, hanya tidak bisa ikut di-approve sampai plan aktif itu selesai (`completed`/`stopped`). Tetap satu langkah: `approve` \= `draft → active` secara langsung, tidak ada status antara.

### **Batch Safety Status (baru, mengikuti Inventory v4)**

Sejak Inventory v4, FEFO tidak lagi mengecualikan batch yang akan expired di tengah durasi plan — batch tsb tetap diambil, hanya ditandai `batchSafetyStatus: unsafe`. Production Plan mewarisi penandaan ini apa adanya di `checkResult` (saat draft) dan `committedIngredients` (setelah approve), supaya admin bisa melihat bahan batch mana yang berisiko terbuang sebelum plan selesai — dan bisa menindaklanjuti lewat fitur diskon (A9) untuk mengurangi food waste, sesuai tujuan awal fitur diskon itu sendiri.

### **Race Condition Antar-Simulasi — Diperluas jadi 4 Trigger (baru)**

Sebelumnya `checkResultStale` hanya dipicu satu kondisi (plan lain approve dan memotong `inventoryId` yang sama). Standar yang dipakai tetap sama — **flag murah, bukan cascade-recompute** — tapi sumber pemicunya diperluas jadi 4, masing-masing dengan `staleReason` eksplisit supaya admin tahu apa yang harus dilakukan:

| `staleReason` | Trigger | Sumber | Tindakan disarankan |
| ----- | ----- | ----- | ----- |
| `stock_taken` | Plan lain approve dan memotong `inventoryId` yang sama | Production Plan (A6) | Disarankan refresh (A5), tidak wajib — safety net ada di `deduct` saat approve |
| `batch_removed` | `SubInventory` yang muncul di `eligibleBatches` draft ini di-soft-delete | Inventory (endpoint 9\) | Disarankan refresh, tidak wajib |
| `inventory_archived` | `Inventory` yang dipakai draft ini diarsipkan | Inventory (endpoint 6\) | Disarankan refresh, tidak wajib |
| `recipe_changed` | Resep (`ingredients[]`) atau `sellingPrice` Menu yang dipakai draft ini diedit | Menu (endpoint 4\) | **Wajib** refresh sebelum approve — lihat A6 |

Ketiga trigger pertama tetap ditangani lewat pola yang sama seperti sebelumnya: bulk field update murah (tanpa panggilan eksternal), dengan jaminan sesungguhnya berada di safety net endpoint `deduct` saat approve (kalau ternyata stok sudah tidak cukup, `deduct` gagal 409 dan `checkResult` di-refresh otomatis). Trigger `recipe_changed` berbeda — karena bisa mengubah **agregasi kebutuhan bahan itu sendiri** (bukan cuma stoknya berkurang), trigger ini **memblokir approve** sampai admin menjalankan refresh (A5) secara eksplisit.

### **Harga Menu Dibekukan Saat Approve (baru)**

Selama plan masih `draft`, `sellingPrice` tiap menu **tetap live** dari Menu — tidak ada apapun yang dibekukan, sama seperti sebelumnya, sehingga tidak perlu mekanisme "refresh harga" untuk draft. Begitu plan **`approve`**, `sellingPrice` tiap menu di plan tsb dibekukan menjadi `frozenSellingPrice` — mengikuti prinsip pembekuan yang sama seperti `committedIngredients` (supaya laporan dan diskon yang sudah aktif tidak "bergerak sendiri" kalau admin mengubah harga jual Menu di plan lain yang sedang berjalan bersamaan).

Konsekuensinya:

* `PUT /api/menu/:id` untuk mengubah `sellingPrice` **tetap diperbolehkan** kapan saja — tapi begitu Plan sudah `active`, perubahan itu **tidak lagi menembus** ke plan tsb.  
* `discountedPrice` (baik saat draft maupun setelah active) selalu dihitung dari harga yang berlaku untuk plan itu saat itu: live `sellingPrice` Menu kalau masih `draft`, `frozenSellingPrice` kalau sudah `active`/`completed`/`stopped`.  
* Tidak perlu endpoint atau mekanisme "refresh harga" — pembekuan otomatis di titik `approve` sudah cukup, dan justru lebih aman daripada opsi refresh manual (refresh di tengah diskon aktif bisa membuka celah race condition baru terhadap kasir yang sedang bertransaksi).

Diskon sendiri **tetap tidak ikut dibekukan** — field `discountPercentage` dan rentang tanggalnya tetap sumber kebenaran tunggal di `menus[].discount`, terus dievaluasi live terhadap `now()` sampai plan berakhir (tidak berubah dari desain sebelumnya).

### **Status Plan**

| Status | Arti | Trigger |
| ----- | ----- | ----- |
| `draft` | Simulasi. Belum memotong Inventory sama sekali | Dibuat oleh admin |
| `active` | Disetujui. Inventory sudah dipotong FEFO, porsi siap dijual kasir | Admin approve draft yang `readyToApprove: true` |
| `completed` | Durasi plan habis (`endDate` terlewati) | Lazy-check saat plan diakses |
| `stopped` | Dihentikan paksa sebelum durasi habis | Admin memanggil endpoint stop |
| `cancelled` | Draft yang dibatalkan sebelum sempat di-approve | Admin delete saat masih draft |

Hanya `draft` yang bisa diedit bebas. Begitu `active`, `committedIngredients` dan `frozenSellingPrice` dikunci sebagai snapshot — tidak lagi live.

### **Aturan Durasi**

`duration` dalam hari, wajib min 7 hari, maks 30 hari, divalidasi di modul Plan ini. `endDate = startDate + duration` dihitung otomatis.

### **Dari Draft ke Active — Apa yang Terjadi**

1. Saat draft dibuat/diedit, sistem mengagregasi total kebutuhan bahan lintas menu (jumlahkan `inventoryId` yang sama antar menu berbeda).  
2. Untuk tiap `inventoryId` hasil agregasi, panggil `POST /api/subinventory/check-availability` dengan `availableUntil = endDate`. Response sekarang membawa `batchSafetyStatus` per batch dan `hasUnsafeBatch` (lihat modul Inventory v4).  
3. Hasilnya disimpan sebagai `checkResult`, menentukan `readyToApprove`.  
4. Admin hanya bisa approve kalau `readyToApprove: true` **dan** `staleReason` bukan `recipe_changed` (lihat bagian Race Condition di atas).  
5. Saat approve: panggil `deduct` per `inventoryId` teragregasi dalam satu transaction. Gagal 409 → approve dibatalkan, plan tetap draft, `checkResult` di-refresh. Sukses → bekukan `committedIngredients` (termasuk `batchSafetyStatus` per batch) dan `frozenSellingPrice` per menu, set `status: "active"`, tandai `checkResultStale: true` \+ `staleReason: "stock_taken"` pada draft lain yang memakai `inventoryId` sama.

   ### **Hanya 1 Plan Aktif**

Sistem hanya mengizinkan satu Plan `active` pada satu waktu (global). `POST /api/plan/:id/approve` wajib menolak (409) kalau masih ada Plan lain `active`.

### **Gating Tanggal untuk Penjualan**

Approve boleh dilakukan kapan saja sebelum `startDate`. Penjualan hanya bisa dicatat kalau `now()` berada di antara `startDate` dan `endDate` — detail lengkap di dokumentasi modul Selling.

### **Stok "Sisa" per Menu**

remainingQuantity \= quantityPlanned − soldQuantity − approvedLossQuantity

`soldQuantity` bertambah tiap ada sale (modul Selling). `approvedLossQuantity` bertambah kalau laporan sudah di-ACC admin (modul Plan Report). `soldOutAt` tercatat begitu `remainingQuantity` menyentuh 0 sebelum `endDate`.

### **Kerugian vs Penggantian Stok**

Ringkas — detail lengkap di dokumentasi modul Plan Report. `hasPendingLossReplacement: boolean` di level Plan bernilai `true` kalau ada PlanReport kategori `ingredient`, `status: approved`, tapi `replacementDeducted: false`.

### **Diskon — Aturan Rinci**

Satu menu dalam satu plan hanya boleh punya satu slot diskon aktif/berlaku (`menus[].discount`, objek tunggal). Kalau admin ingin ubah periode/persentase, slot lama diganti (replace), bukan ditambah.

* `discount.startDate >= plan.startDate` dan `discount.endDate <= plan.endDate`.  
* `discount.startDate` tidak boleh sebelum hari ini saat slot dibuat/diganti (boleh sama dengan hari ini).  
* Bisa diset/diganti/dihapus selama plan `draft` atau `active`. Tidak bisa lagi setelah `completed`/`stopped`/`cancelled`.  
* Kalau plan diedit sehingga slot diskon existing keluar dari rentang baru → edit ditolak (409) sampai diskon dihapus/diganti dulu.  
* Tidak ada syarat `check-availability`/`readyToApprove`/kondisi expired bahan untuk membuat/mengganti diskon — independen sepenuhnya, termasuk independen dari `batchSafetyStatus` (admin boleh saja membuat diskon murni promosi tanpa alasan food-waste, atau sebaliknya justru dipicu oleh `hasUnsafeBatch: true` yang terlihat di `checkResult`).  
* Harga yang dipakai kasir dihitung live setiap transaksi: kalau `now()` berada di antara `discount.startDate`–`discount.endDate` menu tsb → pakai `discountedPrice` (dihitung dari `frozenSellingPrice` kalau plan `active`, atau live `sellingPrice` kalau masih `draft`), kalau tidak → pakai harga normal yang berlaku saat itu.  
  ---

  ## **2\. Skema Data — ProductionPlan**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `_id` | ObjectId |  |
| `name` | string |  |
| `tags` | array of string |  |
| `menus` | array of object | Lihat sub-skema `menus[]` |
| `startDate` | date |  |
| `duration` | number | Hari, 7–30 |
| `endDate` | date | `startDate + duration` |
| `status` | string | `draft` / `active` / `completed` / `stopped` / `cancelled` |
| `checkResult` | array | Hasil `check-availability` terakhir per `inventoryId` agregat — **kini membawa `batchSafetyStatus`, lihat sub-skema di bawah** |
| `checkResultStale` | boolean | **Diperluas** — lihat sub-bagian Race Condition |
| `staleReason` | string | null | **Baru.** `"stock_taken"` | `"batch_removed"` | `"inventory_archived"` | `"recipe_changed"` | `null` |
| `readyToApprove` | boolean | Turunan dari `checkResult` |
| `committedIngredients` | array | `{ inventoryId, nameInventory, quantityNeeded, batches: [{ subInventoryId, quantityUsed, costPriceUsed, batchSafetyStatus }] }` per menu, dibekukan permanen saat approve |
| `hasPendingLossReplacement` | boolean |  |
| `approvedAt`, `approvedBy` | date, string |  |
| `stoppedAt`, `stoppedBy`, `stopReason` | date, string, string |  |
| `cancelledAt` | date |  |
| `completedAt` | date |  |
| `createdAt` / `updatedAt` | date |  |

  ### **Sub-skema `checkResult[]` (per `inventoryId` agregat)**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `inventoryId` | ObjectId |  |
| `nameInventory` | string |  |
| `quantityNeeded` | number | Hasil agregasi lintas menu |
| `sufficient` | boolean |  |
| `availableQuantity` | number |  |
| `shortfall` | number | undefined | Hanya ada kalau `sufficient: false` |
| `hasUnsafeBatch` | boolean | **Baru.** `true` kalau ada minimal satu batch di `eligibleBatches` berstatus `unsafe` |
| `eligibleBatches` | array | **Baru.** `{ subInventoryId, quantityTaken, expired, batchSafetyStatus }` — diwariskan langsung dari respons Inventory endpoint 11 |

  ### **Sub-skema `menus[]`**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `menuId` | ObjectId |  |
| `quantityPlanned` | number |  |
| `soldQuantity` | number |  |
| `lossQuantity` | number |  |
| `soldOutAt` | date | null |  |
| `frozenSellingPrice` | number | null | **Baru.** `null` selagi `draft`. Diisi otomatis dari `sellingPrice` Menu saat `approve`, tidak berubah lagi setelahnya |
| `discount` | object | null | Lihat sub-skema `discount` di bawah |

  ### **Sub-skema `menus[].discount`**

*(tidak berubah)*

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `discountPercentage` | number | 1–100 |
| `startDate` | date | ≥ `plan.startDate`, ≥ hari ini saat diset |
| `endDate` | date | ≤ `plan.endDate`, \> `startDate` |
| `reason` | string |  |
| `setBy` | string |  |
| `setAt` | date |  |

**Computed** (tidak disimpan permanen, dihitung tiap akses):

* `effectiveSellingPrice` \= `frozenSellingPrice` kalau `plan.status !== "draft"`, else live `sellingPrice` dari Menu. **Ini basis baru untuk seluruh perhitungan harga di bawah** (menggantikan `sellingPrice` live yang dipakai tanpa syarat di versi sebelumnya).  
* `discountedPrice` \= `effectiveSellingPrice × (1 − discountPercentage/100)`.  
* `discountStatus`: `upcoming` (`now < startDate`) / `active` (`startDate ≤ now ≤ endDate`) / `ended` (`now > endDate`).  
* `currentPrice` (di level menu) \= `discountedPrice` kalau `discountStatus: active`, else `effectiveSellingPrice`.  
  ---

  ## **3\. Format Error Response**

  {  
    "success": false,  
    "message": "Validation error: ada menuId yang tidak ditemukan atau sudah diarsipkan",  
    "errors": \[{ "field": "menus\[1\].menuId", "message": "Menu tidak ditemukan atau berstatus deleted" }\]  
  }  
    
  ---

  ## **4\. Daftar Endpoint**

| \# | Method | Path | Fungsi | Akses |
| ----- | ----- | ----- | ----- | ----- |
| A1 | POST | `/api/plan` | Buat plan baru (status draft) | Admin |
| A2 | GET | `/api/plan` | List semua plan (filter status) | Admin |
| A3 | GET | `/api/plan/:id` | Detail plan \+ checkResult/committed \+ ringkasan \+ diskon | Admin |
| A4 | PUT | `/api/plan/:id` | Edit plan (hanya saat draft) | Admin |
| A5 | POST | `/api/plan/:id/check-availability` | Refresh simulasi ketersediaan bahan | Admin |
| A6 | POST | `/api/plan/:id/approve` | Setujui plan → deduct Inventory, bekukan `frozenSellingPrice`, draft → active | Admin |
| A7 | POST | `/api/plan/:id/stop` | Hentikan paksa, active → stopped | Admin |
| A8 | DELETE | `/api/plan/:id` | Batalkan draft (hanya saat draft) | Admin |
| A9 | PUT | `/api/plan/:id/menus/:menuId/discount` | Set/ganti slot diskon untuk satu menu | Admin |
| A10 | DELETE | `/api/plan/:id/menus/:menuId/discount` | Hapus slot diskon untuk satu menu | Admin |

  ---

  ## **5\. Detail Endpoint**

  ### **A1. `POST /api/plan` — Buat plan baru**

**Payload**

{

  "name": "Promo Nasi Goreng Agustus",

  "tags": \["promo"\],

  "startDate": "2026-08-05T00:00:00.000Z",

  "duration": 14,

  "menus": \[

    { "menuId": "menu\_001", "quantityPlanned": 100 },

    { "menuId": "menu\_002", "quantityPlanned": 50 }

  \]

}

Catatan: diskon tidak diset saat create, selalu lewat A9 setelah plan ada.

**Response 201 — mengandung batch yang mepet expired**

{

  "success": true,

  "message": "Plan berhasil dibuat sebagai draft",

  "data": {

    "\_id": "plan\_001",

    "name": "Promo Nasi Goreng Agustus",

    "tags": \["promo"\],

    "status": "draft",

    "startDate": "2026-08-05T00:00:00.000Z",

    "duration": 14,

    "endDate": "2026-08-19T00:00:00.000Z",

    "menus": \[

      {

        "menuId": "menu\_001",

        "name": "Nasi Goreng Spesial",

        "quantityPlanned": 100,

        "soldQuantity": 0,

        "lossQuantity": 0,

        "soldOutAt": null,

        "frozenSellingPrice": null,

        "effectiveSellingPrice": 25000,

        "currentPrice": 25000,

        "discount": null

      }

    \],

    "checkResult": \[

      {

        "inventoryId": "66c1a2b3d4e5f6a7b8c9d0e1",

        "nameInventory": "Beras Premium",

        "quantityNeeded": 20000,

        "sufficient": true,

        "availableQuantity": 25000,

        "hasUnsafeBatch": true,

        "eligibleBatches": \[

          { "subInventoryId": "sub\_001", "quantityTaken": 8000, "expired": "2026-08-12T00:00:00.000Z", "batchSafetyStatus": "unsafe" },

          { "subInventoryId": "sub\_002", "quantityTaken": 12000, "expired": "2026-09-01T00:00:00.000Z", "batchSafetyStatus": "safe" }

        \]

      }

    \],

    "checkResultStale": false,

    "staleReason": null,

    "readyToApprove": true,

    "hasPendingLossReplacement": false,

    "createdAt": "2026-08-01T02:00:00.000Z"

  }

}

**Response 400** (menu tidak valid)

{

  "success": false,

  "message": "Validation error: ada menuId yang tidak ditemukan atau sudah diarsipkan",

  "errors": \[{ "field": "menus\[1\].menuId", "message": "Menu tidak ditemukan atau berstatus deleted" }\]

}

**Flow**

1. Validasi `name`, `startDate`, `duration` (7–30), `menus` minimal 1 item, `quantityPlanned > 0`. `tags` opsional.  
2. Validasi tiap `menuId` merujuk Menu `status: active`.  
3. Hitung `endDate = startDate + duration`.  
4. Agregasi kebutuhan bahan lintas menu.  
5. Jalankan `check-availability` (Inventory endpoint 11\) untuk tiap `inventoryId` teragregasi dengan `availableUntil = endDate`. Simpan hasil lengkap (termasuk `batchSafetyStatus`, `hasUnsafeBatch`) ke `checkResult`, hitung `readyToApprove`.  
6. Simpan `status: "draft"`, `soldOutAt: null`, `frozenSellingPrice: null`, `discount: null` untuk semua menu, `checkResultStale: false`, `staleReason: null`.  
7. Populate `effectiveSellingPrice`/`currentPrice` (live dari Menu, karena masih draft) untuk tiap menu di response.  
8. Kembalikan 201\.  
   ---

   ### **A2. `GET /api/plan` — List semua plan**

Query params: `?status=draft&search=promo&tags=promo&page=1&limit=10`

**Response 200**

{

  "success": true,

  "data": \[

    {

      "\_id": "plan\_001",

      "name": "Promo Nasi Goreng Agustus",

      "tags": \["promo"\],

      "status": "active",

      "startDate": "2026-08-05T00:00:00.000Z",

      "endDate": "2026-08-19T00:00:00.000Z",

      "totalMenu": 2,

      "readyToApprove": true,

      "hasPendingLossReplacement": false,

      "hasActiveDiscount": true,

      "hasUnsafeBatch": true

    }

  \],

  "pagination": { "totalData": 8, "totalPage": 1, "currentPage": 1, "limit": 10 }

}

`hasUnsafeBatch` (baru) — `true` kalau minimal satu `inventoryId` di `checkResult` plan ini punya `hasUnsafeBatch: true`, sinyal ringan di list supaya admin tahu ada plan yang berpotensi jadi kandidat diskon food-waste tanpa perlu buka detail.

**Flow**: terima query opsional `status`, `search`, `tags`, `page`, `limit`. Escape regex khusus pada `search`. Hitung `hasActiveDiscount` dan `hasUnsafeBatch` per plan. Kembalikan ringkasan \+ pagination.

---

### **A3. `GET /api/plan/:id` — Detail plan**

**Response 200 — status draft, ada batch unsafe dan diskon upcoming**

{

  "success": true,

  "data": {

    "\_id": "plan\_001",

    "name": "Promo Nasi Goreng Agustus",

    "status": "draft",

    "menus": \[

      {

        "menuId": "menu\_001",

        "name": "Nasi Goreng Spesial",

        "quantityPlanned": 100,

        "frozenSellingPrice": null,

        "effectiveSellingPrice": 25000,

        "currentPrice": 25000,

        "discount": {

          "discountPercentage": 15,

          "startDate": "2026-08-12T00:00:00.000Z",

          "endDate": "2026-08-19T00:00:00.000Z",

          "reason": "Beras Premium mendekati expired",

          "discountedPrice": 21250,

          "discountStatus": "upcoming",

          "setBy": "Admin A",

          "setAt": "2026-08-05T03:00:00.000Z"

        }

      }

    \],

    "checkResult": \[

      {

        "inventoryId": "66c1a2b3d4e5f6a7b8c9d0e1",

        "nameInventory": "Beras Premium",

        "quantityNeeded": 20000,

        "sufficient": true,

        "availableQuantity": 25000,

        "hasUnsafeBatch": true,

        "eligibleBatches": \[

          { "subInventoryId": "sub\_001", "quantityTaken": 8000, "expired": "2026-08-12T00:00:00.000Z", "batchSafetyStatus": "unsafe" }

        \]

      }

    \],

    "checkResultStale": false,

    "staleReason": null,

    "readyToApprove": true

  }

}

**Response 200 — status active, harga sudah dibekukan**

{

  "success": true,

  "data": {

    "\_id": "plan\_001",

    "status": "active",

    "hasPendingLossReplacement": true,

    "warning": "Ada laporan kerugian bahan yang sudah disetujui tapi belum diganti stoknya",

    "menus": \[

      {

        "menuId": "menu\_001",

        "name": "Nasi Goreng Spesial",

        "quantityPlanned": 100,

        "soldQuantity": 62,

        "lossQuantity": 0,

        "remainingQuantity": 38,

        "soldOutAt": null,

        "frozenSellingPrice": 25000,

        "effectiveSellingPrice": 25000,

        "currentPrice": 21250,

        "discount": {

          "discountPercentage": 15,

          "startDate": "2026-08-12T00:00:00.000Z",

          "endDate": "2026-08-19T00:00:00.000Z",

          "reason": "Beras Premium mendekati expired",

          "discountedPrice": 21250,

          "discountStatus": "active",

          "setBy": "Admin A",

          "setAt": "2026-08-05T03:00:00.000Z"

        }

      }

    \],

    "committedIngredients": \[

      {

        "inventoryId": "66c1a2b3d4e5f6a7b8c9d0e1",

        "nameInventory": "Beras Premium",

        "quantityNeeded": 20000,

        "batches": \[

          { "subInventoryId": "sub\_001", "quantityUsed": 8000, "costPriceUsed": 10000, "batchSafetyStatus": "unsafe" },

          { "subInventoryId": "sub\_002", "quantityUsed": 12000, "costPriceUsed": 12000, "batchSafetyStatus": "safe" }

        \]

      }

    \]

  }

}

**Response 200 — checkResultStale karena resep berubah (draft)**

{

  "success": true,

  "data": {

    "\_id": "plan\_002",

    "status": "draft",

    "checkResultStale": true,

    "staleReason": "recipe\_changed",

    "readyToApprove": false,

    "warning": "Resep salah satu menu di plan ini berubah sejak simulasi terakhir. Refresh check-availability wajib dilakukan sebelum approve."

  }

}

**Response 404**

{ "success": false, "message": "Plan tidak ditemukan" }

**Flow**: cari plan. Tidak ada → 404\. Jalankan lazy-check `completed` dulu. Untuk tiap menu, hitung `effectiveSellingPrice` (`frozenSellingPrice` kalau bukan draft, live `sellingPrice` kalau draft), `currentPrice`, dan evaluasi `discount` seperti dijelaskan di Konsep Dasar. Sertakan `checkResult` (dengan `batchSafetyStatus`) kalau draft, atau `committedIngredients` (dengan `batchSafetyStatus`) \+ `remainingQuantity` real-time kalau `active`/`completed`/`stopped`. Sertakan `warning` sesuai `staleReason` kalau `checkResultStale: true`.

---

### **A4. `PUT /api/plan/:id` — Edit plan**

**Payload**

{ "startDate": "2026-08-07T00:00:00.000Z", "duration": 10, "menus": \[{ "menuId": "menu\_001", "quantityPlanned": 120 }\] }

**Response 200**

{

  "success": true,

  "message": "Plan berhasil diperbarui, simulasi ketersediaan sudah di-refresh",

  "data": { "\_id": "plan\_001", "endDate": "2026-08-17T00:00:00.000Z", "readyToApprove": true, "checkResultStale": false, "staleReason": null, "updatedAt": "2026-08-02T01:00:00.000Z" }

}

**Response 400** (bukan draft)

{

  "success": false,

  "message": "Plan hanya bisa diedit selagi berstatus draft",

  "errors": \[{ "field": "status", "message": "Status saat ini: active" }\]

}

**Response 409** (durasi baru membuat slot diskon keluar rentang)

{

  "success": false,

  "message": "Perubahan durasi plan membuat slot diskon menu\_001 berada di luar rentang plan baru, hapus atau sesuaikan diskon tersebut dulu",

  "errors": \[{ "field": "duration", "message": "Diskon menu\_001 (2026-08-12 s/d 2026-08-19) melebihi endDate baru 2026-08-15" }\]

}

**Flow**

1. Cari plan `status: draft`. Tidak ditemukan → 404\. Status lain → 400\.  
2. Validasi field yang dikirim sama seperti A1.  
3. Hitung ulang `endDate` kalau `startDate`/`duration` berubah.  
4. Kalau `endDate` berubah, cek tiap menu yang punya `discount`: keluar dari rentang baru → 409\.  
5. Wajib jalankan ulang `check-availability` — ini otomatis mereset `checkResultStale: false`, `staleReason: null` (edit dianggap sebagai bentuk "refresh" implisit).  
6. Kembalikan 200\.  
   ---

   ### **A5. `POST /api/plan/:id/check-availability` — Refresh simulasi**

**Response 200**

{

  "success": true,

  "data": {

    "readyToApprove": false,

    "checkResultStale": false,

    "staleReason": null,

    "checkResult": \[

      {

        "inventoryId": "66c1a2b3d4e5f6a7b8c9d0e1",

        "nameInventory": "Beras Premium",

        "quantityNeeded": 20000,

        "sufficient": true,

        "availableQuantity": 25000,

        "hasUnsafeBatch": true,

        "eligibleBatches": \[

          { "subInventoryId": "sub\_001", "quantityTaken": 20000, "expired": "2026-08-12T00:00:00.000Z", "batchSafetyStatus": "unsafe" }

        \]

      },

      {

        "inventoryId": "66c1a2b3d4e5f6a7b8c9d0e2",

        "nameInventory": "Kardus Box Kecil",

        "quantityNeeded": 150,

        "sufficient": false,

        "availableQuantity": 90,

        "shortfall": 60,

        "hasUnsafeBatch": false,

        "eligibleBatches": \[

          { "subInventoryId": "sub\_010", "quantityTaken": 90, "expired": null, "batchSafetyStatus": "safe" }

        \]

      }

    \]

  }

}

**Flow**: hanya boleh saat `status: draft`. Panggil `check-availability` Inventory per `inventoryId` agregat dengan `availableUntil = endDate`, gabungkan hasil (termasuk `batchSafetyStatus`/`hasUnsafeBatch`), update `checkResult`, **reset `checkResultStale: false` dan `staleReason: null`**, hitung `readyToApprove`. Tidak menyentuh diskon sama sekali.

---

### **A6. `POST /api/plan/:id/approve` — Setujui plan**

**Response 200**

{

  "success": true,

  "message": "Plan disetujui, stok bahan telah dialokasikan dan harga jual dibekukan",

  "data": { "\_id": "plan\_001", "status": "active", "approvedAt": "2026-08-04T02:00:00.000Z" }

}

**Response 400 — checkResultStale karena resep berubah, wajib refresh dulu**

{

  "success": false,

  "message": "Resep salah satu menu berubah sejak simulasi terakhir, wajib refresh check-availability sebelum approve",

  "errors": \[{ "field": "staleReason", "message": "staleReason: recipe\_changed" }\]

}

**Response 409 — checkResult basi / stok berubah (safety net untuk 3 trigger lain)**

{

  "success": false,

  "message": "Ketersediaan stok berubah sejak simulasi terakhir, silakan check-availability ulang",

  "errors": \[{ "field": "checkResult", "message": "1 atau lebih inventoryId tidak lagi mencukupi" }\]

}

**Response 409 — sudah ada plan lain aktif**

{

  "success": false,

  "message": "Masih ada plan lain yang sedang aktif, selesaikan atau hentikan plan tersebut dulu",

  "errors": \[{ "field": "status", "message": "Hanya boleh 1 plan berstatus active pada satu waktu" }\]

}

**Flow**

1. Cari plan `status: draft`. Tidak ada → 404\.  
2. Cek tidak ada Plan lain `status: active`. Ada → 409\.  
3. **Baru:** kalau `checkResultStale: true` **dan** `staleReason: "recipe_changed"` → tolak 400, minta refresh eksplisit dulu (lihat A5). Untuk `staleReason` lain (`stock_taken`/`batch_removed`/`inventory_archived`), lanjut ke langkah berikut — cukup diandalkan safety net di langkah 5\.  
4. Tolak kalau `readyToApprove: false` → 400\.  
5. Mulai transaction. Untuk tiap `inventoryId` teragregasi, panggil `deduct` Inventory dengan `planId` \= id plan ini, `availableUntil = endDate`. Gagal 409 → batalkan transaction, refresh `checkResult`, kembalikan 409\.  
6. Sukses: bekukan `committedIngredients` (termasuk `batchSafetyStatus` per batch dari respons `deduct`).  
7. **Baru:** untuk tiap menu di plan ini, ambil `sellingPrice` Menu **live saat ini** dan simpan sebagai `frozenSellingPrice` — tidak akan berubah lagi setelah ini walau Menu diedit belakangan.  
8. Set `status: "active"`, `approvedAt`, `approvedBy`.  
9. Tandai `checkResultStale: true`, `staleReason: "stock_taken"` pada draft lain yang memakai `inventoryId` sama.  
10. `discount` pada tiap menu (kalau ada) dibiarkan apa adanya — tidak ikut dibekukan, tetap dievaluasi live terhadap `now()` (tapi basis harganya sekarang `frozenSellingPrice`, bukan `sellingPrice` live lagi).  
11. Kembalikan 200\.  
    ---

    ### **A7. `POST /api/plan/:id/stop` — Hentikan paksa**

*(Tidak berubah struktural)*

**Payload**

{ "reason": "Kehabisan stok bahan utama", "stoppedBy": "Admin A" }

**Response 200**

{

  "success": true,

  "message": "Plan dihentikan, laporan akhir telah dibuat",

  "data": { "\_id": "plan\_001", "status": "stopped", "stoppedAt": "2026-08-12T09:00:00.000Z", "stoppedBy": "Admin A", "stopReason": "Kehabisan stok bahan utama" }

}

**Response 400** (bukan active)

{ "success": false, "message": "Hanya plan berstatus active yang bisa dihentikan", "errors": \[{ "field": "status", "message": "Status saat ini: draft" }\] }

**Flow**: hanya dari `status: active`. Set `status: "stopped"`, `stoppedAt/By`, `stopReason`. Bahan yang sudah di-deduct tidak di-reverse. `frozenSellingPrice` dan `committedIngredients` tetap seperti apa adanya (sudah beku sejak approve). Diskon otomatis berhenti berlaku. Generate `PlanFinalReport` (sekali) dengan `reason: "stopped"`.

`POST /api/plan/:id/complete` (lazy-check, bukan dipanggil user langsung) menjalankan flow sama persis dengan `reason: "completed"`.

---

### **A8. `DELETE /api/plan/:id` — Batalkan draft**

*(Tidak berubah)*

**Response 200**

{ "success": true, "message": "Draft plan berhasil dibatalkan", "data": { "\_id": "plan\_001", "status": "cancelled", "cancelledAt": "2026-08-02T03:00:00.000Z" } }

**Response 400** (bukan draft)

{ "success": false, "message": "Hanya plan berstatus draft yang bisa dibatalkan", "errors": \[{ "field": "status", "message": "Status saat ini: active — hentikan lewat endpoint stop, bukan dibatalkan" }\] }

**Flow**: cari plan `status: draft`. Tidak ditemukan → 404\. Status lain → 400\. Tidak ada Inventory yang perlu di-reverse (draft belum pernah deduct). Cukup `status: "cancelled"`, `cancelledAt`. Tidak hard-delete.

---

### **A9. `PUT /api/plan/:id/menus/:menuId/discount` — Set/ganti slot diskon**

**Payload**

{

  "discountPercentage": 15,

  "startDate": "2026-08-12T00:00:00.000Z",

  "endDate": "2026-08-19T00:00:00.000Z",

  "reason": "Beras Premium mendekati expired"

}

**Response 200**

{

  "success": true,

  "message": "Diskon berhasil diterapkan pada menu",

  "data": {

    "menuId": "menu\_001",

    "effectiveSellingPrice": 25000,

    "discount": {

      "discountPercentage": 15,

      "startDate": "2026-08-12T00:00:00.000Z",

      "endDate": "2026-08-19T00:00:00.000Z",

      "reason": "Beras Premium mendekati expired",

      "discountedPrice": 21250,

      "discountStatus": "upcoming",

      "setBy": "Admin A",

      "setAt": "2026-08-05T03:00:00.000Z"

    }

  }

}

**Response 400** (di luar rentang plan / plan tidak bisa diedit) — *tidak berubah dari sebelumnya*

**Flow**

1. Cari plan `status` draft atau active. Selain itu → 400\. Tidak ditemukan → 404\.  
2. Cek `menuId` ada di `plan.menus`. Tidak ada → 400\.  
3. Validasi `discountPercentage` 1–100, `startDate < endDate`, `startDate >= now()`, `startDate >= plan.startDate`, `endDate <= plan.endDate`.  
4. Replace langsung kalau sudah ada `discount` sebelumnya.  
5. Simpan `discount` baru, `setBy`, `setAt`.  
6. Kembalikan 200 dengan `discountedPrice` dihitung dari **`effectiveSellingPrice`** (live kalau draft, `frozenSellingPrice` kalau active) — bukan selalu live `sellingPrice` seperti versi sebelumnya.  
   ---

   ### **A10. `DELETE /api/plan/:id/menus/:menuId/discount` — Hapus slot diskon**

*(Tidak berubah)*

**Response 200**

{ "success": true, "message": "Diskon pada menu berhasil dihapus", "data": { "menuId": "menu\_001", "discount": null } }

**Response 404** (tidak ada diskon untuk dihapus)

{ "success": false, "message": "Menu ini tidak memiliki diskon aktif untuk dihapus", "errors": \[{ "field": "menuId", "message": "discount: null" }\] }

**Flow**: cari plan draft/active. Cek `menuId` punya `discount`. Set `discount: null`. Tidak ada soft-delete/riwayat di level Plan — histori penjualan tetap konsisten karena `PlanSale` menyimpan snapshot sendiri. Kembalikan 200\.

---

## **6\. Catatan untuk Tim**

* Endpoint A6, A7 wajib dibungkus transaction.  
* Lazy-check status `completed` dijalankan di titik akses (`GET /api/plan/:id`, `GET /api/plan`) — bukan cron.  
* Hanya 1 plan aktif pada satu waktu; stop tidak me-reverse stok.  
* **\[Baru\] `checkResultStale` sekarang punya 4 trigger dengan `staleReason` eksplisit** — 3 trigger (`stock_taken`, `batch_removed`, `inventory_archived`) tetap ditangani via flag murah \+ safety net di `deduct` seperti desain sebelumnya (tidak memblokir approve secara langsung). Trigger ke-4 (`recipe_changed`) **memblokir approve** sampai refresh eksplisit, karena bisa mengubah agregasi kebutuhan bahan itu sendiri, bukan cuma soal stok berkurang.  
* **\[Baru\] Modul Inventory dan Menu bertanggung jawab memicu bulk-update `checkResultStale`/`staleReason`** ke draft Plan yang terdampak:  
  * Inventory endpoint 6 (arsip inventory) → `staleReason: "inventory_archived"` ke draft yang `checkResult`\-nya mengandung `inventoryId` tsb.  
  * Inventory endpoint 9 (hapus batch) → `staleReason: "batch_removed"` ke draft yang `eligibleBatches`\-nya mengandung `subInventoryId` tsb.  
  * Menu endpoint 4 (edit `ingredients`/`sellingPrice`) → `staleReason: "recipe_changed"` ke draft yang `menus[].menuId`\-nya mengandung `menuId` tsb.  
  * Production Plan A6 (approve) → `staleReason: "stock_taken"` ke draft lain yang memakai `inventoryId` sama (tidak berubah dari sebelumnya).  
* Kalau lebih dari satu trigger terjadi bersamaan pada draft yang sama, `staleReason` menyimpan **yang paling baru terjadi** (bukan array multi-reason) — cukup untuk kebutuhan warning UI, tidak perlu riwayat lengkap semua penyebab stale.  
* **\[Baru\] `frozenSellingPrice` mengikuti prinsip pembekuan yang sama seperti `committedIngredients`** — begitu `active`, tidak ada mekanisme refresh harga apapun. Kalau admin memang perlu menyesuaikan harga jual di tengah plan aktif berjalan, satu-satunya jalur yang tersedia adalah lewat diskon (A9), bukan mengubah harga dasar.  
* Diskon: satu menu satu plan \= satu slot diskon, di-replace via A9, dihapus via A10. Tidak ada riwayat multi-diskon tersimpan di level Plan — bisa direkonstruksi dari `PlanSale.discountApplied`/`discountPercentage` di modul Selling.  
* Diskon tidak pernah digate oleh `readyToApprove`/`checkResult`/`batchSafetyStatus` — independen sepenuhnya secara desain, walau secara praktik `hasUnsafeBatch: true` di `checkResult` adalah sinyal yang wajar dipakai admin sebagai alasan membuat diskon.  
* `checkResult[].eligibleBatches` dan `committedIngredients[].batches[]` **wajib** bersumber dari fungsi query FEFO yang sama persis di modul Inventory (endpoint 11 & 12\) — supaya `batchSafetyStatus` yang terlihat saat simulasi (draft) konsisten dengan yang benar-benar terjadi saat approve.  
* Modul ini dipisah dari Selling, Plan Report, dan Forecasting secara route \+ akses, bukan pemisahan database/service.

