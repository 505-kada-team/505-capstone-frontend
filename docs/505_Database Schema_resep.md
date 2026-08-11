# 505_Database Schema_resep

## 1. Konsep Dasar

Apa yang direferensikan Menu? Menu mereferensikan Inventory (master data bahan/kemasan), bukan SubInventory (batch). Ini karena:

- Inventory = “apa jenis bahannya” (definisi tetap: nama, kategori, unit).
- Sublnventory = “batch stok yang datang-pergi” (bisa habis, expired, atau kosong kapan saja).

Karena itu, status stok batch tidak pernah menghalangi pembuatan/penyimpanan Menu. Resep adalah definisi tetap (“Nasi Goreng butuh 200gr beras”), terlepas dari apakah stok berasnya sedang ada atau tidak - validasi ketersediaan stok baru dilakukan belakangan oleh modul Production Plan.

## Status Menu

Status Arti
activ Muncul di list dan bisa dipilih untuk Production Plan baru e
delet Diarsipkan (soft-delete). Tidak muncul di list/dropdown default, tapi tetap ada di ed database

## Live vs Snapshot - Penting

Field nameInventory, category, dan unit pada tiap ingredient tidak disimpan di dokumen Menu. Menu hanya menyimpan inventoryId + quantityNeeded; sisanya selalu diambil live dari dokumen Inventory setiap kali Menu diakses. Konsekuensinya:

- Kalau nama Inventory diubah, tampilan Menu otomatis ikut ter-update - tidak ada data basi.
- Kalau Inventory diarsipkan, Menu yang masih mereferensikannya tetap bisa ditampilkan, tapi ditandai di response supaya user tahu bahan itu sudah tidak aktif.
- unit tidak pernah perlu disimpan terpisah karena unit di Inventory terkunci sejak dibuat.

## Estimasi Cost vs Harga Jual

Selisih harga (margin) dihitung setiap kali Menu diakses, bukan disimpan permanen:
currentCostEstimate $=\Sigma$ (quantityNeeded_i × lastCostBatch_i) untuk setiap ingredient i marginEstimate = sellingPrice - currentCostEstimate marginPercentage $=($ marginEstimate $/$ sellingPrice $) \times 100$
lastCostBatch di sini estimasi cepat dari batch teraktif termuda, bukan cost aktual pemakaian (costPriceUsed) yang baru diketahui saat Plan melakukan deduct FEFO. Margin di Menu selalu berstatus estimasi. Jika ada ingredient yang lastCostBatch-nya masih null, currentCostEstimate tidak bisa dihitung penuh - response menandai costComplete: false, bukan diam-diam dihitung sebagai 0.

## Pengarsipan Menu vs Referensi Aktif di Plan - Diputuskan (baru)

Pertanyaan terbuka di v1 sudah dijawab: arsip Menu tidak diblokir dengan syarat apapun, konsisten dengan filosofi soft-delete yang sudah dipakai di modul Inventory (arsip Inventory pun tidak menolak berdasarkan keberadaan referensi, hanya berdasarkan stok aktif yang tersisa). Untuk Menu, bahkan lebih longgar - tidak ada “stok” yang perlu dikosongkan dulu, karena Menu adalah definisi resep, bukan entitas stok.

Namun ada efek samping yang perlu diketahui, mengikuti pola yang sama seperti Inventory v4:

- Menu yang diarsipkan sambil masih dipakai Plan active/completed/stopped - aman sepenuhnya, karena Plan sudah membekukan committedIngredients dan frozenSellingPrice sejak approve. Tidak ada efek apapun ke Plan yang sudah berjalan.
- Menu yang diarsipkan sambil masih dipakai draft Plan yang belum di-approve - draft tsb perlu ditandai checkResultStale: true dengan staleReason: “menu_archived” (trigger baru, lihat dokumentasi modul Production Plan), karena kalau tidak ditandai, admin bisa mencoba approve draft yang sebagian resepnya sudah tidak aktif tanpa disadari.

Editing (PUT /api/menu/:id) yang mengubah ingredients[] atau sellingPrice juga punya efek samping serupa - lihat detail di endpoint 4 di bawah.

## 2. Format Error Response

{
“success”: false, “message”: “Validation error: inventoryld tidak ditemukan atau sudah diarsipkan”, “errors”: { “field”: “ingredients[1].inventoryld”, “message”: “Inventory tidak ditemukan atau berstatus deleted” }]
}

## 3. Daftar Endpoint

# Method Path
Fungsi

| 1 | POST | /api/menu | Buat menu baru |
| --- | --- | --- | --- |
| 2 | GET | /api/menu | List semua menu (paginated) |
| 3 | GET | /api/menu/:id | Detail menu + breakdown cost & margin |
| 4 | PUT | /api/menu/:id | [Berubah v2] Edit menu (info, ingredient, harga jual) - kini memicu efek samping ke draft Plan |
| 5 | DELET E | /api/menu/:id | [Diputuskan v2] Arsipkan (soft-delete) menu - tidak diblokir, tapi punya efek samping ke draft Plan |
| 6 | GET | /api/menu/dro pdown | [Baru v2] List ringkas menu aktif (dropdown create Production Plan) |

## 4. Skema Data Menu

| Field | Tipe | Keterangan |
| --- | --- | --- |
| _id | ObjectId |  |
| image | string (URL) | Path/URL gambar menu |
| name | string | Nama menu |
| description | string | Deskripsi menu |
| ingredients | array of object | Lihat sub-skema di bawah |
| sellingPrice | number | Harga jual per 1 porsi menu |
| status | string | active|deleted |
| createdAt / updatedAt | date |  |
| deletedAt | date | Terisi hanya jika status : deleted |

Sub-skema ingredients[] (disimpan minimal, sisanya live dari Inventory)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| inventoryId | ObjectId | Referensi ke Inventory (bukan SubInventory) |

```
quantityNee number Jumlah kuantitas dari inventory ini yang dibutuhkan untuk 1
ded porsi menu
```

Field yang dihitung/diambil live saat menu diakses (tidak tersimpan permanen): nameInventory, category, unit, inventoryStatus, currentCostPerUnit (= lastCostBatch Inventory), subtotalCost, currentCostEstimate, marginEstimate, marginPercentage, costComplete.

## 5. Detail Endpoint

## 1. POST /api/menu - Buat menu baru

```
(Tidak berubah dari v1)
Payload
{
    "name": "Nasi Goreng Spesial",
    "description": "Nasi goreng dengan telur dan ayam suwir",
    "image": "https://cdn.example.com/menu/nasi-goreng.jpg",
    "sellingPrice": 25000,
    "ingredients": [
        { "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1", "quantityNeeded": 200 },
        { "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e2", "quantityNeeded": 1 }
    ]
}
```

Response 201

```
{
    "success": true,
    "message": "Menu berhasil dibuat",
    "data": {
        "_id": "menu_001",
        "name": "Nasi Goreng Spesial",
        "description": "Nasi goreng dengan telur dan ayam suwir",
        "image": "https://cdn.example.com/menu/nasi-goreng.jpg",
        "sellingPrice": 25000,
        "status": "active",
        "ingredients": [
            {
                "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
                "nameInventory": "Beras Premium",
```

```
        "category": "ingredients",
        "unit": "gr",
        "quantityNeeded": 200,
        "currentCostPerUnit": 15,
        "subtotalCost": 3000
    },
    {
        "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e2",
        "nameInventory": "Kardus Box Kecil",
        "category": "packaging",
        "unit": "pcs",
        "quantityNeeded": 1,
        "currentCostPerUnit": 1500,
        "subtotalCost": 1500
    }
    ],
    "currentCostEstimate": 4500,
    "marginEstimate": 20500,
    "marginPercentage": 82,
    "costComplete": true,
    "createdAt": "2026-07-31T03:00:00.000Z",
    "updatedAt": "2026-07-31T03:00:00.000Z"
    }
}
```

Response 400 (inventory tidak ditemukan / sudah diarsipkan)

```
{
    "success": false,
    "message": "Validation error: ada ingredient yang inventoryld-nya tidak valid",
    "errors": { "field": "ingredients[1].inventoryld", "message": "Inventory tidak ditemukan atau
berstatus deleted" }]
}
```

Response 400 (duplikat ingredient dalam satu payload)

```
{
    "success": false,
    "message": "Validation error: terdapat inventoryld yang sama lebih dari satu kali",
    "errors": { "field": "ingredients", "message": "inventoryld '66c1a2b3d4e5f6a7b8c9d0e1'
muncul lebih dari sekali" }]
}
```

Flow

1. Terima payload: name, description, image, sellingPrice, ingredients.
2. Validasi field wajib: name tidak kosong, sellingPrice > 0,ingredients minimal 1 item.
3. Untuk setiap ingredient: validasi quantityNeeded > 0, cek inventoryId merujuk Inventory status: active. Tidak valid → 400.
4. Cek tidak ada inventoryId duplikat dalam satu payload. Duplikat → 400.
5. Simpan dokumen Menu baru status: “active”, ingredients hanya { inventoryId, quantityNeeded }.
6. Populate tiap ingredient dengan data live dari Inventory, hitung subtotalCost, currentCostEstimate, marginEstimate, marginPercentage, costComplete.
7. Kembalikan 201.

## 2. GET /api/menu - List semua menu

```
(Tidak berubah dari v1)
Query params: ?search=nasi&page=1&limit=10&includeDeleted=false
```

Response 200

```
{
    "success": true,
    "data": [
        {
            "_id": "menu_001",
            "image": "https://cdn.example.com/menu/nasi-goreng.jpg",
            "name": "Nasi Goreng Spesial",
            "sellingPrice": 25000,
            "status": "active",
            "totallngredients": 2,
            "currentCostEstimate": 4500,
            "marginEstimate": 20500,
            "marginPercentage": 82,
            "costComplete": true
        }
    ],
    "pagination": { "totalData": 12, "totalPage": 2, "currentPage": 1, "limit": 10 }
}
```

Flow

1. Terima query opsional: search, page, limit, includeDeleted=true(default false).
    1. Batasi limit maksimum. Escape karakter regex khusus pada search.
2. Filter default status: “active” kecuali includeDeleted=true.
3. Hitung ringkas

```
currentCostEstimate/marginEstimate/marginPercentage/costComplete
per menu.
```

1. Kembalikan 200 dengan pagination.

## 3.GET /api/menu/:id - Detail menu

```
(Tidak berubah dari v1)
```

Response 200

```
{
    "success": true,
    "data": {
        "_id": "menu_001",
        "image": "https://cdn.example.com/menu/nasi-goreng.jpg",
        "name": "Nasi Goreng Spesial",
        "description": "Nasi goreng dengan telur dan ayam suwir",
        "sellingPrice": 25000,
        "status": "active",
        "ingredients": [
            {
                "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1",
                "nameInventory": "Beras Premium",
                "category": "ingredients",
                "unit": "gr",
                "inventoryStatus": "active",
                "quantityNeeded": 200,
                "currentCostPerUnit": 15,
                "subtotalCost": 3000
            }
        ],
        "currentCostEstimate": 4500,
        "marginEstimate": 20500,
        "marginPercentage": 82,
        "costComplete": true,
        "createdAt": "2026-07-31T03:00:00.000Z",
        "updatedAt": "2026-07-31T03:00:00.000Z"
    }
}
```

Response 200 (contoh: ingredient sudah diarsipkan / cost belum lengkap)

```
{
```

```
"success": true,
"data": {
    "_id": "menu_002",
    "name": "Es Kopi Susu",
    "sellingPrice": 18000,
    "status": "active",
    "ingredients": [
        {
            "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e9",
            "nameInventory": "Bubuk Kopi Arabika",
            "category": "ingredients",
            "unit": "gr",
            "inventoryStatus": "deleted",
            "quantityNeeded": 15,
            "currentCostPerUnit": null,
            "subtotalCost": null
        }
    ],
    "currentCostEstimate": null,
    "marginEstimate": null,
    "marginPercentage": null,
    "costComplete": false,
    "warning": "Terdapat ingredient yang inventory-nya sudah diarsipkan atau belum pernah
punya batch, estimasi cost tidak dapat dihitung penuh"
    }
}
```

Response 404

```
{ "success": false, "message": "Menu tidak ditemukan" }
```

Flow

1. Cari menu berdasarkan id. Tidak ada / deleted → 404.
2. Populate live dari Inventory: nameInventory, category, unit, inventoryStatus, lastCostBatch (→ currentCostPerUnit).
3. Jika inventoryStatus: deleted atau lastCostBatch: null, subtotalCost ingredient tsb = null, tandai costComplete: false + warning.
4. Jika seluruh ingredient valid, hitung currentCostEstimate, marginEstimate, marginPercentage.
5. Kembalikan 200.

## 4. PUT /api/menu/:id - Edit menu [BERUBAH v2]

Payload (semua field opsional, kirim hanya yang ingin diubah)

```
{
    "name": "Nasi Goreng Spesial Jumbo",
    "sellingPrice": 28000,
    "ingredients": [
        { "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e1", "quantityNeeded": 250 },
        { "inventoryld": "66c1a2b3d4e5f6a7b8c9d0e2", "quantityNeeded": 1 }
    ]
}
```

Response 200

```
{
    "success": true,
    "message": "Menu berhasil diperbarui",
    "data": {
        "_id": "menu_001",
        "name": "Nasi Goreng Spesial Jumbo",
        "sellingPrice": 28000,
        "updatedAt": "2026-07-31T04:00:00.000Z"
    },
    "affectedDraftPlans": ["plan_002", "plan_005"]
}
```

affectedDraftPlans (baru) - daftar _id draft Plan yang baru saja ditandai
checkResultStale: true akibat edit ini, supaya frontend admin bisa langsung
menampilkan notifikasi “2 draft plan perlu direfresh” tanpa query terpisah. Array kosong
kalau tidak ada draft yang terdampak (mis. hanya name/description/image yang
diubah).

Response 400 (validasi ingredient, sama seperti create)

```
{
    "success": false,
    "message": "Validation error: ada ingredient yang inventoryld-nya tidak valid",
    "errors": { "field": "ingredients[1].inventoryld", "message": "Inventory tidak ditemukan atau
berstatus deleted" }]
}
```

Flow

```
1. Cari menu status: "active". Tidak ditemukan → 404.
```

1. Kalau payload mengirim ingredients, jalankan ulang seluruh validasi seperti create (inventoryId valid & active, quantityNeeded > 0, tidak duplikat). ingredients selalu dikirim sebagai array lengkap pengganti (replace), bukan partial-patch.
2. Update field yang dikirim.
3. Baru: kalau payload mengubah ingredients atau sellingPrice (dua field ini spesifik — bukan name/description/image), cari semua draft Plan (status : draft) yang menus[].menuId memuat menu ini. Tandai checkResultStale: true, staleReason: “recipe_changed” pada seluruh draft tsb (bulk update, field murah - lihat dokumentasi modul Production Plan). Kumpulkan _id draft yang terdampak ke affectedDraftPlans.
4. Kembalikan 200 dengan data terbaru + affectedDraftPlans.
@ Perubahan name/description/image tidak memicu efek samping ini - draft Plan tidak bergantung pada field tsb untuk perhitungan apapun.

## 5. DELETE /api/menu/:id - Arsipkan (soft-delete) menu [DIPUTUSKAN v2]

Response 200
{
“success”: true, “message”: “Menu berhasil diarsipkan”, “data”: { “_id”: “menu_001”, “status”: “deleted”, “deletedAt”: “2026-07-31T05:00:00.000Z” }, “affectedDraftPlans”: [“plan_003”] }
affectedDraftPlans - sama seperti endpoint 4, daftar draft Plan yang ditandai stale akibat arsip ini.

Flow

1. Cari menu berdasarkan id. Tidak ditemukan / sudah deleted → 404.
2. Update status: “deleted”, deletedAt, opsional deletedBy. Tidak ada penolakan apapun - arsip diizinkan tanpa syarat, konsisten dengan filosofi soft-delete Inventory. Tidak ada penghapusan data, dokumen menu tetap ada di database.
3. Baru: cari semua draft Plan yang menus .menuId memuat menu ini. Tandai checkResultStale: true, staleReason: “menu_archived” (trigger baru— lihat dokumentasi modul Production Plan untuk detail penanganannya di sisi Plan). Kumpulkan _id ke affectedDraftPlans.
4. Menu yang sudah diarsipkan tidak lagi muncul di list/dropdown default, tapi tetap valid untuk Plan active/completed/stopped yang sudah pernah menunjuk ke sana - karena Plan sudah membekukan committedIngredients dan frozenSellingPrice sejak approve, tidak ada dampak apapun ke Plan yang sudah berjalan.
5. Kembalikan 200.

## 6. GET /api/menu/dropdown - List ringkas untuk dropdown [BARU v2]

Dipanggil oleh modul Production Plan saat membuat draft (A1). Beda dari endpoint 2: tanpa pagination, field minimal, hanya menu active. Pola identik dengan GET

```
/api/inventory/dropdown.
Query params (opsional): ?search=nasi
```

Response 200

```
{
    "success": true,
    "data": [
        { "_id": "menu_001", "name": "Nasi Goreng Spesial", "sellingPrice": 25000, "image":
"https://cdn.example.com/menu/nasi-goreng.jpg" },
        { "_id": "menu_002", "name": "Es Teh Manis", "sellingPrice": 8000, "image":
"https://cdn.example.com/menu/es-teh.jpg" }
    ]
}
```

Flow

1. Terima query opsional search (search-as-you-type terhadap name).
2. Filter hanya status: “active” - tanpa exception, sama seperti dropdown Inventory.
3. Ambil field minimal: _id, name, sellingPrice, image. Sengaja tidak menyertakan ingredients/currentCostEstimate supaya query tetap ringan.
4. Tanpa pagination - kembalikan seluruh hasil yang match filter.
5. Kembalikan 200.

Catatan: kalau jumlah menu sudah sangat banyak dan dropdown mulai berat, pagination/infinite-scroll bisa ditambahkan belakangan sebagai enhancement, sama seperti catatan yang sudah ada di dropdown Inventory.

## 6. Catatan untuk Tim

- Cost adalah estimasi, bukan final. currentCostEstimate/marginEstimate dihitung dari lastCostBatch, cost aktual untuk laporan profit tetap dari costPriceUsed di HistoryUsage.
- Validasi ingredient hanya menyentuh Inventory, tidak pernah SubInventory - resep adalah definisi, bukan transaksi stok.
- unit tidak disimpan di Menu - selalu diambil live dari Inventory yang terkunci permanen.
- PUT ingredients bersifat replace, bukan patch.
- [v2] Pertanyaan terbuka soal arsip vs referensi Plan sudah diputuskan: tidak diblokir. Filosofinya konsisten dengan Inventory - soft-delete tidak pernah menolak berdasarkan keberadaan referensi (baik di modul Inventory maupun Menu), hanya berdasarkan kondisi yang benar-benar merusak data kalau dilanjutkan (di Inventory: stok aktif tersisa; di Menu: tidak ada kondisi serupa sama sekali, karena Menu murni definisi).
- [v2] Efek samping baru (PUT endpoint 4, DELETE endpoint 5) terhadap draft Plan - bulk-flag checkResultStale/staleReason (“recipe_changed” untuk edit ingredients/sellingPrice, “menu_archived” untuk arsip) dijelaskan detail penanganannya di dokumentasi modul Production Plan. Modul Menu hanya bertanggung jawab memicu flag ini dan melaporkan affectedDraftPlans di response - tidak mengelola state Plan lebih jauh dari itu.
- [v2] staleReason: “menu_archived” adalah trigger baru yang belum tercakup di revisi Production Plan sebelumnya (yang baru mencakup stock_taken/batch_removed/inventory_archived/recipe_changed). Perlu ditambahkan sebagai trigger ke-5 saat modul Production Plan direvisi berikutnya - termasuk keputusan apakah trigger ini juga memblokir approve seperti recipe_changed (disarankan ya, karena menu yang sudah diarsipkan seharusnya tidak boleh lolos jadi plan aktif - sama seriusnya dengan resep yang berubah) atau cukup soft-warning seperti 3 trigger lain.
- GET /api/menu/dropdown (endpoint 6) sekarang tersedia - modul Production Plan bisa mulai memakainya untuk UI pemilihan menu saat membuat draft (A1), menggantikan asumsi sebelumnya yang belum eksplisit menyebutkan sumber datanya.