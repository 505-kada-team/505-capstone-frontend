# CONVENTIONS.md — Frontend Inventory App

Dokumen ini adalah **acuan wajib** untuk semua kerjaan FE, baik dikerjakan manual maupun lewat AI agent (Antigravity, dll). Setiap kali minta bantuan AI, **lampirkan/rujuk file ini** di prompt supaya hasilnya konsisten antar developer.

---

## 1. Tech Stack Resmi (JANGAN keluar dari ini tanpa diskusi tim)

- React 18 + Vite
- JavaScript (bukan TypeScript, kecuali disepakati ulang)
- Tailwind CSS
- shadcn/ui (komponen di-generate lewat `npx shadcn add [nama]`, BUKAN install manual)
- React Router DOM (routing antar halaman)
- Axios (pemanggilan API)
- Zod (validasi data form)
- Zustand (state management global, di luar auth yang tetap di Context)
- Socket.io-client (untuk fitur real-time)
- Recharts (charting untuk modul Dashboard/analitik — komponen React native, bukan Chart.js)
- Backend: Express.js — [ISI: versi Node yang dipakai]

---

## 1b. Bahasa UI (Ditambahkan — sebelumnya belum diputuskan)

Seluruh teks yang tampil ke user (label, tombol, judul, placeholder, pesan error/toast) pakai **Bahasa Inggris**, konsisten di semua halaman & role. Ini beda dari bahasa dokumen internal (dokumen ini, `DESIGN.md`, komunikasi tim) yang tetap boleh Indonesia.

Mockup Stitch sempat campur Indonesia/Inggris antar halaman — kunci ke mapping Inggris ini, jangan ikut versi Indonesia yang sempat muncul:

| Mockup Stitch (jangan dipakai) | Final (dipakai) |
| --- | --- |
| Nama Item | Item Name |
| Kategori | Category |
| Jumlah | Quantity |
| Harga per Unit | Price per Unit |
| Kadaluarsa | Expiry Date |
| Diterima | Received |
| Dibuat | Created |
| Batal | Cancel |
| Simpan | Save |
| Hapus / Hapus Item | Delete / Delete Item |
| Tambah Item | Add Item |
| Deskripsi | Description |
| Batch Inventori | Inventory Batches |

---

## 2. Struktur Folder (WAJIB diikuti, jangan bikin folder baru sembarangan)

```
src/
├── layouts/
│   ├── AdminLayout.jsx   # Sidebar/header versi admin (tema boleh beda dari kasir)
│   └── KasirLayout.jsx    # Sidebar/header versi kasir
├── components/
│   ├── ui/                # HASIL GENERATE shadcn. Jangan edit manual isi file di sini.
│   └── shared/              # Dipakai KEDUA role — jangan dipisah per role di sini.
│       ├── DataTable.jsx     # Tabel generik — terima props columns & data
│       ├── PageHeader.jsx    # Judul halaman + tombol aksi
│       └── ConfirmDialog.jsx
├── pages/
│   ├── admin/              # [ISI: daftar halaman admin dari wireframe]
│   └── kasir/                # [ISI: daftar halaman kasir dari wireframe]
├── routes/
│   ├── ProtectedRoute.jsx    # Cek role sebelum render halaman
│   ├── AdminRoutes.jsx
│   └── KasirRoutes.jsx
├── services/
│   └── api.js                 # SEMUA fetch API lewat sini, SATU file untuk kedua role.
├── context/
│   └── AuthContext.jsx         # Simpan { user, role, token }
├── stores/
│   └── [nama]Store.js           # Zustand store, 1 file per domain data (misal produkStore.js)
├── schemas/
│   └── [nama]Schema.js          # Skema validasi Zod, 1 file per form (misal loginSchema.js)
├── hooks/
│   └── useSocket.js             # Wrapper koneksi Socket.io
└── lib/
    └── mockData.js               # Data dummy, bentuknya WAJIB sama persis dengan API contract
```

**Aturan:**
- `pages/` dan `layouts/` boleh dipisah admin/kasir — ini murni soal tampilan & navigasi.
- `components/ui/`, `components/shared/`, dan `services/api.js` **TIDAK dipisah per role** — dipakai bersama, karena logic-nya sama untuk kedua role.
- Kalau butuh komponen yang reuse lintas halaman TAPI cuma masuk akal untuk 1 role (misal cetak struk hanya di kasir), taruh di `components/shared/kasir/` atau `components/shared/admin/`. Kalau reuse-nya lintas KEDUA role, taruh langsung di `components/shared/`.
- Infokan ke grup tim setiap menambah komponen shared baru.

---

## 2b. Role Admin & Kasir dalam 1 App — Routing & Alur Login

1 aplikasi, 1 sistem auth, 1 backend — yang dipisah cuma **navigasi & tampilan setelah login**, bukan pondasinya.

**Halaman login & registrasi digabung jadi 1 halaman** (`/login`), biasanya dengan toggle/tab "Masuk" vs "Daftar" di komponen yang sama. Validasi kedua form ini pakai Zod (lihat section 5b).

**Alur:** user login/daftar lewat 1 halaman (`/login`) → backend balikin `role` di response (untuk login) → FE redirect otomatis sesuai role, user tidak pernah memilih role manual.

```javascript
// App.jsx — pola routing
<Routes>
  <Route path="/login" element={<LoginPage />} /> {/* berisi tab Login & Registrasi */}

  <Route path="/admin/*" element={
    <ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>
  }>
    <Route path="dashboard" element={<DashboardPage />} />
    {/* [ISI: route halaman admin lain] */}
  </Route>

  <Route path="/kasir/*" element={
    <ProtectedRoute allowedRole="kasir"><KasirLayout /></ProtectedRoute>
  }>
    <Route path="transaksi" element={<TransaksiPage />} />
    {/* [ISI: route halaman kasir lain] */}
  </Route>
</Routes>
```

### Naming Convention Role-Specific

| Jenis | Konvensi | Contoh |
|---|---|---|
| Halaman | `[Nama][Page].jsx`, di folder role masing-masing | `pages/admin/ProdukPage.jsx` |
| Layout | `[Role]Layout.jsx` | `AdminLayout.jsx`, `KasirLayout.jsx` |
| Komponen dipakai KEDUA role | Nama generik, TANPA prefix role | `DataTable.jsx` — bukan `AdminDataTable.jsx` |
| Komponen reuse lintas halaman tapi khusus 1 role | Prefix role di depan | `AdminStatCard.jsx`, `KasirReceiptPrint.jsx` |
| Fungsi di `services/api.js` | Berdasarkan resource, BUKAN role | `getProducts()`, `createTransaction()` — bukan `getAdminProducts()` |

**Prinsip:** nama mengikuti **apa yang dilakukan**, bukan **siapa yang memakai** — kecuali komponennya memang secara desain cuma relevan untuk 1 role.

---

## 3. Konvensi Penamaan

- Komponen React: `PascalCase.jsx` (misal `ProductTable.jsx`)
- Fungsi/hook biasa: `camelCase.js` (misal `formatCurrency.js`, `useAuth.js`)
- Custom hook WAJIB diawali `use` (misal `useSocket`, `useProducts`)
- 1 file = 1 komponen utama. Jangan gabung banyak komponen tidak berkaitan dalam 1 file.

---

## 4. Konvensi Komponen & Styling

- **Styling HANYA lewat Tailwind utility classes + komponen shadcn/ui yang sudah di-generate.** Jangan tulis custom CSS/file `.css` baru kecuali benar-benar tidak bisa dihindari (dan harus didiskusikan dulu di grup).
- **SEBELUM bikin komponen baru, cek dulu apakah sudah ada** di `components/shared/` atau `components/ui/`. Kalau sudah ada → WAJIB reuse, jangan bikin versi sendiri.
- Komponen shared harus menerima data lewat **props**, bukan hardcode isi di dalamnya (contoh: `<DataTable columns={...} data={...} />`, bukan `<ProductTableKhusus />` yang isinya di-hardcode).
- Warna, spacing, radius ikut token default Tailwind/shadcn — jangan pakai warna hex custom di luar palet yang sudah ada, supaya semua halaman terlihat satu keluarga desain.

---

## 5. Konvensi Pemanggilan API (Acuan dari API Contract)

Semua fungsi pemanggilan API didefinisikan di `services/api.js`, contoh pola:

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getProducts = () => api.get('/api/products');
export const createProduct = (data) => api.post('/api/products', data);
export const updateStock = (id, stock) => api.put(`/api/products/${id}`, { stock });
```

Komponen halaman **memanggil fungsi ini**, bukan `axios` langsung:

```javascript
import { getProducts } from '../services/api';
// di dalam useEffect: const res = await getProducts();
```

**Tempel API contract final di sini (atau link ke dokumennya):**
> [ISI: tabel endpoint, method, request body, response body dari API contract yang sudah kamu punya]

**Mapping tanggal Inventory Batch (ditambahkan, biar Antigravity nggak nebak):**
- Label "Received" di UI = field `inDate` dari API contract
- Label "Created" di UI = field `createdAt` (timestamp sistem, bukan input user)

Selama backend belum siap, pakai `lib/mockData.js` dengan bentuk data **persis sama** dengan yang dijanjikan di contract, supaya swap ke API asli nanti murah. Gunakan flag per-modul (BUKAN 1 flag global), karena tiap modul akan "siap" di waktu beda-beda:

```javascript
// services/api.js
const MOCK_CONFIG = {
  inventory: false, // API real sudah siap & terverifikasi
  menu: true,         // masih pakai mock
  productionPlan: true,
};

export const getInventoryList = (params) =>
  MOCK_CONFIG.inventory ? Promise.resolve({ data: mockInventoryList }) : api.get('/api/inventory', { params });
```

---

## 5a2. Prosedur Swap dari Mock ke API Real (WAJIB diikuti tiap modul, jangan langsung matiin mock)

Begitu backend 1 modul sudah siap dipakai:

1. **Verifikasi dulu** — panggil API real langsung (Postman/Thunder Client), bandingkan bentuk response-nya field-per-field dengan `mockData.js` yang sudah ada.
2. **Kalau ada beda kecil** (nama field, field baru) → update `mockData.js`/`api.js`/schema mengikuti API asli.
   **Kalau beda besar/aneh** (endpoint hilang, logic beda drastis dari contract) → klarifikasi ke tim BE dulu, jangan langsung nurut ke API yang mungkin belum final.
3. Baru ubah `MOCK_CONFIG.[modul]` jadi `false` untuk modul itu saja.
4. **Test ulang kondisi error** (400/404/409, network gagal, data kosong asli) — ini nggak pernah ketest selama pakai mock, karena mock cuma mensimulasikan kondisi "senang".
5. **Jangan hapus `mockData.js`** setelah switch — tetap berguna untuk testing edge case dan demo tanpa dependensi ke backend yang mungkin sedang down.

---

## 5b. Konvensi Validasi Form (Zod)

- 1 form = 1 skema, ditaruh di `schemas/[nama]Schema.js`. Jangan tulis validasi manual (if/else panjang) di dalam komponen.
- Skema untuk login & registrasi dipisah walau 1 halaman: `loginSchema.js` dan `registerSchema.js`, karena field-nya beda (registrasi biasanya butuh konfirmasi password, dll).

```javascript
// schemas/registerSchema.js
import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['admin', 'kasir']),
});
```

```javascript
// Dipakai di komponen form:
import { registerSchema } from '../schemas/registerSchema';

const result = registerSchema.safeParse(formData);
if (!result.success) {
  // tampilkan result.error ke user
}
```

## 5c. Konvensi State Management (Zustand)

- Zustand dipakai untuk **state yang dipakai lintas komponen/halaman** (misal daftar produk yang perlu diakses di banyak tempat). Untuk state lokal 1 komponen (misal buka/tutup modal), tetap pakai `useState` biasa — jangan semua dipindah ke Zustand.
- Auth/role tetap di `AuthContext` (bukan Zustand), supaya tidak ada 2 sumber kebenaran soal siapa yang login.
- 1 store = 1 domain data, ditaruh di `stores/[nama]Store.js`.

```javascript
// stores/produkStore.js
import { create } from 'zustand';

export const useProdukStore = create((set) => ({
  produkList: [],
  setProdukList: (data) => set({ produkList: data }),
  addProduk: (produk) => set((state) => ({ produkList: [...state.produkList, produk] })),
}));
```

```javascript
// Dipakai di komponen:
import { useProdukStore } from '../stores/produkStore';

const { produkList, setProdukList } = useProdukStore();
```

---

## 5d. Konvensi Format Data (Ditambahkan — sebelumnya belum eksplisit)

- **Tanggal**: format ISO `YYYY-MM-DD` di semua tempat (tabel, form, badge tanggal). Tidak ada konversi timezone khusus — tanggal diperlakukan sebagai date-only sesuai apa adanya dari API.
- **Unit** (`kg`, `l`, `btl`, `pcs`, dst): selalu **lowercase** — di tabel, placeholder, maupun dropdown pilihan unit. Jangan kapital di sebagian tempat seperti yang sempat kejadian di mockup Stitch.
- **Currency**: format `Rp 12.700` — separator ribuan pakai titik, tanpa desimal, prefix `Rp` + spasi. Ini spek resmi buat `formatCurrency.js` (sebelumnya cuma disebut nama filenya di Section 3, belum ada spek keluarannya).

---

## 6. Auth & Role Handling

- Status login & role disimpan di `AuthContext`, diakses lewat `useAuth()` hook.
- Cek role di level routing (halaman admin tidak bisa diakses kasir) DAN di level komponen (tombol/aksi tertentu disembunyikan sesuai role).
- Pola: `if (role !== 'admin') return null;` di komponen yang khusus admin.

---

## 7. Real-time (Socket.io)

- Semua koneksi socket lewat `hooks/useSocket.js`, jangan bikin koneksi baru di tiap komponen.
- Event name disepakati di API contract juga (misal `'transaksi-baru'`, `'stok-update'`) — WAJIB sama persis antara FE dan BE, huruf besar/kecil termasuk.

---

## 8. Git Workflow

- Branch per fitur: `feature/kasir-transaksi`, `feature/admin-produk`, dst — bukan per orang.
- Merge ke `develop` lewat Pull Request, direview minimal 1 orang lain sebelum digabung.
- Checklist review PR (fokus 2 hal ini saja):
  - [ ] Reuse komponen shared yang sudah ada (tidak bikin ulang)?
  - [ ] Ikut struktur folder & penamaan di dokumen ini?

---

## 9. Cara Prompt AI Agent (Antigravity) — Template

Supaya hemat limit dan hasil konsisten, **cek dulu apakah Antigravity punya fitur "project rules" atau file konteks persisten** (banyak AI coding tool sekarang punya ini, semacam file yang otomatis dibaca tiap sesi tanpa perlu kamu tempel ulang). Kalau ada, taruh isi dokumen ini di sana. Kalau tidak, pakai template prompt ini tiap kali mulai kerjaan baru — ganti bagian dalam `[...]`:

```
Kamu membantu development frontend untuk project inventory app.

ATURAN WAJIB (ikuti persis, jangan menyimpang):
- Tech stack: React 18 + Vite + Tailwind CSS + shadcn/ui, JavaScript (bukan TypeScript)
- Validasi form pakai Zod (schemas/[nama]Schema.js), state lintas halaman pakai Zustand (stores/[nama]Store.js)
- Struktur folder: [tempel bagian struktur folder di atas]
- SEBELUM membuat komponen baru, cek apakah sudah ada di src/components/shared/
  atau src/components/ui/. Jika sudah ada, WAJIB reuse — jangan buat versi baru.
- Semua pemanggilan API lewat src/services/api.js mengikuti kontrak berikut:
  [tempel bagian API contract yang relevan untuk halaman ini]
- Styling HANYA Tailwind + shadcn/ui. Jangan tulis custom CSS.

TUGAS:
Buat halaman [nama halaman] untuk role [admin/kasir].
Reuse komponen: Layout, PageHeader, DataTable (jangan bikin versi baru).
Referensi visual: [lampirkan wireframe atau hasil Stitch AI untuk halaman ini]

Output: kode lengkap file [nama file], sesuai struktur folder di atas.
```

**Tips hemat limit:** jangan mulai obrolan baru dari nol tiap ganti halaman kalau tool-nya support context/memory dalam satu sesi — lanjutkan di sesi yang sama supaya konvensi yang sudah "diajarkan" di awal tetap kebawa, tidak perlu ditulis ulang tiap prompt.

---

## 10. Soal Stitch AI (Google) — Cara Pakai yang Aman

Stitch AI bagus untuk cepat menghasilkan tampilan high-fidelity dari wireframe, **tapi jangan langsung copy-paste hasilnya ke folder project**. Alasannya:
- Output Stitch biasanya HTML/CSS atau markup generik — bukan otomatis "komponen shadcn" yang reuse-able sesuai struktur di atas.
- Kalau ditempel mentah-mentah, tiap halaman bisa punya struktur/style beda-beda sendiri, merusak konsistensi yang justru sedang kita jaga.

**Alur yang lebih aman:**
1. Pakai Stitch untuk dapat referensi visual (layout, warna, spacing) — anggap ini "mockup," bukan kode final.
2. Screenshot/export hasil Stitch, lampirkan sebagai **referensi visual** di prompt AI agent (lihat template di atas, bagian "Referensi visual").
3. Minta AI agent **membangun ulang** tampilan itu memakai komponen shared yang sudah ada (`DataTable`, `Layout`, dst) — bukan menyalin kode Stitch mentah-mentah.
4. Developer tetap review manual sebelum PR, cek apakah komponen yang dipakai konsisten dengan halaman lain.

---

### Checklist Sebelum Mulai Coding (tiap developer, tiap fitur baru)
- [ ] Sudah baca dokumen ini?
- [ ] Sudah cek `components/shared/` — ada yang bisa langsung dipakai?
- [ ] Sudah tahu endpoint API yang dipakai dari contract?
- [ ] Kalau real-time, sudah tahu nama event socket yang dipakai?
