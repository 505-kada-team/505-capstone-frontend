# MODULE_SETUP_TEMPLATE.md — Cara Setup Modul Baru dari API Contract

Dipakai setiap kali ada API contract modul baru masuk (Menu, Production Plan, dll). Ikuti urutan ini — JANGAN loncat ke UI sebelum 3 langkah pertama selesai.

**Cara pakai dengan AI agent (Antigravity):** lampirkan file ini + PDF/teks API contract modul yang bersangkutan di prompt, minta AI ikuti urutan di bawah persis, satu langkah sekaligus (jangan minta "buatkan semua sekaligus" — hasilnya lebih rapi kalau bertahap dan direview tiap langkah).

---

## Langkah 1 — `lib/mockData.js`

Untuk SETIAP response sukses yang dicontohkan di contract, buat 1 mock object dengan bentuk **persis sama** (nama field, nesting, tipe data). Termasuk minimal 1 contoh untuk tiap variasi response penting (misal: response normal, response kosong/empty state, response dengan kondisi khusus seperti `hasUnsafeBatch: true`).

```javascript
export const mock[NamaResource]List = {
  success: true,
  data: [ /* persis sesuai contoh response di contract */ ],
  pagination: { /* kalau ada */ },
};
```

Checklist:
- [ ] Semua field di response contract ada di mock (tidak dikurangi/disingkat)
- [ ] Tipe data cocok (angka tetap angka, bukan string)
- [ ] Ada mock untuk kondisi error juga (409, 404, dll) — dipakai buat testing tampilan error state

---

## Langkah 2 — `services/api.js` (tambahkan ke file yang sudah ada, jangan bikin file baru per modul)

Untuk SETIAP endpoint di tabel "Daftar Endpoint" pada contract, buat 1 fungsi. Nama fungsi mengikuti pola `[verb][Resource]`, sesuai section naming convention di `CONVENTIONS.md`.

```javascript
export const get[Resource]List = (params) =>
  USE_MOCK ? Promise.resolve({ data: mock[Resource]List }) : api.get('/api/[path]', { params });

export const create[Resource] = (payload) =>
  USE_MOCK ? Promise.resolve({ data: mock[Resource]Created }) : api.post('/api/[path]', payload);
```

Checklist:
- [ ] Jumlah fungsi = jumlah endpoint di tabel contract (tidak ada yang kelewat)
- [ ] Method (GET/POST/PUT/DELETE) sesuai tabel
- [ ] Path endpoint disalin persis dari contract, termasuk parameter (`:id`, dll)

---

## Langkah 3 — `schemas/[nama]Schema.js`

Untuk SETIAP payload request di contract (biasanya endpoint POST/PUT), buat 1 skema Zod. Aturan validasi diambil dari kolom "Flow" di contract (field wajib, kondisi khusus seperti "wajib diisi untuk kategori X").

```javascript
export const [nama]Schema = z.object({
  // field sesuai payload di contract, aturan sesuai flow (min, enum, optional, dll)
});
```

Checklist:
- [ ] Semua field wajib di payload contract ada validasinya
- [ ] Aturan kondisional dari "Flow" (misal field A wajib kalau field B = X) dicatat sebagai komentar kalau Zod dasar tidak bisa handle langsung — validasi kondisional ditambahkan manual saat submit

---

## Langkah 4 — Catat "State UI" dari Business Rules

Baca ulang contract, catat di sini kondisi non-standar yang perlu tempat di desain (badge status, pesan error spesifik, empty state, dll):

> [ISI: daftar state UI khusus dari contract modul ini]

---

## Langkah 5 — Baru Mulai Slicing UI / Komponen Halaman

Setelah 4 langkah di atas selesai dan direview, baru bikin komponen halaman. Komponen memanggil fungsi dari `services/api.js` (Langkah 2), pakai `useState`+`useEffect` untuk data lokal atau Zustand store (`stores/[nama]Store.js`) untuk data lintas halaman, dan skema dari Langkah 3 untuk validasi form.

Pola dasar (data lokal):
```javascript
const [data, setData] = useState([]);
useEffect(() => {
  get[Resource]List().then((res) => setData(res.data.data));
}, []);
```

Pola dasar (lintas halaman via Zustand):
```javascript
// stores/[nama]Store.js
export const use[Resource]Store = create((set) => ({
  list: [],
  fetch[Resource]: async () => {
    const res = await get[Resource]List();
    set({ list: res.data.data });
  },
}));
```

---

### Ringkasan Urutan
1. `lib/mockData.js` — tiru bentuk response contract persis
2. `services/api.js` — 1 fungsi per endpoint di contract
3. `schemas/[nama]Schema.js` — 1 skema per payload request
4. Catat state UI dari business rules (badge, error, empty state)
5. Baru bikin komponen halaman, sambungkan lewat `useState`/`useEffect` atau Zustand store

**Jangan mulai dari langkah 5.** Kalau AI agent (atau developer) langsung diminta "buatkan halaman X," minta dia mundur dulu ke langkah 1-4 kalau modul itu belum ada mock/api/schema-nya.
