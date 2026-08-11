## **1\. Konsep Dasar**

Modul Selling murni untuk kasir. Modul ini hanya membaca Plan (untuk validasi status, tanggal, dan **harga yang sedang berlaku**) dan hanya menulis PlanSale — tidak pernah memanggil Inventory atau mengubah ProductionPlan.status. Bahan baku sudah dipotong (deduct) sekaligus di muka saat Plan disetujui (lihat dokumentasi modul Production Plan); kasir hanya menjual dari "stok porsi jadi" yang sudah dialokasikan.

**Harga yang Dipakai (baru)** Setiap menu di Plan bisa punya slot `discount` (lihat modul Production Plan). Saat sale dicatat, sistem **tidak pernah** menerima `priceUsed` dari kasir — harga selalu dihitung server-side, live, di detik transaksi terjadi:

* now() berada di antara discount.startDate–discount.endDate (kalau discount ada)?  
*   → priceUsed \= discountedPrice  
* tidak ada discount, atau now() di luar rentangnya?  
*   → priceUsed \= sellingPrice (harga normal Menu)


Ini penting supaya kasir tidak bisa keliru pakai harga lama, dan supaya diskon yang baru dihapus admin (`DELETE /api/plan/:id/menus/:menuId/discount`) langsung berefek ke transaksi berikutnya tanpa delay. `priceUsed` tetap disimpan sebagai **snapshot** di `PlanSale` seperti sebelumnya — begitu tersimpan, tidak pernah berubah lagi walau `discount` di Plan diedit/dihapus belakangan. Ini juga berlaku untuk data historis: kalau `discount` di Plan sudah dihapus/diganti admin, transaksi lama di `PlanSale` tetap merekam harga yang benar-benar dipakai saat itu.

### **Gating Tanggal**

Plan boleh di-approve kapan saja sebelum startDate (mis. disiapkan H-2), tapi penjualan hanya bisa dicatat kalau tanggal sekarang berada di antara startDate dan endDate Plan. Kalau plan sudah active tapi startDate belum tiba, kasir tetap bisa melihat data plan (view only, remainingQuantity masih penuh), tapi mencatat sale ditolak dengan pesan "Plan belum dimulai".

### **Stok "Sisa" per Menu**

* remainingQuantity \= quantityPlanned − soldQuantity − approvedLossQuantity


soldQuantity bertambah tiap ada sale tercatat lewat modul ini. approvedLossQuantity bertambah hanya kalau laporan kerugian sudah di-ACC admin (lihat dokumentasi modul Plan Report) — modul Selling tidak pernah menulis field ini sendiri. Begitu remainingQuantity menyentuh 0 sebelum endDate, sistem mencatat soldOutAt pada menu terkait di ProductionPlan — ini bukan error, plan tetap active sampai endDate/stop, hanya saja menu tersebut sudah tidak bisa dijual lagi (sale berikutnya untuk menu itu akan 409 karena stok 0). soldOutAt adalah sinyal penting untuk modul Forecasting (indikasi quantityPlanned terlalu kecil dibanding permintaan riil).

Diskon **tidak mempengaruhi** `remainingQuantity` sama sekali — itu murni soal kuantitas porsi, bukan harga. Menu yang sedang didiskon tetap bisa habis (`soldOutAt` terisi) seperti biasa.

## **2\. Skema Data — PlanSale**

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| \_id | ObjectId |  |
| planId | ObjectId |  |
| menuId | ObjectId |  |
| quantitySold | number |  |
| priceUsed | number | Snapshot harga per porsi yang **benar-benar dipakai** saat transaksi — sudah termasuk diskon kalau berlaku saat itu |
| originalPrice | number | **Baru.** Snapshot `sellingPrice` Menu saat transaksi (harga normal, sebelum diskon), untuk keperluan hitung `discountAmount` di laporan tanpa perlu join balik ke Menu/Plan |
| discountApplied | boolean | **Baru.** true kalau `priceUsed` diskon, false kalau harga normal |
| discountPercentage | number | null | **Baru.** Snapshot persentase diskon saat transaksi, null kalau discountApplied: false |
| cashierName | string |  |
| soldAt | date |  |

`priceUsed = originalPrice × (1 - discountPercentage/100)` kalau `discountApplied: true`, else `priceUsed = originalPrice`. Menyimpan keduanya (bukan cuma `priceUsed`) supaya modul Forecasting bisa hitung `revenueActual` vs `revenueProjected` (baseline harga penuh) tanpa ambigu, dan supaya laporan bisa menjawab "berapa revenue yang dikorbankan demi diskon" secara langsung dari data transaksi.

## **3\. Format Error Response**

Konsisten dengan modul lain:

* {  
*   "success": false,  
*   "message": "Sisa porsi menu ini tidak mencukupi",  
*   "errors": \[  
*     { "field": "quantitySold", "message": "Sisa 1, diminta 2" }  
*   \]  
* }


  ## **4\. Daftar Endpoint**

| \# | Method | Path | Fungsi | Akses |
| ----- | ----- | ----- | ----- | ----- |
| B1 | GET | /api/selling/active | List plan aktif \+ sisa stok \+ harga berlaku per menu | Kasir |
| B2 | POST | /api/selling | Catat penjualan | Kasir |
| B3 | GET | /api/selling/history | Riwayat penjualan per plan/tanggal (rekonsiliasi shift) | Kasir & Admin |

  ## **5\. Detail Endpoint**

  ### **B1. GET /api/selling/active**

Response 200

* {  
*   "success": true,  
*   "data": \[  
*     {  
*       "planId": "plan\_001",  
*       "name": "Promo Nasi Goreng Agustus",  
*       "startDate": "2026-08-05T00:00:00.000Z",  
*       "endDate": "2026-08-19T00:00:00.000Z",  
*       "sellable": true,  
*       "menus": \[  
*         {  
*           "menuId": "menu\_001",  
*           "name": "Nasi Goreng Spesial",  
*           "sellingPrice": 25000,  
*           "currentPrice": 21250,  
*           "isDiscounted": true,  
*           "discountPercentage": 15,  
*           "discountEndsAt": "2026-08-19T00:00:00.000Z",  
*           "remainingQuantity": 47,  
*           "warning": null  
*         },  
*         {  
*           "menuId": "menu\_002",  
*           "name": "Es Teh Manis",  
*           "sellingPrice": 8000,  
*           "currentPrice": 8000,  
*           "isDiscounted": false,  
*           "discountPercentage": null,  
*           "discountEndsAt": null,  
*           "remainingQuantity": 30,  
*           "warning": null  
*         }  
*       \]  
*     }  
*   \]  
* }


Flow: cari Plan status: active. Hitung sellable \= now() berada di antara startDate dan endDate (kalau belum, tetap tampil tapi sellable: false supaya kasir tahu belum bisa jual). Hitung remainingQuantity tiap menu real-time. **Untuk tiap menu, evaluasi `discount` (kalau ada) terhadap `now()`**: kalau statusnya `active` → `isDiscounted: true`, `currentPrice: discountedPrice`, sertakan `discountEndsAt` supaya kasir tahu sampai kapan harga ini berlaku. Kalau `discount` null atau statusnya `upcoming`/`ended` → `isDiscounted: false`, `currentPrice: sellingPrice`. Sertakan warning per plan kalau hasPendingLossReplacement: true.

### **B2. POST /api/selling — Catat penjualan**

Payload

* { "planId": "plan\_001", "menuId": "menu\_001", "quantitySold": 2, "cashierName": "Sari" }


Kasir **tidak mengirim harga apapun** — payload sama sekali tidak berubah dari sebelumnya. Ini disengaja: harga bukan input, murni hasil komputasi server berdasarkan `now()`.

Response 200 (harga normal)

* {  
*   "success": true,  
*   "message": "Penjualan berhasil dicatat",  
*   "data": {  
*     "\_id": "sale\_045",  
*     "planId": "plan\_001",  
*     "menuId": "menu\_001",  
*     "quantitySold": 2,  
*     "originalPrice": 25000,  
*     "priceUsed": 25000,  
*     "discountApplied": false,  
*     "discountPercentage": null,  
*     "cashierName": "Sari",  
*     "soldAt": "2026-08-10T04:30:00.000Z",  
*     "remainingQuantity": 36  
*   }  
* }


Response 200 (harga diskon sedang berlaku)

* {  
*   "success": true,  
*   "message": "Penjualan berhasil dicatat (harga diskon)",  
*   "data": {  
*     "\_id": "sale\_046",  
*     "planId": "plan\_001",  
*     "menuId": "menu\_001",  
*     "quantitySold": 2,  
*     "originalPrice": 25000,  
*     "priceUsed": 21250,  
*     "discountApplied": true,  
*     "discountPercentage": 15,  
*     "cashierName": "Sari",  
*     "soldAt": "2026-08-13T04:30:00.000Z",  
*     "remainingQuantity": 34  
*   }  
* }


Response 400 (belum dalam rentang tanggal)

* { "success": false, "message": "Plan belum dimulai, penjualan baru bisa dicatat mulai 2026-08-05", "errors": \[{ "field": "startDate", "message": "Tanggal sekarang masih sebelum startDate plan" }\] }


Response 409 (stok porsi tidak cukup)

* { "success": false, "message": "Sisa porsi menu ini tidak mencukupi", "errors": \[{ "field": "quantitySold", "message": "Sisa 1, diminta 2" }\] }


Flow

1. Cari plan status: active.  
2. Cek now() dalam rentang startDate–endDate → di luar itu 400\.  
3. Hitung remainingQuantity real-time.  
4. Tidak cukup → 409, berhenti di sini.  
5. **Baru:** ambil `sellingPrice` live dari Menu sebagai `originalPrice`. Evaluasi `discount` menu terkait terhadap `now()` — kalau statusnya `active`, `priceUsed = originalPrice × (1 - discountPercentage/100)`, `discountApplied: true`, simpan `discountPercentage`. Kalau tidak, `priceUsed = originalPrice`, `discountApplied: false`, `discountPercentage: null`.  
6. Simpan PlanSale dengan field harga di atas, tambah soldQuantity menu terkait.  
7. Kalau hasil pengurangan bikin remainingQuantity baru \= 0 dan now() \< endDate, set menus.$.soldOutAt \= now() di ProductionPlan (sinyal stockout untuk forecasting).  
8. Kembalikan 200\.  
9. Endpoint ini wajib dibungkus transaction (baca-hitung-tulis remainingQuantity rawan race condition antar kasir; langkah baca-harga di poin 5 dimasukkan ke transaction yang sama supaya harga dan stok konsisten terhadap momen yang sama persis).

   ### **B3. GET /api/selling/history — Riwayat penjualan**

Query params: `?planId=plan_001&date=2026-08-10&cashierName=Sari`

Response 200

* {  
*   "success": true,  
*   "data": \[  
*     {  
*       "\_id": "sale\_045",  
*       "menuId": "menu\_001",  
*       "menuName": "Nasi Goreng Spesial",  
*       "quantitySold": 2,  
*       "originalPrice": 25000,  
*       "priceUsed": 25000,  
*       "discountApplied": false,  
*       "discountPercentage": null,  
*       "cashierName": "Sari",  
*       "soldAt": "2026-08-10T04:30:00.000Z"  
*     },  
*     {  
*       "\_id": "sale\_046",  
*       "menuId": "menu\_001",  
*       "menuName": "Nasi Goreng Spesial",  
*       "quantitySold": 2,  
*       "originalPrice": 25000,  
*       "priceUsed": 21250,  
*       "discountApplied": true,  
*       "discountPercentage": 15,  
*       "cashierName": "Sari",  
*       "soldAt": "2026-08-13T04:30:00.000Z"  
*     }  
*   \],  
*   "summary": {  
*     "totalTransaction": 14,  
*     "totalRevenue": 1150000,  
*     "totalDiscountGiven": 63750  
*   }  
* }


`totalDiscountGiven` (baru) \= `Σ (quantitySold × (originalPrice − priceUsed))` dari seluruh transaksi yang match filter — total nominal yang "dikorbankan" karena diskon dalam periode/plan tsb, berguna untuk rekonsiliasi kas (kasir/admin bisa lihat langsung dampak diskon hari itu) tanpa perlu tunggu laporan Forecasting.

Flow: terima query opsional planId, date (filter satu hari), cashierName. Kembalikan list PlanSale yang match beserta summary (total transaksi, revenue, dan total diskon yang diberikan) untuk rekonsiliasi kas harian.

## **6\. Catatan untuk Tim**

* Endpoint B2 wajib dibungkus transaction. Pembacaan `discount` menu dan perhitungan `priceUsed` **harus** berada di dalam transaction yang sama dengan baca-tulis `remainingQuantity`, supaya tidak ada celah race condition antara admin menghapus diskon dan kasir mencatat sale di detik yang nyaris bersamaan.  
* Modul ini hanya menulis PlanSale dan field turunan pada ProductionPlan.menus (soldQuantity, soldOutAt) — tidak pernah memanggil Inventory, tidak pernah mengubah ProductionPlan.status, dan **tidak pernah menulis ke `menus[].discount`** (itu domain modul Production Plan, murni dibaca di sini).  
* Lazy-check status completed pada Plan (kalau endDate sudah lewat) turut dijalankan di titik akses GET /api/selling/active, sama seperti pola di modul Production Plan.  
* `originalPrice` dan `discountPercentage` disimpan sebagai snapshot ganda (bukan cuma `priceUsed`) supaya `dailySales`/`revenueActual` vs `revenueProjected` di modul Forecasting bisa dihitung langsung dari `PlanSale` tanpa perlu merekonstruksi "apakah transaksi ini kena diskon" dari histori Plan yang mungkin sudah berubah.  
* Perlu dikonfirmasi: apakah kasir perlu melihat alasan diskon (`discount.reason` dari Plan, mis. "bahan mendekati expired") di B1, atau cukup `discountPercentage` \+ `discountEndsAt` saja untuk kebutuhan operasional kasir sehari-hari? Saat ini saya tidak menyertakan `reason` di B1 karena sifatnya lebih untuk konteks internal admin, tapi bisa ditambahkan kalau berguna untuk kasir menjelaskan ke pelanggan.  
  ---

Lanjut ke **Plan Report**.

## **Sebelum lanjut — 1 hal yang perlu diputuskan**

Di Plan Report, kasir bisa lapor kerugian **kategori `menu`** (porsi jadi rusak/hilang) dengan `quantityLost`. Sekarang ada pertanyaan: kalau porsi yang rusak itu adalah menu yang **sedang didiskon** saat kejadian, apakah laporan itu perlu ikut menyimpan harga (untuk valuasi kerugian dalam Rupiah), atau `quantityLost` (dalam satuan porsi) saja tetap cukup seperti desain sekarang? Saya ingin lebih banyak

