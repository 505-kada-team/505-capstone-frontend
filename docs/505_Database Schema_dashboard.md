## **1\. Konsep Dasar**

Modul Dashboard menyediakan tampilan analitis *real-time* untuk memantau performa operasional toko harian. Modul ini bersifat **Read-Only** (*view/query side*) dan **tidak pernah mengubah data** pada koleksi sales, plans, maupun menus.

* **Agregasi Server-Side Berperforma Tinggi:**  
  Seluruh kalkulasi KPI (*Key Performance Indicator*) dan tren harian diproses langsung di level database engine menggunakan **MongoDB Aggregation Pipeline**. Sistem tidak memuat (*load*) baris data mentah transaksi ke memori JavaScript, sehingga endpoint tetap responsif meskipun koleksi sales mencapai jutaan baris data.  
* **Penanganan Waktu & Filter Rentang Tanggal (Date Boundaries):**  
  Untuk memastikan akurasi data harian, filter tanggal secara otomatis dikunci pada rentang batas waktu presisi lokal:  
  1. startDate → Dipaksa mulai dari awal hari pukul 00:00:00.000  
  2. endDate → Dipaksa sampai akhir hari pukul 23:59:59.999  
  3. **Default Gating:** Jika parameter tanggal tidak dikirim oleh *frontend*, sistem secara otomatis menyetel rentang filter untuk **hari ini** (now()).  
* **Pendekatan Dual-Grained Analytics:**  
  Modul ini memfasilitasi dua mode analisis utama:  
  1. **Hourly Analytics (Analisis Per-Jam):** Menganalisis pola transaksi (*peak hours*) dalam rentang **satu hari tertentu** dengan sumbu-X berupa deret jam (00:00 s.d. 23:00).  
  2. **Daily Range Analytics (Analisis Tren Rentang Hari):** Menganalisis fluktuasi pendapatan dan akumulasi *cup* terjual selama rentang beberapa hari/bulan dengan sumbu-X berupa tanggal (YYYY-MM-DD).

## **2\. Skema Data (Aggregation Result Contracts)**

Modul ini tidak membuat koleksi baru, melainkan membentuk objek *Read Model* teragregasi secara *live* dari koleksi sales.

#### **Schema Objek Output: DashboardSummary**

| Field | Tipe | Keterangan |
| :---- | :---- | :---- |
| kpi.totalRevenue | number | Total nominal pendapatan bersih      (quantitySold priceSold) pada periode terpilih |
| kpi.totalCupsSold | number | Total akumulasi volume porsi/cup terjual (quantitySold) pada periode terpilih |
| hourlyTrend | array | *(Hanya pada Query Single-Day)* Array tren transaksi per jam dalam 1 hari |
| hourlyTrend\[\].hour | string | Label jam transaksi (Format: "08:00", "09:00", ..., "23:00") |
| hourlyTrend\[\].hourlyRevenue | number | Total pendapatan pada jam tersebut |
| hourlyTrend\[\].hourlyCupsSold | number | Total cup/porsi terjual pada jam tersebut |
| hourlyTrend\[\].totalTransactions | number | Total struk/transaksi terproses pada jam tersebut |
| dailyTrend | array | *(Hanya pada Query Multi-Day)* Array tren transaksi harian |
| dailyTrend\[\].date | string | Label tanggal transaksi (Format ISO Date: "YYYY-MM-DD") |
| dailyTrend\[\].dailyRevenue | number | Total pendapatan pada tanggal tersebut |
| dailyTrend\[\].dailyCupsSold | number | Total cup/porsi terjual pada tanggal tersebut |
| dailyTrend\[\].totalTransactions | number | Total struk/transaksi terproses pada tanggal tersebut |

## 

## **3\. Format Error Response**

Konsisten dengan standar penanganan error seluruh modul:

JSON  
{  
  "success": false,  
  "message": "Format parameter tanggal tidak valid",  
  "errors": \[  
    {   
      "field": "startDate",   
      "message": "Format tanggal harus YYYY-MM-DD"   
    }  
  \]  
}

## **4\. Daftar Endpoint**

| \# | Method | Path | Fungsi | Akses |
| :---- | :---- | :---- | :---- | :---- |
| **D1** | GET | /api/dashboard/summary | Ringkasan KPI & Tren Penjualan Harian (Jam atau Rentang Hari) | Kasir, Admin, & Owner |

## **5\. Detail Endpoint**

#### **D1. GET /api/dashboard/summary**

##### **Query Parameters**

| Parameter | Tipe | Wajib | Keterangan |
| :---- | :---- | :---- | :---- |
| date | string | Tidak | Tanggal spesifik (YYYY-MM-DD) untuk melihat tren per-jam (*Hourly Analysis*). Default: Hari ini. |
| startDate | string | Tidak | Tanggal awal rentang analisis harian (YYYY-MM-DD). |
| endDate | string | Tidak | Tanggal akhir rentang analisis harian (YYYY-MM-DD). |

> **Catatan:** Jika startDate dan endDate diisi bersamaan, sistem akan menjalankan mode **Multi-Day Daily Trend**. Jika hanya date yang diisi (atau tanpa parameter), sistem mengaktifkan mode **Single-Day Hourly Trend**.

##### **Response 200 OK (Mode Single-Day / Hourly Trend \- Default Hari Ini)**

JSON  
{  
  "success": true,  
  "message": "Data dashboard harian (hourly) berhasil didapatkan",  
  "filter": {  
    "selectedDate": "2026-08-07",  
    "startDate": "2026-08-07T00:00:00.000Z",  
    "endDate": "2026-08-07T23:59:59.999Z"  
  },  
  "data": {  
    "kpi": {  
      "totalRevenue": 1250000,  
      "totalCupsSold": 58  
    },  
    "hourlyTrend": \[  
      {  
        "hour": "08:00",  
        "hourlyRevenue": 150000,  
        "hourlyCupsSold": 8,  
        "totalTransactions": 5  
      },  
      {  
        "hour": "09:00",  
        "hourlyRevenue": 220000,  
        "hourlyCupsSold": 11,  
        "totalTransactions": 7  
      },  
      {  
        "hour": "14:00",  
        "hourlyRevenue": 340000,  
        "hourlyCupsSold": 15,  
        "totalTransactions": 10  
      },  
      {  
        "hour": "19:00",  
        "hourlyRevenue": 180000,  
        "hourlyCupsSold": 8,  
        "totalTransactions": 6  
      }  
    \]  
  }  
}

##### **Response 200 OK (Mode Multi-Day / Rentang Tanggal)**

JSON  
{  
  "success": true,  
  "message": "Data dashboard rentang tanggal berhasil didapatkan",  
  "filter": {  
    "startDate": "2026-08-01T00:00:00.000Z",  
    "endDate": "2026-08-07T23:59:59.999Z"  
  },  
  "data": {  
    "kpi": {  
      "totalRevenue": 14250000,  
      "totalCupsSold": 680  
    },  
    "dailyTrend": \[  
      {  
        "date": "2026-08-01",  
        "dailyRevenue": 1850000,  
        "dailyCupsSold": 88,  
        "totalTransactions": 52  
      },  
      {  
        "date": "2026-08-02",  
        "dailyRevenue": 2100000,  
        "dailyCupsSold": 102,  
        "totalTransactions": 61  
      }  
    \]  
  }  
}

##### **Response 400 Bad Request (Format Tanggal Salah)**

JSON  
{  
  "success": false,  
  "message": "Format parameter tanggal tidak valid",  
  "errors": \[  
    {  
      "field": "startDate",  
      "message": "Tanggal harus berformat YYYY-MM-DD yang valid"  
    }  
  \]  
}

##### **Aliran Eksekusi (Flow Engine)**

1. **Evaluasi Filter Tanggal:**  
   * Ambil query date, startDate, dan endDate.  
   * Jika rentang tanggal kustom diterima, normalisasikan batas jam 00:00:00.000 pada startDate dan 23:59:59.999 pada endDate.  
   * Jika tidak ada query, tetapkan targetDate \= now() dengan jam 00:00:00.000 s.d. 23:59:59.999.  
2. **Eksekusi Aggregation Pipeline MongoDB:**  
   * Tahap $match: Saring dokumen sales dengan kondisi soldAt berada di dalam rentang tanggal terformat.  
   * Tahap $group:  
     * Untuk **Hourly Analytics**: Kelompokkan berdasarkan ekspresi $dateToString: { format: "%H:00", date: "$soldAt" }.  
     * Untuk **Daily Range Analytics**: Kelompokkan berdasarkan ekspresi $dateToString: { format: "%Y-%m-%d", date: "$soldAt" }.  
     * Akumulasikan revenue via operator $sum: { $multiply: \["$quantitySold", "$priceUsed"\] }.  
     * Akumulasikan cups via operator $sum: "$quantitySold".  
     * Hitung total transaksi via operator $sum: 1.  
   * Tahap $sort: Urutkan deret jam/tanggal secara kronologis *ascending* (1).  
   * Tahap $project: Rapikan nama field output agar konsisten dengan pustaka chart pada UI (seperti Chart.js atau Recharts).  
3. **Hitung KPI Keseluruhan:**  
   * Lakukan reduksi total (totalRevenue dan totalCupsSold) dari array hasil agregasi pipeline untuk ditampilkan di *KPI Summary Card*.  
4. **Return HTTP 200 OK.**

