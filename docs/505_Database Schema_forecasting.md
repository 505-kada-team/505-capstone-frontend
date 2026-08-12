## **1\. Konsep Dasar**

Satu-satunya modul yang dikonsumsi tim data analis. Read-only, tidak ada aksi yang mengubah Plan/Inventory. Hanya mencakup plan yang sudah `completed`/`stopped` (punya `PlanFinalReport`)  plan `draft`/`active` bukan bagian dari data historis (lihat modul Production Plan untuk lifecycle status).

`PlanFinalReport` dibuat **sekali** oleh modul Production Plan saat transisi status ke `completed` (lazy-check) atau `stopped` (endpoint stop), lalu disimpan permanen  tidak pernah dihitung ulang setelahnya, konsisten dengan prinsip "laporan akhir dibekukan".

### **Data Tambahan untuk Forecasting**

Tiga field kunci yang membuat modul ini benar-benar berguna untuk data analis:

* **`soldOutAt` per menu** (di `ProductionPlan.menus` dan diwariskan ke `PlanFinalReport.menus` sebagai `stockOutBeforeEnd` \+ `soldOutAt`)  sinyal "kehabisan sebelum waktunya", indikasi kuat `quantityPlanned` terlalu kecil dibanding permintaan riil. Diisi otomatis oleh endpoint Selling saat `remainingQuantity` pertama kali menyentuh 0\.  
* **`dailySales`** (array `{ date, quantitySold }` per menu di `PlanFinalReport`)  pengganti `avgSalePerDay` yang terlalu ringkas. Model forecasting (moving average, regresi, atau time-series lain) butuh pola harian, bukan satu angka rata-rata  supaya bisa melihat tren naik/turun dan pola weekday vs weekend (dihitung analis dari `date`, tidak perlu disimpan terpisah).  
* **`tags`** (array string bebas di `ProductionPlan`, diwariskan ke `PlanFinalReport`)  label konteks seperti "promo", "weekend-only", "ramadan", "menu-baru". Tanpa ini, analis harus menebak konteks plan dari tanggal saja; dengan ini plan bisa disegmentasi eksplisit saat analisis (mis. "performa plan bertag promo vs non-promo").

Tidak semua hal perlu disimpan  hal yang bisa diturunkan dari data yang sudah ada (hari-dalam-minggu dari `date`, margin dari revenue/cost yang sudah ada) sengaja tidak disimpan ulang, supaya tidak ada dua sumber kebenaran yang bisa saling drift.

## **2\. Skema Data  PlanFinalReport**

Dibuat sekali & disimpan permanen.

| Field | Tipe | Keterangan |
| ----- | ----- | ----- |
| `_id` | ObjectId |  |
| `planId` | ObjectId |  |
| `tags` | array of string | Disalin dari `ProductionPlan.tags` saat generate, supaya dataset endpoint tidak perlu join balik ke Plan |
| `generatedAt` | date |  |
| `reason` | string | `completed` atau `stopped` |
| `effectiveDurationDays` | number | Jumlah hari plan benar-benar berjalan |
| `menus` | array | `{ menuId, name, quantityPlanned, soldQuantity, lossQuantity, unsoldQuantity, stockOutBeforeEnd, soldOutAt, revenueActual, revenueProjected, costActual, dailySales: [{ date, quantitySold }] }` |
| `totalRevenueActual`, `totalRevenueProjected` | number | Agregat lintas menu, level plan |
| `totalCostActual`, `totalReplacementCost` | number | Agregat lintas menu, level plan |
| `totalUnitsSold`, `totalUnitsLost` | number | Agregat lintas menu, level plan |

## Berikut tabel definisi field menus\[\] pada PlanFinalReport (modul Forecasting):

| Field | Tipe | Arti |
| :---- | :---- | :---- |
| menuId | ObjectId | Referensi ke Menu yang diproduksi dalam plan ini |
| name | string | Snapshot nama menu saat PlanFinalReport di-generate (bukan live dari Menu supaya tidak berubah walau nama menu diedit belakangan) |
| quantityPlanned | number | Jumlah porsi yang direncanakan diproduksi untuk menu ini |
| soldQuantity | number | Jumlah porsi yang benar-benar terjual (akumulasi dari PlanSale selama plan berjalan) |
| lossQuantity | number | Jumlah porsi yang dilaporkan rusak/hilang dan sudah di-ACC admin (approvedLossQuantity, kategori menu di PlanReport) |
| unsoldQuantity | number | Sisa porsi yang tidak terjual maupun terlaporkan rugi saat plan berakhir  quantityPlanned − soldQuantity − lossQuantity |
| stockOutBeforeEnd | boolean | true kalau porsi menu ini habis (remainingQuantity \= 0\) sebelum endDate tercapai  turunan dari soldOutAt yang tidak null |
| soldOutAt | date | null | Waktu persis remainingQuantity pertama kali menyentuh 0, diisi otomatis oleh modul Selling; null kalau tidak pernah habis sebelum plan selesai |
| revenueActual | number | Pendapatan riil dari menu ini  Σ (quantitySold × priceUsed) dari seluruh PlanSale terkait |
| revenueProjected | number | Proyeksi pendapatan seandainya seluruh quantityPlanned terjual  quantityPlanned × sellingPrice |
| costActual | number | Cost aktual bahan yang benar-benar terpakai untuk menu ini  diambil dari costPriceUsed di committedIngredients/HistoryUsage, bukan estimasi lastCostBatch |
| dailySales | array { date, quantitySold } | Time series penjualan harian menu ini, diagregasi (group-by-tanggal) dari PlanSale sekali saat PlanFinalReport digenerate  dasar untuk model forecasting (moving average, regresi, dsb) dan analisis pola weekday/weekend |

## Catatan: unsoldQuantity dan stockOutBeforeEnd sengaja tidak disimpan sebagai input mentah, melainkan turunan dari field lain  biar tidak ada dua sumber kebenaran yang bisa drift.

##  

## **3\. Format Error Response**

Konsisten dengan modul lain:

{  
  "success": false,  
  "message": "Laporan akhir belum tersedia  plan masih berjalan"  
}

## **4\. Daftar Endpoint**

| \# | Method | Path | Fungsi | Akses |
| ----- | ----- | ----- | ----- | ----- |
| D1 | GET | `/api/forecasting/plan/:id` | Laporan akhir satu plan | Admin & Data Analis |
| D2 | GET | `/api/forecasting/dataset` | Dataset gabungan lintas plan, siap dianalisis/dipakai model | Admin & Data Analis |

## **5\. Detail Endpoint**

### **D1. `GET /api/forecasting/plan/:id`  Laporan akhir satu plan**

**Response 200**

{  
  "success": true,  
  "data": {  
    "planId": "PLAN-2026-0815-0042",  
    "tags": \["payday", "weekend", "normal"\],  
    "reason": "Coffee shop weekend and weekday transition plan",  
    "generatedAt": "2026-07-31T23:59:59Z",  
    "effectiveDurationDays": 3,  
    "menus": \[  
      {  
        "menuId": "MENU-005",  
        "name": "Kopi Susu Gula Aren",  
        "quantityPlanned": 150,  
        "soldQuantity": 135,  
        "lossQuantity": 2,  
        "unsoldQuantity": 15,  
        "stockOutBeforeEnd": false,  
        "soldOutAt": null,  
        "revenueActual": 2970000,  
        "revenueProjected": 3300000,  
        "costActual": 831600,  
        "dailySales": \[  
          {  
            "date": "2026-08-01",  
            "quantitySold": 50,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 3 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 8 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 2 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 3 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 5 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 7 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 6 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 4 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 1 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 2 }  
            \]  
          },  
          {  
            "date": "2026-08-02",  
            "quantitySold": 55,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 2 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 6 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 5 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 4 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 3 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 4 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 7 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 9 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 8 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 4 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 1 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 2 }  
            \]  
          },  
          {  
            "date": "2026-08-03",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 5 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 9 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 2 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 2 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 1 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          }  
        \]  
      },  
      {  
        "menuId": "MENU-007",  
        "name": "Caffe Latte",  
        "quantityPlanned": 100,  
        "soldQuantity": 88,  
        "lossQuantity": 1,  
        "unsoldQuantity": 12,  
        "stockOutBeforeEnd": false,  
        "soldOutAt": null,  
        "revenueActual": 2640000,  
        "revenueProjected": 3000000,  
        "costActual": 792000,  
        "dailySales": \[  
          {  
            "date": "2026-08-01",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 4 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 8 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 2 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 1 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 1 }  
            \]  
          },  
          {  
            "date": "2026-08-02",  
            "quantitySold": 28,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 3 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 6 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 5 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 2 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 3 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 2 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          },  
          {  
            "date": "2026-08-03",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 6 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 10 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 7 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 2 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 1 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 1 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 0 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          }  
        \]  
      }  
    \],  
    "totalRevenueActual": 5610000,  
    "totalRevenueProjected": 6300000,  
    "totalCostActual": 1623600,  
    "totalReplacementCost": 90000,  
    "totalUnitsSold": 223,  
    "totalUnitsLost": 3  
  }  
}

**Response 404**

{ "success": false, "message": "Laporan akhir belum tersedia  plan masih berjalan" }

**Flow**: ambil `PlanFinalReport` yang sudah dibuat sekali saat transisi status (lihat modul Production Plan, endpoint stop & lazy-complete). Tidak dihitung ulang. `dailySales` diagregasi dari `PlanSale` (group by tanggal, lihat modul Selling) tepat sekali saat `PlanFinalReport` di-generate, ikut dibekukan permanen seperti field lain.

### **D2. `GET /api/forecasting/dataset`  Dataset gabungan**

Endpoint ini meratakan (flatten) beberapa `PlanFinalReport` jadi satu array baris per plan-menu, supaya tim data analis atau pipeline model tidak perlu join manual ke `ProductionPlan`/`PlanSale`/`PlanReport` satu-satu.

**Query params**: `?menuId=menu_001&tags=promo&startDate=2026-01-01&endDate=2026-12-31`

**Response 200**

{  
  "success": true,  
  "data": \[  
    {  
      "planId": "plan\_001",  
      "menuId": "menu\_001",  
      "menuName": "Nasi Goreng Spesial",  
      "tags": \["promo"\],  
      "planStartDate": "2026-08-05T00:00:00.000Z",  
      "planEndDate": "2026-08-19T00:00:00.000Z",  
      "effectiveDurationDays": 14,  
      "planStatus": "completed",  
      "quantityPlanned": 100,  
      "soldQuantity": 100,  
      "lossQuantity": 3,  
      "unsoldQuantity": 0,  
      "stockOutBeforeEnd": true,  
      "soldOutAt": "2026-08-16T14:00:00.000Z",  
      "revenueActual": 2500000,  
      "revenueProjected": 2500000,  
      "costActual": 396000,  
      "dailySales": \[{ "date": "2026-08-05", "quantitySold": 9 }\]  
    }  
  \]  
}

**Flow**: terima query opsional `menuId`, `tags`, `startDate`/`endDate` (filter terhadap `planStartDate`). Query seluruh `PlanFinalReport` yang match, lalu untuk tiap dokumen, pecah array `menus[]`\-nya jadi baris tersendiri (satu baris \= satu plan \+ satu menu) digabung dengan field level-plan (`tags`, `planStartDate`, dst). Tanpa pagination di v1  kalau volume plan sudah besar, pagination/limit-tanggal bisa ditambahkan sebagai enhancement (⚠️ bukan blocker, tapi perlu diperhatikan kalau riwayat plan sudah ratusan).

## **6\. Catatan untuk Tim**

* Modul ini read-only sepenuhnya  tidak ada endpoint yang menulis/mengubah data.  
* `dailySales` dihitung sekali saat `PlanFinalReport` di-generate (agregasi `PlanSale` group-by-tanggal), bukan dihitung ulang tiap `GET /api/forecasting/*` diakses.  
* `GET /api/forecasting/dataset` belum dipaginasi  perlu ditinjau lagi kalau jumlah plan historis sudah besar.  
* Field yang bisa diturunkan (hari-dalam-minggu dari `date`, margin dari revenue/cost yang sudah ada) sengaja tidak disimpan ulang untuk menghindari drift data.

`forecastingCache`   
**satu-satunya sumber** untuk ketiga hal yang sudah kita bahas: dashboard, features buat DS, dan link ke rekomendasi. Satu dokumen per `planId`, disimpan sebagai koleksi tersendiri (bukan dihitung ulang tiap request). 

{  
  "\_id": "plan\_001",  
  "schemaVersion": "1.1",

  "plan": {  
    "tags": \["payday", "weekend"\],  
    "reason": "Simulasi plan kopi akhir pekan",  
    "generatedAt": "2026-08-09T23:59:59.000Z",  
    "effectiveDurationDays": 2,  
    "startDate": "2026-08-10T00:00:00.000Z",  
    "endDate": "2026-08-11T23:59:59.000Z"  
  },

  "recommendationId": "rec\_2026081420\_001",

  "totalReplacementCost": 37000,

  "reportState": {  
    "report\_012": { "category": "menu", "refId": "menu\_001", "quantityLost": 2, "status": "approved", "costLoss": 9000 },  
    "report\_010": { "category": "ingredient", "refId": "bahan\_beras", "quantityLost": 500, "status": "approved", "costLoss": 25000 },  
    "report\_099": { "category": "menu", "refId": "menu\_002", "quantityLost": 1, "status": "approved", "costLoss": 3000 }  
  },

  "menus": {  
    "menu\_001": {  
      "name": "Nasi Goreng Spesial",  
      "quantityPlanned": 20,  
      "originalPrice": 25000,  
      "costPerUnit": 4500,  
      "soldQuantity": 20,  
      "revenueActual": 500000,  
      "lossQuantity": 2,  
      "stockOutRecord": { "soldAt": "2026-08-11T06:45:00.000Z" },  
      "daily": {  
        "2026-08-10": { "total": 7, "hours": { "8": 3, "12": 4 } },  
        "2026-08-11": { "total": 13, "hours": { "9": 6, "13": 7 } }  
      }  
    },  
    "menu\_002": {  
      "name": "Es Kopi Susu",  
      "quantityPlanned": 15,  
      "originalPrice": 18000,  
      "costPerUnit": 3000,  
      "soldQuantity": 15,  
      "revenueActual": 256500,  
      "lossQuantity": 1,  
      "stockOutRecord": { "soldAt": "2026-08-11T03:20:00.000Z" },  
      "daily": {  
        "2026-08-10": { "total": 7, "hours": { "8": 2, "13": 5 } },  
        "2026-08-11": { "total": 8, "hours": { "10": 8 } }  
      }  
    }  
  },

  "lastEventAppliedAt": "2026-08-11T07:00:00.000Z",  
  "updatedAt": "2026-08-11T07:00:05.000Z"  
}

**Bentuk untuk dashboard** — `GET /api/forecasting/plan/:id`   
{  
  "success": true,  
  "meta": { "planId": "plan\_001", "schemaVersion": "1.0" },  
  "summary": {  
    "totalRevenueActual": 756500,  
    "totalRevenueProjected": 770000,  
    "revenueAchievementRate": 0.98,  
    "totalUnitsSold": 35,  
    "sellThroughRate": 1.0,  
    "totalUnitsLost": 3,  
    "wasteRate": 0.079,  
    "grossMargin": 621500,  
    "grossMarginPercentage": 82.1  
  },  
  "trend": {  
    "daily": \[  
      { "date": "2026-08-10", "revenueActual": 340000, "revenueProjected": 385000, "unitsSold": 14 },  
      { "date": "2026-08-11", "revenueActual": 416500, "revenueProjected": 385000, "unitsSold": 21 }  
    \]  
  },  
  "inventory": \[  
    { 	"menuId": "menu\_001",   
	"remainingQuantity": 0,   
	"stockOutBeforeEnd": true,  
	"soldOutAt": "2026-08-11T06:45:00.000Z" }  
  \],  
  "menuPerformance": \[  
    { 	"menuId": "menu\_001",   
	"sellThroughRate": 1.0,   
	"marginPercentage": 82,   
	"velocityPerHour": 2.85,   
	"rank": "top" },  
    { 	"menuId": "menu\_002",   
	"sellThroughRate": 1.0,   
	"marginPercentage": 83,   
	"velocityPerHour": 3.1,   
	"rank": "top" }  
  \],  
  "insights": \[  
    { 	"type": "stockout",   
	"severity": "high",   
	"menuId": "menu\_001",  
      	"message": "Menu ini habis lebih awal dari jadwal — pertimbangkan naikkan stok periode berikutnya" },  
    { 	"type": "waste",   
	"severity": "medium",   
	"menuId": "menu\_001",  
      	"message": "2 pcs terbuang, setara 10% dari total loss plan ini" }  
  \],  
  "menus": \[      {  
        "menuId": "MENU-005",  
        "name": "Kopi Susu Gula Aren",  
        "quantityPlanned": 150,  
        "soldQuantity": 135,  
        "lossQuantity": 2,  
        "unsoldQuantity": 15,  
        "stockOutBeforeEnd": false,  
        "soldOutAt": null,  
        "revenueActual": 2970000,  
        "revenueProjected": 3300000,  
        "costActual": 831600,  
        "dailySales": \[  
          {  
            "date": "2026-08-01",  
            "quantitySold": 50,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 3 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 8 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 2 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 3 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 5 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 7 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 6 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 4 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 1 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 2 }  
            \]  
          },  
          {  
            "date": "2026-08-02",  
            "quantitySold": 55,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 2 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 6 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 5 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 4 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 3 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 4 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 7 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 9 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 8 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 4 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 1 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 2 }  
            \]  
          },  
          {  
            "date": "2026-08-03",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 5 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 9 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 2 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 2 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 1 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          }  
        \]  
      },  
      {  
        "menuId": "MENU-007",  
        "name": "Caffe Latte",  
        "quantityPlanned": 100,  
        "soldQuantity": 88,  
        "lossQuantity": 1,  
        "unsoldQuantity": 12,  
        "stockOutBeforeEnd": false,  
        "soldOutAt": null,  
        "revenueActual": 2640000,  
        "revenueProjected": 3000000,  
        "costActual": 792000,  
        "dailySales": \[  
          {  
            "date": "2026-08-01",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 4 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 8 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 6 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 2 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 1 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 1 }  
            \]  
          },  
          {  
            "date": "2026-08-02",  
            "quantitySold": 28,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 3 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 6 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 5 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 3 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 2 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 2 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 3 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 2 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          },  
          {  
            "date": "2026-08-03",  
            "quantitySold": 30,  
            "hourlySales": \[  
              { "hour": 7, "timeBucket": "07:00-08:00", "quantitySold": 6 },  
              { "hour": 8, "timeBucket": "08:00-09:00", "quantitySold": 10 },  
              { "hour": 9, "timeBucket": "09:00-10:00", "quantitySold": 7 },  
              { "hour": 10, "timeBucket": "10:00-11:00", "quantitySold": 2 },  
              { "hour": 11, "timeBucket": "11:00-12:00", "quantitySold": 1 },  
              { "hour": 12, "timeBucket": "12:00-13:00", "quantitySold": 1 },  
              { "hour": 13, "timeBucket": "13:00-14:00", "quantitySold": 1 },  
              { "hour": 14, "timeBucket": "14:00-15:00", "quantitySold": 1 },  
              { "hour": 15, "timeBucket": "15:00-16:00", "quantitySold": 0 },  
              { "hour": 16, "timeBucket": "16:00-17:00", "quantitySold": 1 },  
              { "hour": 17, "timeBucket": "17:00-18:00", "quantitySold": 0 },  
              { "hour": 18, "timeBucket": "18:00-19:00", "quantitySold": 0 }  
            \]  
          }  
        \]  
      }

**Bentuk untuk data science —** `GET /api/forecasting/plan/:id/features` 

\[  
  {  
    "planId": "plan\_001",  
    "menuId": "menu\_001",  
    "date": "2026-08-10",  
    "hour": 8,  
    "dayOfWeek": "Monday",  
    "isWeekend": false,  
    "planTags": \["payday", "weekend"\],  
    "quantitySold": 3,  
    "quantityPlanned": 20,  
    "originalPrice": 25000,  
    "priceUsed": 25000,  
    "discountApplied": false,  
    "costPerUnit": 4500,  
    "cumulativeSoldSoFar": 3,  
    "remainingQuantityAfter": 17,  
    "stockOutFlag": false  
  }  
\]  
