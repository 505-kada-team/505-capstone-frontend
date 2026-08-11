# 505_Database Schema

## 1. Ringkasan Keputusan Desain (akumulasi v1 → v4)

| # | Keputusan Final | Asal Revis i | Alasan |
| --- | --- | --- | --- |
| 1 | Inventory pakai soft-delete (status : active/deleted), bukan hard delete | v2 | Menu tetap bisa refer ke Inventory lama walau sudah diarsipkan; hard delete merusak referensi |
| 2 | SubInventory pakai soft-delete dengan status lifecycle (active/depleted/expired/deleted ) | v2 | Riwayat penghapusan otomatis tersimpan di record itu sendiri, tanpa collection terpisah |
| 3 | Expired dicek lazy (saat data diakses), bukan cron harian | v2 | Efisien, status tetap akurat saat dibutuhkan, tanpa scheduled job |
| 4 | Endpoint baru GET /api/inventory/dropdown | v2 | Kebutuhan create Menu/Plan beda dari list inventory biasa (tanpa pagination, field minimal) |
| 5 | HistorySubInventory & HistoryUsage tidak pernah dihapus, tetap utuh walau sumbernya di-soft-delete | v2 | Snapshot nama sudah tersimpan di history, jadi tetap terbaca meski diarsipkan |
| 6 | Klarifikasi eksplisit: costPrices (SubInventory) = harga per unit, bukan harga total batch | v3 | Mencegah bug klasik unit cost vs total cost tertukar |
| 7 | lastCostBatch (Inventory) = estimasi cepat untuk Menu, berbeda dari costPriceUsed (cost aktual saat deduct FEFO) | v3 | Menu butuh estimasi cepat, tapi laporan profit/COGS harus pakai cost batch yang benar-benar terpakai |
| 8 | Endpoint baru POST /api/subinventory/check-availab ility (dry-run, tanpa mutasi) | v3 | Production Plan butuh validasi stok cukup sebelum approve, termasuk pertimbangan tanggal expired vs durasi plan |
| 9 | Param baru availableUntil pada deduct & check-availability | v3 | Batch yang akan expired sebelum plan selesai dipertimbangkan dalam perhitungan stok tersedia |

1 Batch yang akan expired di tengah
0 durasi plan TIDAK lagi dikecualikan dari perhitungan tetap diambil FEFO, hanya ditandai batchSafetyStatus: unsafe

Keputusan v1-v3 yang digantikan dan tidak lagi berlaku:

- ~~Hard delete Inventory (v1)~~ → digantikan soft-delete (#1).
- ~~Hard delete SubInventory + pengecekan “sudah pernah dipakai atau belum” (v1)~~ → digantikan soft-delete tanpa syarat pemakaian (#2).
- ~~Batch yang expired sebelum availableUntil dikecualikan total dari perhitungan stok (excludedDueToExpiry, v3)~~ → digantikan batchSafetyStatus per batch, tidak ada lagi yang dikecualikan (#10, v4).

## 2. Konsep Dasar

Category

- ingredients - wajib punya expired
- packaging - tidak perlu expired

Unit: gr|ml|pcs
Status Inventory

| Status | Arti |
| --- | --- |
| activ e | Muncul di list, dropdown, dan bisa dipilih untuk plan/menu baru |
| delet ed | Diarsipkan (soft-delete). Tidak muncul di dropdown/list default, tapi tetap ada di DB dan tetap valid untuk Menu lama yang sudah menunjuk ke sana |

Status SubInventory

| Status |  | Penyebab / Trigger |  | Karakteristik quantity |
| --- | --- | --- | --- | --- |
| active | Batch normal |  | > 0 |  |

| deplet ed | Stok habis via deduct FEFO (otomatis saat quantity mencapai 0) | = 0 |
| --- | --- | --- |
| expire d | Tanggal expired sudah lewat (lazy check saat diakses) | bisa > 0 |
| delete d | Dihapus manual oleh user (misal batch rusak/salah input) | bisa berapa saja |

Batch dengan status selain active tidak pernah ikut dihitung dalam quantityTotal, totalSubInventory, maupun jadi kandidat FEFO deduct.

## Klarifikasi Cost Penting

| Field | Lokasi | Arti | Dipakai untuk |
| --- | --- | --- | --- |
| costPrices | SubInventory | Harga per unit dari batch itu (misal Rp 2/gr) | Sumber kebenaran cost per batch |
| lastCostBa tch | Inventory (ringkasan) | costPrices dari batch aktif dengan inDate paling baru | Estimasi cepat di Menu (currentCostBatch), dihitung ulang tiap diakses |
| costPriceU sed | HistoryUsage (per baris) | costPrices dari batch yang benar-benar terpotong via FEFO | COGS aktual untuk laporan profit |

FEFO mengambil batch yang expired-nya paling cepat, belum tentu sama dengan batch paling baru (lastCostBatch). Karena itu estimasi margin di Menu (pakai lastCostBatch) dan cost aktual di laporan (pakai costPriceUsed) memang bisa berbeda - ini normal dan disengaja, bukan bug.

## Batch Safety Status (baru, v4)

FEFO selalu mengambil batch berdasarkan urutan expired paling cepat, tanpa exception dan tanpa exclude siapapun dari kandidat - ini murni prinsip dasar FEFO: pakai duluan yang mau busuk duluan, supaya waste diminimalkan. Yang berubah di v4 adalah bagaimana sistem memberi tahu admin tentang risiko batch yang terambil:

| Statu s | Kondisi |
| --- | --- |
| safe | expired === null(kategori packaging) atau expired >= availableUntil (batch masih segar sampai plan selesai) |

```
unsa expired < availableUntildan expired >= now() - batch ini akan
fe busuk di tengah durasi plan, sebelum plan selesai
```

Batch unsafe tetap ikut dihitung dalam sufficient/availableQuantity - tidak dikeluarkan dari perhitungan seperti desain v3. Tujuannya supaya pemilik tahu persis batch mana saja (dan berapa banyak) yang berisiko terbuang percuma kalau plan ini berjalan, sehingga bisa diambil tindakan proaktif (mis. dijadikan target diskon lewat modul Production Plan, lihat dokumentasi modul tsb) - bukan justru disembunyikan dari simulasi.

Catatan implementasi: bukan validasi keras di backend, tapi form input costPrices harus jelas berlabel “Harga per satuan unit”, bukan “Total harga beli”, untuk mencegah human error.

## 3. Format Error Response (konsisten di semua endpoint)

```
{
    "success": false,
    "message": "Validation error: expired wajib diisi untuk kategori ingredients",
    "errors": [
        { "field": "expired", "message": "expired wajib diisi untuk kategori ingredients" }
    ]
}
```

## 4. Daftar Endpoint (Final v4)

| # | Method | Path | Fungsi |
| --- | --- | --- | --- |
| 1 | POST | /api/inventory | Buat inventory baru |
| 2 | GET | /api/inventory | List semua inventory (paginated, halaman manajemen) |
| 3 | GET | /api/inventory/dropdown | List ringkas inventory aktif (dropdown create Menu/Plan) |
| 4 | GET | /api/inventory/:id | Detail inventory + list subinventory |
| 5 | PUT | /api/inventory/:id | Edit nama/deskripsi inventory |
| 6 | DELET E | /api/inventory/:id | Arsipkan (soft-delete) inventory |

| 7 | POST | /api/inventory/:id/subinv entory | Tambah batch baru |
| --- | --- | --- | --- |
| 8 | GET | /api/inventory/:id/subinv entory | List batch |
| 9 | DELET E | /api/subinventory/:id | Arsipkan (soft-delete) 1 batch |
| 1 0 | GET | /api/history-sub-inventor y | Log semua transaksi pembelian |
| 11 | POST | /api/subinventory/check-a vailability | [Berubah v4] Cek stok cukup tanpa mutasi (dry-run), dengan batchSafetyStatus per batch |
| 1 2 | POST | /api/subinventory/deduct | [Berubah v4] Potong stok FEFO, dengan batchSafetyStatus per deduction |
| 1 3 | POST | /api/subinventory/deduct/ reverse | Batalkan pemotongan stok |
| 1 4 | GET | /api/history-usage | Log semua transaksi pemakaian |

## 5. Detail Endpoint

1. POST /api/inventory - Buat inventory baru
(Tidak berubah dari v3)
Payload
{
“nameInventory”: “Tepung Terigu Segitiga Biru”,
“category”: “ingredients”,
“unit”: “gr”,
“description”: “Tepung protein sedang untuk adonan roti”
}

Response 201
{
“success”: true,

```
    "message": "Inventory berhasil dibuat",
    "data": {
        "_id": "66c1a2b3d4e5f6a7b8c9d0e1",
        "nameInventory": "Tepung Terigu Segitiga Biru",
        "category": "ingredients",
        "unit": "gr",
        "description": "Tepung protein sedang untuk adonan roti",
        "status": "active",
        "quantityTotal": null,
        "lastCostBatch": null,
        "totalSubInventory": 0,
        "createdAt": "2026-07-29T03:00:00.000Z",
        "updatedAt": "2026-07-29T03:00:00.000Z"
    }
}
```

Response 409 (nama duplikat dalam kategori sama, dan masih active)

```
{
    "success": false,
    "message": "Nama inventory sudah terdaftar pada kategori ini",
    "errors": { "field": "nameInventory", "message": "Duplikat nama dalam kategori yang sama"
}]
}
```

Flow

1. Terima payload: nameInventory, category, unit, description.
2. Validasi field wajib dan tipenya (category $\in$ ingredients/packaging, unit $\in$ gr/ml/pcs). Gagal → 400.
3. Cek duplikat nameInventory (case-insensitive) pada category yang sama dan status: “active”. Nama yang sudah diarsipkan boleh dipakai ulang.
4. Simpan dokumen baru dengan status: “active”, quantityTotal: null, lastCostBatch: null, totalSubInventory: 0.
5. Tangani race condition unique index (error E11000) dengan mengembalikan 409 juga.
6. Kembalikan 201.

## 2. GET /api/inventory - List semua inventory

(Tidak berubah dari v3)

Query params:

```
?category=ingredients&search=tepung&page=1&limit=10&includeDeleted=f
alse
```

Response 200

```
{
    "success": true,
    "data": [
        {
            "_id": "66c1a2b3d4e5f6a7b8c9d0e1",
            "nameInventory": "Tepung Terigu Segitiga Biru",
            "category": "ingredients",
            "unit": "gr",
            "description": "Tepung protein sedang untuk adonan roti",
            "status": "active",
            "quantityTotal": 15000,
            "lastCostBatch": 12000,
            "totalSubInventory": 2
        }
    ],
    "pagination": { "totalData": 42, "totalPage": 5, "currentPage": 1, "limit": 10 }
}
```

Flow

1. Terima query opsional: category, search, page, limit, includeDeleted=true (khusus admin/audit, default false).
2. Batasi limit maksimum (misal 100).
3. Escape karakter regex khusus pada search.
4. Filter default status: “active” kecuali includeDeleted=true diminta eksplisit.
5. Ambil field yang sudah tersimpan - tidak dihitung ulang di endpoint ini.
6. Hitung total data & total halaman.
7. Kembalikan 200.

## 3. GET /api/inventory/dropdown - List ringkas untuk dropdown

(Tidak berubah dari v3)
Query params (opsional): ?category=ingredients&search=tepung
Response 200

```
{
```

```
    "success": true,
    "data": [
        { "_id": "66c1a2b3d4e5f6a7b8c9d0e1", "nameInventory": "Tepung Terigu Segitiga Biru",
"category": "ingredients", "unit": "gr" },
        { "_id": "66c1a2b3d4e5f6a7b8c9d0e2", "namelnventory": "Kardus Box Kecil", "category":
"packaging", "unit": "pcs" }
    ]
}
```

Flow

1. Terima query opsional category, search.
2. Filter hanya status: “active”.
3. Ambil field minimal: _id, nameInventory, category, unit.
4. Tanpa pagination - kembalikan seluruh hasil yang match filter.
5. Kembalikan 200.

## 4. GET /api/inventory/:id - Detail inventory

(Tidak berubah dari v3)
Response 200

```
{
    "success": true,
    "data": {
        "_id": "66c1a2b3d4e5f6a7b8c9d0e1",
        "nameInventory": "Tepung Terigu Segitiga Biru",
        "category": "ingredients",
        "unit": "gr",
        "description": "Tepung protein sedang untuk adonan roti",
        "status": "active",
        "quantityTotal": 15000,
        "lastCostBatch": 12000,
        "totalSubInventory": 2,
        "subInventories": [
            { "_id": "sub_001", "initialQuantity": 5000, "quantity": 5000, "costPrices": 10000, "inDate":
"2026-07-01T00:00:00.000Z", "expired": "2026-08-10T00:00:00.000Z", "status": "active" },
            { "_id": "sub_002", "initialQuantity": 10000, "quantity": 10000, "costPrices": 12000,
"inDate": "2026-07-15T00:00:00.000Z", "expired": "2026-08-20T00:00:00.000Z", "status":
"active" }
        ],
        "createdAt": "2026-07-01T00:00:00.000Z",
        "updatedAt": "2026-07-15T00:00:00.000Z"
    }
```

```
}
```

Response 404

```
{ "success": false, "message": "Inventory tidak ditemukan" }
```

Flow

1. Cari inventory berdasarkan id. Tidak ada / deleted → 404.
2. Lazy expired check: update semua subinventory active milik inventory ini dengan expired < now() jadi expired.
3. Ambil hanya subinventory active, urutkan expired ASC lalu inDate ASC.
4. Kategori packaging tetap kirim expired: null.
5. Gabungkan data inventory + list subinventory.
6. Kembalikan 200.

## 5. PUT /api/inventory/:id - Edit inventory

(Tidak berubah dari v3)
Payload
{ “nameInventory”: “Tepung Terigu Cakra Kembar”, “description”: “Update: ganti supplier tepung” }

Response 200

```
{
    "success": true,
    "message": "Inventory berhasil diperbarui",
    "data": {
        "_id": "66c1a2b3d4e5f6a7b8c9d0e1",
        "nameInventory": "Tepung Terigu Cakra Kembar",
        "category": "ingredients",
        "unit": "gr",
        "description": "Update: ganti supplier tepung",
        "updatedAt": "2026-07-29T04:00:00.000Z"
    }
}
```

Response 400 (field terkunci disertakan)

```
{
```

“success”: false,
“message”: “Field category/unit tidak dapat diubah”,
“errors”: { “field”: “category”, “message”: “Field ini terkunci setelah inventory dibuat” }]
}

Flow

1. Cari inventory status: “active”. Tidak ditemukan → 404.
2. Cek payload: kalau mengandung category/unit → 400.
3. Kalau nameInventory berubah, ulangi pengecekan duplikat.
4. Update field yang diizinkan.
5. Kembalikan 200.

## 6. DELETE /api/inventory/:id - Arsipkan (soft-delete) inventory

```
(Tidak berubah dari v3)
```

Response 200

```
{
    "success": true,
    "message": "Inventory berhasil diarsipkan",
    "data": { "_id": "66c1a2b3d4e5f6a7b8c9d0e1", "status": "deleted", "deletedAt":
"2026-07-30T02:00:00.000Z" }
}
```

Response 409 (masih ada subinventory aktif dengan stok)

```
{
    "success": false,
    "message": "Inventory masih memiliki batch aktif dengan stok tersisa, kosongkan atau
hapus batch terlebih dahulu",
    "errors": { "field": "id", "message": "Ditemukan SubInventory dengan status active dan
quantity > 0" }]
}
```

Flow

1. Cari inventory berdasarkan id. Tidak ditemukan / sudah deleted → 404.
2. Cek apakah masih ada SubInventory active dengan quantity > 0. Ada → 409.
3. Update status: “deleted”, deletedAt, opsional deletedBy.
4. HistorySubInventory/HistoryUsage tidak disentuh.
5. Kembalikan 200.

@ Efek samping baru (lihat dokumentasi modul Production Plan): kalau ada draft Plan yang checkResult-nya masih mengacu ke inventoryId ini, arsip inventory ini men-trigger checkResultStale: true dengan staleReason: “inventory_archived” pada draft tsb. Ini dijelaskan detail di modul Production Plan, bukan di modul ini.

## 7. POST /api/inventory/:id/subinventory - Tambah batch baru

```
(Tidak berubah dari v3)
Payload
{
    "quantity": 5000,
    "costPrices": 10000,
    "inDate": "2026-07-29T00:00:00.000Z",
    "expired": "2026-09-15T00:00:00.000Z",
    "nameResponsible": "Pencit"
}
```

Response 201

```
{
    "success": true,
    "message": "Subinventory berhasil ditambahkan",
    "data": {
        "_id": "sub_003",
        "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
        "initialQuantity": 5000,
        "quantity": 5000,
        "costPrices": 10000,
        "inDate": "2026-07-29T00:00:00.000Z",
        "expired": "2026-09-15T00:00:00.000Z",
        "status": "active",
        "createdAt": "2026-07-29T04:10:00.000Z"
    },
    "updatedInventorySummary": { "quantityTotal": 20000, "lastCostBatch": 10000,
"totalSubInventory": 3 }
}
```

Response 400 (validasi expired/inDate)

```
{
    "success": false,
```

“message”: “Validation error: expired wajib diisi untuk kategori ingredients”, “errors”: { “field”: “expired”, “message”: “expired wajib diisi untuk kategori ingredients” }] }

Flow

1. Cari inventory status: “active”. Tidak ditemukan / diarsipkan → 404.
2. Validasi quantity dan costPrices > 0.
3. packaging → paksa expired: null. ingredients → expired wajib, kosong $\rightarrow 400$.
4. Kalau expired diisi, inDate tidak boleh lebih besar dari expired → 400.
5. Simpan SubInventory baru: initialQuantity = quantity, status: “active”.
6. Simpan HistorySubInventory.
7. Hitung ulang quantityTotal, lastCostBatch, totalSubInventory.
8. Langkah 5-7 dalam satu transaction.
9. Kembalikan 201.

## 8. GET /api/inventory/:id/subinventory - List batch

(Tidak berubah dari v3)
Query params: ?status=active (default active; bisa depleted, expired, deleted, atau all)

Response 200

```
{
    "success": true,
    "data": [
        { "_id": "sub_001", "initialQuantity": 5000, "quantity": 3000, "costPrices": 10000, "inDate":
"2026-07-01T00:00:00.000Z", "expired": "2026-08-10T00:00:00.000Z", "status": "active" }
    ]
}
```

Flow

1. Cari inventory (boleh deleted juga). Tidak ditemukan sama sekali → 404.
2. Jalankan lazy expired check.
3. Filter berdasarkan status query param, default active.
4. Urutkan expired ASC, inDate ASC.
5. Kembalikan 200.

## 9. DELETE /api/subinventory/:id - Arsipkan (soft-delete) 1 batch

```
(Tidak berubah dari v3)
```

Payload (opsional)

```
{ "deletedBy": "Pencit", "reason": "Batch rusak sebelum masuk produksi" }
```

Response 200

```
{
    "success": true,
    "message": "Subinventory berhasil diarsipkan",
    "data": {
        "_id": "sub_001",
        "status": "deleted",
        "deletedAt": "2026-07-30T02:10:00.000Z",
        "deletedBy": "Pencit",
        "reason": "Batch rusak sebelum masuk produksi"
    },
    "updatedInventorySummary": { "quantityTotal": 10000, "lastCostBatch": 12000,
"totalSubInventory": 1 }
}
```

Flow

1. Cari subinventory status: “active”. Selain itu → 409/404.
2. Update status: “deleted”, deletedAt, deletedBy, reason.
3. Hitung ulang quantityTotal, lastCostBatch, totalSubInventory pada Inventory induk.
    1. Kembalikan 200.

Efek samping baru (lihat dokumentasi modul Production Plan): kalau batch ini muncul di eligibleBatches/checkResult terakhir milik draft Plan manapun, penghapusan batch ini men-trigger checkResultStale: true dengan staleReason: “batch_removed” pada draft tsb.

## 10. GET /api/history-sub-inventory - Log pembelian

(Tidak berubah dari v3)

Query params:

```
?inventoryId=&nameResponsible=&startDate=&endDate=&page=&limit=
```

Response 200

```
{
    "success": true,
    "data": [
        {
            "_id": "hist_001",
            "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
            "nameInventory": "Tepung Terigu Segitiga Biru",
            "nameResponsible": "Pencit",
            "costPrices": 10000,
            "quantity": 5000,
            "inDate": "2026-07-01T00:00:00.000Z"
        }
    ],
    "pagination": { "totalData": 20, "totalPage": 2, "currentPage": 1, "limit": 10 }
}
```

Flow

1. Terima query opsional: inventoryId, nameResponsible, startDate, endDate, page, limit.
2. Terapkan filter.
3. Urutkan inDate menurun.
4. Kembalikan 200.

## 11. POST /api/subinventory/check-availability - Cek ketersediaan stok (dry-run, tanpa mutasi) [BERUBAH v4]

Dipanggil oleh Production Plan saat Draft (simulasi, sebelum approve) untuk memastikan kebutuhan bahan bisa dipenuhi, dan sekaligus menandai batch mana saja yang berisiko expired di tengah durasi plan - bukan mengecualikannya. Endpoint ini tidak mengubah data apapun.

Payload

```
{
    "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
    "quantityNeeded": 8000,
    "availableUntil": "2026-08-27T00:00:00.000Z"
}
```

Response 200 - cukup, seluruh batch yang terambil aman

```
{
    "success": true,
    "data": {
        "sufficient": true,
        "availableQuantity": 12000,
        "quantityNeeded": 8000,
        "hasUnsafeBatch": false,
        "eligibleBatches": [
            { "subInventoryId": "sub_002", "quantityTaken": 8000, "expired":
"2026-09-15T00:00:00.000Z", "batchSafetyStatus": "safe" }
        ]
    }
}
```

Response 200 - cukup, tapi mengandung batch yang akan expired di tengah plan

```
{
    "success": true,
    "data": {
        "sufficient": true,
        "availableQuantity": 15000,
        "quantityNeeded": 8000,
        "hasUnsafeBatch": true,
        "eligibleBatches": [
            { "subInventoryId": "sub_001", "quantityTaken": 3000, "expired":
"2026-08-10T00:00:00.000Z", "batchSafetyStatus": "unsafe" },
            { "subInventoryld": "sub_002", "quantityTaken": 5000, "expired":
"2026-08-20T00:00:00.000Z", "batchSafetyStatus": "safe" }
        ]
    }
}
```

Response 200 - tidak cukup

```
{
    "success": true,
    "data": {
        "sufficient": false,
        "availableQuantity": 5000,
        "quantityNeeded": 8000,
        "shortfall": 3000,
        "hasUnsafeBatch": true,
    "eligibleBatches": [
```

```
        { "subInventoryId": "sub_001", "quantityTaken": 5000, "expired":
"2026-08-10T00:00:00.000Z", "batchSafetyStatus": "unsafe" }
    ]
    }
}
```

Flow

1. Terima inventoryId, quantityNeeded, availableUntil (tanggal akhir plan yang disimulasikan).
2. Jalankan lazy expired-check terlebih dahulu.
3. Ambil semua SubInventory status: “active” milik inventoryId. Tidak ada filter exclude di sini - semua batch active jadi kandidat, tanpa terkecuali.
4. Urutkan seluruh kandidat: expired ASC (batch null/packaging diletakkan paling akhir urutan, karena tidak mendesak dari sisi FEFO), inDate ASC sebagai tiebreaker.
5. availableQuantity = total quantity dari seluruh batch active (bukan hasil filter apapun).
6. Iterasi batch sesuai urutan FEFO, akumulasi quantityTaken sampai memenuhi quantityNeeded atau batch habis (batch terakhir yang dipakai boleh diambil sebagian, sisanya tidak masuk eligibleBatches).
7. Untuk tiap batch yang masuk eligibleBatches, tentukan batchSafetyStatus: safe kalau expired === null atau expired >= availableUntil; unsafe kalau expired < availableUntil.
8. hasUnsafeBatch = true kalau minimal satu batch di eligibleBatches berstatus unsafe.
9. sufficient = availableQuantity >= quantityNeeded. Kalau false, sertakan shortfall.
10. Selalu kembalikan 200 (bukan 409) - sufficient: false adalah hasil valid, bukan error.
11. Endpoint ini wajib berbagi satu fungsi query yang sama dengan endpoint 12 (deduct) untuk urutan FEFO dan logic batchSafetyStatus, supaya hasil simulasi (draft) dan hasil deduct sungguhan (approve) selalu konsisten.

## 12. POST /api/subinventory/deduct - Potong stok FEFO [BERUBAH v4]

Dipanggil oleh modul Plan/Menu saat resep disetujui dan butuh mengambil stok bahan. Tidak lagi menolak berdasarkan expired batch - semua batch active tetap jadi kandidat FEFO, ditandai batchSafetyStatus per hasil potongan.

Payload

```
{
    "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
    "quantityNeeded": 8000,
    "planld": "plan_00123",
    "availableUntil": "2026-08-27T00:00:00.000Z"
}
```

availableUntil opsional - jika tidak dikirim, semua batch aktif jadi kandidat FEFO tanpa evaluasi batchSafetyStatus (field ini akan null di seluruh deductions). Wajib dikirim oleh modul Production Plan saat approve.

Response 200

```
{
    "success": true,
    "message": "Stok berhasil dipotong (FEFO)",
    "data": {
        "hasUnsafeBatch": true,
        "deductions": [
            { "subInventoryId": "sub_001", "quantityUsed": 3000, "costPriceUsed": 10000,
"remainingQuantity": 0, "batchSafetyStatus": "unsafe" },
            { "subInventoryld": "sub_002", "quantityUsed": 5000, "costPriceUsed": 12000,
"remainingQuantity": 5000, "batchSafetyStatus": "safe" }
        ]
    },
    "updatedInventorySummary": { "quantityTotal": 7000, "totalSubInventory": 1 }
}
```

Response 409 - stok tidak cukup

```
{
    "success": false,
    "message": "Stok tidak mencukupi untuk memenuhi kebutuhan plan",
    "errors": { "field": "quantityNeeded", "message": "Tersedia 5000, dibutuhkan 8000" }]
}
```

Catatan: varian pesan 409 v3 (“stok cukup total, tapi kurang setelah exclude batch mepet expired”) tidak lagi berlaku di v4- karena tidak ada lagi exclude, hanya ada satu jenis kekurangan stok yang mungkin terjadi.

Response 409 - double-deduct (tidak berubah)

```
{
    "success": false,
    "message": "Plan ini sudah pernah melakukan deduction, gunakan reverse dulu jika ingin
mengulang",
```

“errors”: [{ “field”: “planld”, “message”: “planld sudah memiliki HistoryUsage aktif” }] }

Flow

1. Terima payload: inventoryId, quantityNeeded, planId, availableUntil (opsional).
2. Cek inventory status: “active”. Diarsipkan → 409.
3. Cek HistoryUsage dengan planId yang sama dan belum direverse. Ada → 409.
4. Jalankan lazy expired-check untuk semua subinventory milik inventoryId.
5. Ambil subinventory status: “active”. Tidak ada filter berdasarkan availableUntil - semua jadi kandidat FEFO (beda dari v3 yang meng-exclude).
6. Urutkan expired ASC (null di akhir), inDate ASC.
7. Jumlahkan quantity seluruh kandidat. Kurang dari quantityNeeded → 409, berhenti di sini.
8. Mulai transaction. Iterasi batch dari yang expired paling cepat: ambil sebanyak mungkin dengan update atomik bersyarat quantity masih cukup di DB saat itu (mencegah race condition). Lanjut ke batch berikutnya sampai quantityNeeded terpenuhi.
9. Untuk tiap batch yang dipotong, kalau availableUntil dikirim, tentukan batchSafetyStatus (safe/unsafe) dengan logic sama seperti endpoint 11. Kalau availableUntil tidak dikirim, batchSafetyStatus: null.
10. Jika di tengah proses ternyata tidak mencukupi (stok berubah oleh request lain), batalkan transaction, kembalikan 409.
11. Untuk setiap batch yang berhasil dipotong, buat satu HistoryUsage (inventoryId, snapshot nameInventory, subInventoryId, quantityUsed, costPriceUsed, planId, usedDate, batchSafetyStatus).
12. Update status subinventory jadi depleted jika quantity menyentuh 0.
13. Hitung ulang quantityTotal, totalSubInventory pada Inventory induk.
14. hasUnsafeBatch di level response = true kalau minimal satu deductions berstatus unsafe.
15. Commit transaction. Kembalikan 200.

@ Konsumsi oleh modul lain: hasUnsafeBatch dan batchSafetyStatus per batch di sini adalah sumber data mentah bagi modul Production Plan untuk menampilkan peringatan ke admin saat draft (endpoint 11) dan mengisi committedIngredients dengan info yang sama saat approve (endpoint 12) - lihat dokumentasi modul Production Plan untuk bagaimana field ini ditampilkan/dipakai di level Plan.

## 13. POST /api/subinventory/deduct/reverse - Batalkan pemotongan stok

(Tidak berubah dari v3)
Payload

```
{ "planld": "plan_00123", "reason": "Plan dibatalkan oleh user" }
```

Response 200

```
{
    "success": true,
    "message": "Deduction untuk plan_00123 berhasil dibatalkan",
    "data": { "reversedCount": 2 },
    "updatedInventorySummary": { "quantityTotal": 15000, "totalSubInventory": 2 }
}
```

Response 409 (tidak ada yang bisa direverse)

```
{
    "success": false,
    "message": "Tidak ada deduction aktif untuk planld ini",
    "errors": { "field": "planId", "message": "Tidak ditemukan HistoryUsage dengan isReversed:
false untuk planld ini" }]
}
```

Flow

1. Terima planId, opsional reason.
2. Cari seluruh HistoryUsage dengan planId tsb yang isReversed: false. Tidak ada → 409.
3. Mulai transaction. Kembalikan quantity di SubInventory terkait sebesar quantityUsed.
4. Restore status jadi active hanya jika sebelumnya depleted karena deduction ini. Kalau sudah keburu expired, tetap expired.
5. Tandai HistoryUsage yang diproses jadi isReversed: true, reversedAt.
6. Hitung ulang quantityTotal, totalSubInventory.
7. Commit transaction. Kembalikan 200.

## 14. GET /api/history-usage - Log pemakaian

(Tidak berubah struktural dari v3, tambahan field batchSafetyStatus mengikuti perubahan endpoint 12)

Query params: ?inventoryId=&planId=&startDate=&endDate=&page=&limit=

Response 200

```
{
    "success": true,
    "data": [
        {
            "_id": "usage_001",
            "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
            "nameInventory": "Tepung Terigu Segitiga Biru",
            "subInventoryld": "sub_001",
            "quantityUsed": 3000,
            "costPriceUsed": 10000,
            "planld": "plan_00123",
            "usedDate": "2026-07-29T05:00:00.000Z",
            "batchSafetyStatus": "unsafe",
            "isReversed": false,
            "reversedAt": null
        }
    ],
    "pagination": { "totalData": 5, "totalPage": 1, "currentPage": 1, "limit": 10 }
}
```

Flow

1. Terima query opsional: inventoryId, planId, startDate, endDate, page, limit.
2. Terapkan filter.
3. Sertakan isReversed dan batchSafetyStatus (kalau ada) pada tiap record.
4. Kembalikan 200.

## 6. Catatan untuk Tim (final, akumulasi v1 → v4)

- Endpoint 6, 7, 9, 12, dan 13 wajib dibungkus transaction.
- Perhitungan quantityTotal, lastCostBatch, totalSubInventory harus satu fungsi bersama (dipanggil dari endpoint 7, 9, 12, 13), selalu mengecualikan subinventory dengan status selain active.
- Tidak ada hard-delete di seluruh modul ini.
- Lazy expired-check dijalankan di titik-titik akses data - bukan cron terjadwal.
- Dropdown (endpoint 3) sengaja dipisah dari list utama (endpoint 2).
- [v4] Endpoint 11 (check-availability) dan endpoint 12 (deduct) wajib berbagi satu fungsi query FEFO + evaluasi batchSafetyStatus yang sama persis - bukan cuma “filter batch eligible” seperti versi v3, tapi juga urutan pengambilan dan logic aman/tidak-aman. Kalau logic-nya berbeda antar dua endpoint ini, bisa

menyebabkan kasus “pas simulasi bilang batch A aman, pas approve ternyata ditandai tidak aman” - harus dihindari sama seperti prinsip konsistensi v3.
- [v4] Perubahan filosofis penting: modul Inventory tidak pernah menolak deduct hanya karena ada batch yang akan expired di tengah plan (selama total stoknya cukup). Penolakan hanya terjadi kalau stok benar-benar tidak cukup secara kuantitas. Keputusan “apakah plan ini layak dijalankan walau mengandung batch unsafe” adalah keputusan bisnis yang diserahkan ke admin di modul Production Plan, bukan digate otomatis di modul Inventory.
- [v4] hasUnsafeBatch/batchSafetyStatus murni informasi status, tidak mengubah sufficient. Sebuah inventoryId bisa sufficient: true dan hasUnsafeBatch: true sekaligus - dua hal ini independen, sama seperti diskon yang independen dari readyToApprove di modul Production Plan.
- Aturan durasi Plan (min 7 hari, maks 30 hari) tetap divalidasi di modul Production Plan, bukan di sini.
- currentCostBatch di Menu tetap tidak disimpan - dihitung ulang tiap Menu diakses.
- Endpoint yang menghapus inventory (versi hard-delete v1) sudah sepenuhnya digantikan endpoint 6.
- [v4, catatan lanjutan untuk modul Production Plan] Efek samping checkResultStale akibat endpoint 6 (arsip inventory) dan endpoint 9 (hapus batch) dijelaskan detail di dokumentasi modul Production Plan, bukan di modul ini - modul Inventory hanya bertanggung jawab menyediakan data mentah (batchSafetyStatus, status batch), bukan mengelola state Plan.