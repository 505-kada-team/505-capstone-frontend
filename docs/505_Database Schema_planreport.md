## **1\. Konsep Dasar**

Modul Plan Report menangani insiden operasional di luar rencana (bahan/porsi rusak-hilang) dan penggantiannya. Kasir hanya bisa membuat laporan; review, list lengkap, dan penggantian stok adalah wewenang admin.

### **Kerugian vs Penggantian Stok — Sengaja Dipisahkan**

* `quantityLost` adalah fakta kejadian (berapa yang benar-benar tumpah/rusak) — tidak divalidasi terhadap `committedIngredients`, tidak berubah setelah dilaporkan.  
* Berapa banyak stok yang ditarik ulang dari Inventory untuk menggantinya (`replacementQuantity`) adalah keputusan operasional admin, terpisah dan tidak wajib sama persis dengan `quantityLost`.  
* Tidak ada jalur direct-deduct ke Inventory di luar mekanisme PlanReport, termasuk kalau admin sendiri yang melapor (boleh langsung `approved`, tapi tetap lewat entitas laporan yang sama) — supaya data yang dipakai forecasting bisa membedakan pengurangan stok akibat resep normal vs akibat insiden.

  ### **Waktu Kejadian vs Waktu Lapor (baru)**

`createdAt` (kapan laporan dikirim ke sistem) tidak selalu sama dengan kapan insiden benar-benar terjadi — kasir bisa saja baru sempat lapor di akhir shift. Karena harga (diskon) dan ketersediaan plan bersifat time-sensitive, sistem sekarang membedakan dua waktu ini secara eksplisit:

* **`incidentAt`** — waktu kejadian sebenarnya, wajib diisi manual oleh pelapor. Semua evaluasi harga/diskon untuk kategori `menu` dihitung terhadap titik waktu ini, bukan terhadap `now()` saat laporan dibuat atau direview.  
* **`createdAt`** — tetap ada, murni audit kapan record dibuat di sistem.  
* **`isLateReport`** — flag turunan (`createdAt − incidentAt > 24 jam`), sinyal informatif untuk admin, bukan aturan bisnis yang memblokir apapun.

  ### **Valuasi Kerugian untuk Kategori `menu` (baru)**

Sebelumnya, laporan kategori `menu` hanya mencatat `quantityLost` tanpa nilai Rupiah — berbeda dengan kategori `ingredient` yang otomatis punya `replacementCost` lewat mekanisme deduct. Sekarang kategori `menu` mendapat objek `valuation`, dihitung **sekali saat laporan dibuat (C1)** lalu dibekukan permanen (pola yang sama seperti `PlanSale.priceUsed`), berisi dua angka dengan tujuan berbeda:

* **`costLoss`** — nilai bahan baku yang terbuang percuma (cost basis). Karena deduct FEFO Inventory dipotong per `inventoryId` hasil agregasi lintas menu (bukan per menu), sistem tidak pernah tahu batch persis mana yang "jatah" menu tertentu kalau bahan itu dipakai lebih dari satu resep dalam plan yang sama. Sebagai pendekatan terbaik yang tersedia, `costLoss` dihitung dari **rata-rata tertimbang (weighted average)** `costPriceUsed` seluruh batch yang terpotong untuk plan tsb — konsisten dengan filosofi `lastCostBatch` yang memang didesain sebagai estimasi, bukan presisi mutlak.  
* **`lostRevenueEstimate`** — potensi pendapatan yang batal masuk (revenue basis), dihitung dari harga yang efektif berlaku **pada `incidentAt`** — termasuk diskon kalau saat itu sedang aktif. Ini yang membuat diskon relevan terhadap modul ini: dua insiden dengan `quantityLost` sama bisa punya `lostRevenueEstimate` berbeda tergantung apakah menu tsb sedang didiskon saat kejadian.

Kedua angka ini **murni untuk kebutuhan pelaporan/analisis (forecasting)** — tidak mengubah stok, kas, atau entitas manapun. Ini beda prinsip dengan `replacementCost` (kategori `ingredient`) yang merepresentasikan stok fisik yang benar-benar ditarik ulang.

### **Validasi Status Plan Diperlonggar (baru)**

Sebelumnya C1 mewajibkan plan berstatus `active`. Ini menyebabkan laporan telat (insiden terjadi H-1 sebelum plan berubah status) tertolak padahal kejadian sah terjadi saat plan masih berjalan. Sekarang validasi bergeser dari "status plan saat request dikirim" menjadi **"apakah `incidentAt` berada dalam rentang durasi plan"**:

* Plan boleh berstatus `active`, `stopped`, atau `completed` saat laporan dibuat.  
* `incidentAt` wajib berada di antara `plan.startDate` dan `plan.endDate` (atau `<=` waktu plan dihentikan, untuk kasus `stopped`).  
* Plan `draft` atau `cancelled` tetap ditolak — belum pernah ada alokasi stok/porsi yang bisa "rusak".

  ### **Warning: Gap yang Belum Diselesaikan**

Flag `hasPendingLossReplacement: boolean` di level Plan (lihat modul Production Plan) — `true` kalau ada PlanReport kategori `ingredient`, status `approved`, tapi `replacementDeducted: false`. Tidak berubah dari desain v1.

---

## **2\. Skema Data — PlanReport**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `_id` | ObjectId |  |
| `planId` | ObjectId |  |
| `category` | string | `ingredient` atau `menu` |
| `refId` | ObjectId | `inventoryId` atau `menuId` sesuai `category` |
| `quantityLost` | number | Fakta kejadian, tidak berubah setelah dilaporkan |
| `incidentAt` | date | **Baru.** Waktu kejadian sebenarnya. Wajib. `<= now()`, dan berada dalam rentang durasi plan |
| `isLateReport` | boolean | **Baru.** Turunan: `true` kalau `createdAt − incidentAt > 24 jam` |
| `reason` | string |  |
| `reportedBy` | string |  |
| `reportedByRole` | string | `cashier` / `admin` |
| `status` | string | `pending` / `approved` / `rejected` |
| `reviewedBy`, `reviewedAt`, `adminNote` | string, date, string |  |
| `valuation` | object | null | **Baru.** Hanya terisi kalau `category: "menu"`. `null` untuk `category: "ingredient"`. Lihat sub-skema di bawah |
| `replacementQuantity` | number | Keputusan admin, tidak wajib sama dengan `quantityLost`. Khusus `category: ingredient` |
| `varianceNote` | string | Opsional |
| `replacementDeducted` | boolean |  |
| `replacementBatches` | array | `{ subInventoryId, quantityUsed, costPriceUsed }` |
| `replacementCost` | number |  |
| `replacedAt`, `replacedBy` | date, string |  |
| `createdAt` | date |  |

### **Sub-skema `valuation` (baru — khusus `category: "menu"`)**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `unitCostAtLoss` | number | Cost bahan per porsi, dari weighted average `costPriceUsed` seluruh batch di `committedIngredients` plan tsb |
| `costLoss` | number | `unitCostAtLoss × quantityLost` |
| `originalPriceAtLoss` | number | `sellingPrice` Menu, snapshot live saat laporan dibuat |
| `discountAppliedAtLoss` | boolean | Hasil evaluasi `discount` menu terhadap `incidentAt` (bukan `now()`) |
| `discountPercentageAtLoss` | number | null | `null` kalau `discountAppliedAtLoss: false` |
| `priceUsedAtLoss` | number | `originalPriceAtLoss × (1 − discountPercentageAtLoss/100)` kalau diskon aktif saat `incidentAt`, else `= originalPriceAtLoss` |
| `lostRevenueEstimate` | number | `priceUsedAtLoss × quantityLost` |

Semua field `valuation` dihitung sekali saat C1, lalu dibekukan permanen — tidak dihitung ulang di GET/review, mengikuti pola `PlanSale.priceUsed`.

---

## **3\. Format Error Response**

Konsisten dengan modul lain:

* {  
*   "success": false,  
*   "message": "Laporan ini sudah pernah direview",  
*   "errors": \[  
*     { "field": "status", "message": "Status saat ini: approved" }  
*   \]  
* }  
    
  ---

  ## **4\. Daftar Endpoint**

| \# | Method | Path | Fungsi | Akses |
| ----- | ----- | ----- | ----- | ----- |
| C1 | POST | `/api/plan-reports` | Lapor kerusakan/kehilangan | Kasir & Admin |
| C2 | GET | `/api/plan-reports` | List laporan (filter `planId`/`status`/`category`) | Admin |
| C3 | PUT | `/api/plan-reports/:id/review` | ACC/tolak laporan | Admin |
| C4 | POST | `/api/plan-reports/:id/add-inventory` | Tarik stok pengganti akibat rugi | Admin |

  ---

  ## **5\. Detail Endpoint**

  ### **C1. `POST /api/plan-reports` — Lapor kerusakan/kehilangan**

**Payload**

* {  
*   "planId": "plan\_001",  
*   "category": "menu",  
*   "refId": "menu\_001",  
*   "quantityLost": 2,  
*   "incidentAt": "2026-08-13T03:15:00.000Z",  
*   "reason": "Terjatuh saat penyajian",  
*   "reportedBy": "Sari",  
*   "reportedByRole": "cashier"  
* }


**Response 201 — kategori `menu`, diskon sedang aktif saat `incidentAt`**

* {  
*   "success": true,  
*   "message": "Laporan berhasil dikirim, menunggu review admin",  
*   "data": {  
*     "\_id": "report\_012",  
*     "planId": "plan\_001",  
*     "category": "menu",  
*     "refId": "menu\_001",  
*     "quantityLost": 2,  
*     "incidentAt": "2026-08-13T03:15:00.000Z",  
*     "isLateReport": false,  
*     "reason": "Terjatuh saat penyajian",  
*     "reportedBy": "Sari",  
*     "reportedByRole": "cashier",  
*     "status": "pending",  
*     "valuation": {  
*       "unitCostAtLoss": 4500,  
*       "costLoss": 9000,  
*       "originalPriceAtLoss": 25000,  
*       "discountAppliedAtLoss": true,  
*       "discountPercentageAtLoss": 15,  
*       "priceUsedAtLoss": 21250,  
*       "lostRevenueEstimate": 42500  
*     },  
*     "createdAt": "2026-08-13T05:00:00.000Z"  
*   }  
* }


**Response 201 — kategori `menu`, tidak ada diskon saat `incidentAt`**

* {  
*   "success": true,  
*   "message": "Laporan berhasil dikirim, menunggu review admin",  
*   "data": {  
*     "\_id": "report\_014",  
*     "category": "menu",  
*     "refId": "menu\_002",  
*     "quantityLost": 1,  
*     "incidentAt": "2026-08-09T10:00:00.000Z",  
*     "isLateReport": true,  
*     "status": "pending",  
*     "valuation": {  
*       "unitCostAtLoss": 2200,  
*       "costLoss": 2200,  
*       "originalPriceAtLoss": 8000,  
*       "discountAppliedAtLoss": false,  
*       "discountPercentageAtLoss": null,  
*       "priceUsedAtLoss": 8000,  
*       "lostRevenueEstimate": 8000  
*     },  
*     "createdAt": "2026-08-11T02:00:00.000Z"  
*   }  
* }


**Response 201 — kategori `ingredient`, dilaporkan admin (auto-approved), `valuation: null`**

* {  
*   "success": true,  
*   "message": "Laporan tercatat dan otomatis disetujui",  
*   "data": {  
*     "\_id": "report\_013",  
*     "category": "ingredient",  
*     "refId": "66c1a2b3d4e5f6a7b8c9d0e1",  
*     "quantityLost": 200,  
*     "incidentAt": "2026-08-10T08:00:00.000Z",  
*     "isLateReport": false,  
*     "reportedBy": "Admin A",  
*     "reportedByRole": "admin",  
*     "status": "approved",  
*     "reviewedBy": "Admin A",  
*     "reviewedAt": "2026-08-10T08:05:00.000Z",  
*     "valuation": null  
*   }  
* }


**Response 409 — plan belum pernah aktif**

* {  
*   "success": false,  
*   "message": "Laporan hanya bisa dibuat untuk plan yang sudah pernah aktif",  
*   "errors": \[  
*     { "field": "planId", "message": "Status plan saat ini: draft" }  
*   \]  
* }


**Response 400 — `incidentAt` di luar rentang durasi plan**

* {  
*   "success": false,  
*   "message": "Validation error: incidentAt berada di luar rentang durasi plan",  
*   "errors": \[  
*     { "field": "incidentAt", "message": "incidentAt (2026-08-20) melebihi endDate plan (2026-08-19)" }  
*   \]  
* }


**Response 400 — `incidentAt` di masa depan**

* {  
*   "success": false,  
*   "message": "Validation error: incidentAt tidak boleh di masa depan",  
*   "errors": \[  
*     { "field": "incidentAt", "message": "incidentAt melebihi waktu saat ini" }  
*   \]  
* }


**Flow**

1. Terima payload, termasuk `incidentAt` (wajib, baru).  
2. Cari plan berdasarkan `planId`. Status harus salah satu dari `active`, `stopped`, `completed`. Selain itu (`draft`/`cancelled`) → 409\.  
3. Validasi `incidentAt`: `<= now()`, dan berada dalam rentang `plan.startDate`–`plan.endDate` (untuk plan `stopped`, batas efektif adalah `stoppedAt` bukan `endDate` asli — insiden tidak mungkin terjadi setelah plan dihentikan paksa). Melanggar salah satu → 400\.  
4. Hitung `isLateReport = (createdAt − incidentAt) > 24 jam` (threshold dapat dikonfigurasi; murni sinyal, tidak memblokir apapun).  
5. Simpan `PlanReport`. `reportedByRole: "cashier"` → `status: "pending"`. `reportedByRole: "admin"` → langsung `status: "approved"`, `reviewedBy`/`reviewedAt` di-set otomatis.  
6. **Kalau `category: "menu"`** — hitung `valuation`:  
   * Ambil `committedIngredients` milik plan ini. Untuk tiap ingredient yang menjadi resep menu tsb (dari snapshot resep di `committedIngredients`, bukan live dari Menu — supaya konsisten dengan apa yang benar-benar terpotong saat approve), hitung weighted average `costPriceUsed` dari `batches[]` ingredient itu: `Σ(quantityUsed × costPriceUsed) / Σ quantityUsed`.  
   * Jumlahkan `(weightedAvgCost × quantityNeeded resep)` untuk seluruh ingredient di menu tsb → `unitCostAtLoss`. `costLoss = unitCostAtLoss × quantityLost`.  
   * Ambil `sellingPrice` Menu **live** saat ini → `originalPriceAtLoss`.  
   * Evaluasi `discount` menu tsb (dari dokumen Plan, field `menus[].discount`) terhadap **`incidentAt`** — bukan `now()`: kalau `incidentAt` berada di antara `discount.startDate`–`discount.endDate` → `discountAppliedAtLoss: true`, `priceUsedAtLoss = originalPriceAtLoss × (1 − discountPercentage/100)`. Kalau tidak (termasuk kalau menu tsb tidak pernah punya diskon) → `discountAppliedAtLoss: false`, `priceUsedAtLoss = originalPriceAtLoss`.  
   * `lostRevenueEstimate = priceUsedAtLoss × quantityLost`.  
   * Simpan seluruh hasil sebagai snapshot permanen di `valuation`.  
7. **Kalau `category: "ingredient"`** — `valuation: null`. Flow sisanya identik desain v1 (cost realisasi baru muncul belakangan lewat `replacementCost` di C4).  
8. Kalau hasil akhir `status: approved` (baik langsung dari admin, atau nanti lewat C3) dan `category: ingredient` → `hasPendingLossReplacement` plan induk jadi `true`.  
9. Kembalikan 201\.  
   ---

   ### **C2. `GET /api/plan-reports` — List laporan**

Query params: `?planId=plan_001&status=pending&category=menu`

**Response 200**

* {  
*   "success": true,  
*   "data": \[  
*     {  
*       "\_id": "report\_012",  
*       "planId": "plan\_001",  
*       "category": "menu",  
*       "refId": "menu\_001",  
*       "nameRef": "Nasi Goreng Spesial",  
*       "quantityLost": 2,  
*       "incidentAt": "2026-08-13T03:15:00.000Z",  
*       "isLateReport": false,  
*       "status": "pending",  
*       "valuation": {  
*         "costLoss": 9000,  
*         "lostRevenueEstimate": 42500  
*       },  
*       "createdAt": "2026-08-13T05:00:00.000Z"  
*     },  
*     {  
*       "\_id": "report\_010",  
*       "planId": "plan\_001",  
*       "category": "ingredient",  
*       "refId": "66c1a2b3d4e5f6a7b8c9d0e1",  
*       "nameRef": "Beras Premium",  
*       "quantityLost": 500,  
*       "incidentAt": "2026-08-09T02:00:00.000Z",  
*       "isLateReport": false,  
*       "status": "approved",  
*       "replacementDeducted": false,  
*       "valuation": null,  
*       "createdAt": "2026-08-09T02:30:00.000Z"  
*     }  
*   \]  
* }


**Flow**

1. Terima query opsional `planId`, `status`, `category`.  
2. Populate `nameRef` live dari Menu/Inventory sesuai `category`.  
3. Untuk item `category: "menu"`, sertakan ringkasan `valuation` (`costLoss`, `lostRevenueEstimate`) — breakdown lengkap (`unitCostAtLoss`, `discountAppliedAtLoss`, dst.) hanya perlu ditampilkan di endpoint detail kalau ada, atau langsung disertakan penuh di sini kalau frontend butuh (tidak ada endpoint detail terpisah untuk PlanReport saat ini, jadi disarankan sertakan objek `valuation` lengkap, bukan ringkasan).  
4. Urutkan `createdAt` menurun.  
   ---

   ### **C3. `PUT /api/plan-reports/:id/review` — ACC/tolak laporan**

**Payload**

* { "decision": "approved", "adminNote": "Sudah dicek, sesuai" }


**Response 200**

* {  
*   "success": true,  
*   "message": "Laporan disetujui",  
*   "data": {  
*     "\_id": "report\_012",  
*     "status": "approved",  
*     "reviewedBy": "Admin A",  
*     "reviewedAt": "2026-08-13T06:00:00.000Z",  
*     "adminNote": "Sudah dicek, sesuai"  
*   }  
* }


**Response 400 — bukan `pending`**

* {  
*   "success": false,  
*   "message": "Laporan ini sudah pernah direview",  
*   "errors": \[{ "field": "status", "message": "Status saat ini: approved" }\]  
* }


**Flow**

1. Hanya berlaku dari `status: pending`. Selain itu → 400\.  
2. `decision: approved` → `status: approved`, `reviewedBy`/`reviewedAt` terisi. `quantityLost` ditambahkan ke `approvedLossQuantity` menu terkait di dokumen Plan (lihat modul Production Plan). Kalau `category: ingredient` → `hasPendingLossReplacement` plan induk jadi `true`.  
3. `decision: rejected` → `status: rejected`, `reviewedBy`/`reviewedAt`/`adminNote` terisi, tidak ada efek lanjutan ke Plan.  
4. **Tidak ada penghitungan ulang `valuation` di endpoint ini** — nilai sudah dibekukan sejak C1, terlepas dari kapan laporan direview atau apakah diskon/harga menu sudah berubah sejak saat itu.  
5. Kembalikan 200\.  
   ---

   ### **C4. `POST /api/plan-reports/:id/add-inventory` — Tarik stok pengganti**

Tidak berubah dari desain v1 — sepenuhnya independen dari diskon karena bahan mentah tidak punya konsep harga jual/diskon.

**Payload**

* { "replacementQuantity": 2000, "availableUntil": "2026-08-19T00:00:00.000Z", "varianceNote": null }


`replacementQuantity` default \= `quantityLost` laporan terkait kalau tidak dikirim, admin bebas override.

**Response 200**

* {  
*   "success": true,  
*   "message": "Stok pengganti berhasil ditarik dan dicatat di laporan",  
*   "data": {  
*     "reportId": "report\_010",  
*     "replacementBatches": \[  
*       { "subInventoryId": "sub\_004", "quantityUsed": 2000, "costPriceUsed": 11000 }  
*     \],  
*     "replacementCost": 22000  
*   }  
* }


**Flow**

1. Cari PlanReport dengan `status: approved`, `category: ingredient`, `replacementDeducted: false`. Cek plan induk berstatus `active` (penggantian stok hanya relevan kalau plan masih berjalan dan porsi masih akan dijual) → selain itu 409\.  
2. Panggil `deduct` Inventory untuk `refId` sejumlah `replacementQuantity`, `planId` \= plan terkait. Ini deduct tambahan, tidak mengubah `committedIngredients` yang sudah dibekukan saat approve.  
3. Simpan `replacementBatches`, `replacementCost`, `replacementQuantity`, `varianceNote`, `replacementDeducted: true`.  
4. Update `hasPendingLossReplacement` plan induk jadi `false` kalau tidak ada laporan `ingredient` lain yang masih menggantung.  
5. Kembalikan 200\.  
6. Kalau `category: menu`, endpoint ini tidak relevan — kerugian porsi jadi cukup tercermin di `approvedLossQuantity` menu tersebut (modul Production Plan) dan `valuation.costLoss`/`lostRevenueEstimate` di laporan ini sendiri (untuk kebutuhan analisis, bukan penggantian stok — porsi jadi tidak "diganti" dari Inventory, harus dimasak ulang dari alokasi bahan yang sama, yang berarti idealnya jadi laporan `ingredient` terpisah kalau bahan tambahan benar-benar ditarik untuk produksi ulang).  
   ---

   ## **6\. Catatan untuk Tim**

* Endpoint C3, C4 wajib dibungkus transaction (tidak berubah dari v1).  
* `quantityLost` dan `replacementQuantity` sengaja dipisah; tidak ada jalur direct-deduct ke Inventory di luar mekanisme PlanReport.  
* Endpoint C4 hanya berlaku selama plan `active` — beda dengan C1 yang sekarang menerima laporan untuk plan `active`/`stopped`/`completed` selama `incidentAt` valid. Ini disengaja: laporan insiden boleh telat, tapi penggantian stok fisik hanya masuk akal kalau plan masih berjalan dan porsi masih akan dijual.  
* **`valuation` (baru) adalah angka estimasi untuk kebutuhan pelaporan/forecasting, bukan transaksi keuangan** — tidak memotong stok, tidak masuk rekonsiliasi kas, dan tidak boleh disamakan perlakuannya dengan `replacementCost` (yang merepresentasikan stok fisik yang benar-benar ditarik ulang).  
* `unitCostAtLoss` dihitung dari weighted average, bukan FEFO presisi per menu — ini keterbatasan yang disengaja karena deduct Inventory dipotong per `inventoryId` agregat lintas menu, bukan per resep. Kalau ke depannya dibutuhkan atribusi biaya per menu yang lebih presisi, itu berarti perubahan besar di cara deduct FEFO bekerja di modul Production Plan (memecah deduct per menu, bukan agregat) — bukan perubahan kecil di modul ini.  
* `discountAppliedAtLoss`/`priceUsedAtLoss` dievaluasi terhadap `incidentAt`, bukan `now()` atau `reviewedAt` — konsisten dengan prinsip yang sama seperti `PlanSale.priceUsed`: harga adalah snapshot momen kejadian, tidak boleh berubah walau diskon di Plan diedit/dihapus setelahnya.  
* `isLateReport` murni sinyal UI untuk admin (mis. badge "Laporan telat \>24 jam"), tidak memblokir approve/reject maupun mengubah `valuation`.  
* Perlu didiskusikan ke depan: apakah `isLateReport` butuh threshold berbeda per kategori (mis. `ingredient` yang menyangkut bahan mudah rusak mungkin butuh threshold lebih ketat dari `menu`), atau cukup satu nilai global seperti sekarang.