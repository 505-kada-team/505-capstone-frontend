# DESIGN V1

# DESIGN.md — Inventory App

Dokumen ini adalah **sumber kebenaran tunggal** untuk semua keputusan visual — dipakai bersama oleh Stitch (Design System-nya), Antigravity (saat nulis kode), dan `tailwind.config.js`/tema shadcn di project. Kalau salah satu dari ketiganya beda sendiri, dokumen inilah yang benar.

**Cara pakai:** isi bagian `[ISI DI SINI]` SEKALI sebelum mulai desain di Stitch maupun minta Antigravity generate kode apapun. Begitu diisi, tempel isi file ini ke: (1) kolom DESIGN.md di Stitch, (2) setiap prompt awal ke Antigravity, (3) jadi acuan config Tailwind/shadcn di kode.

---

## 1. Prinsip Visual (1-2 kalimat, jadi acuan “rasa” keseluruhan app)

Hangat, F&B/culinary-leaning, tapi tetap fungsional untuk kerja data-heavy (admin & kasir yang baca banyak angka tiap hari). Bukan dashboard generik biru-abu, tapi juga nggak playful berlebihan — mendukung modul food-waste-reduction/production plan dengan nuansa “coffee-shop” yang hangat.

Mendukung **light mode dan dark mode**.

---

## 2. Warna

Palet dasar (dari brand exploration tim):

| Nama | Hex | Skala |
| --- | --- | --- |
| Primary | `#2D241E` (coklat gelap) | punya skala tint 10-100% |
| Secondary | `#E6D5C3` (krem) | punya skala tint |
| Tertiary | `#F97316` (oranye) | punya skala tint |
| Neutral | `#121212` (hampir hitam) | punya skala tint dari hitam ke putih |

**Mapping ke token shadcn (light & dark):**

| Token shadcn | Light Mode | Dark Mode | Catatan |
| --- | --- | --- | --- |
| `background` | `#FDFBF9` (putih hangat) | `#121212` (Neutral) |  |
| `foreground` (teks utama) | `#2D241E` (Primary) | `#E6D5C3` (Secondary) |  |
| `primary` (tombol utama) | `#2D241E` (Primary) | `#F97316` (Tertiary) | **Di-swap di dark mode** — Primary brown nyaris nyatu dengan background gelap, jadi oranye ambil alih peran tombol utama |
| `primary-foreground` | putih | `#121212` | Teks di atas tombol primary |
| `secondary` | `#E6D5C3` | `#2D241E` | Di dark mode jadi warna card/surface |
| `accent` (brand highlight, dekoratif non-status) | `#F97316` | `#F97316` | Tetap sama di kedua mode. Dipakai untuk highlight brand/CTA sekunder — **bukan** dipakai untuk status batch (lihat catatan di bawah, ini beda dari draft sebelumnya) |
| `destructive` | `#C4441F` | sama | Dipakai badge `expired`, tombol hapus |
| `success` | `#4E6A3E` | sama | Dipakai badge `active` |
| `warning` (status khusus, terpisah dari accent brand) | `#B45309` (amber gelap/gold-brown) | sama | Dipakai KHUSUS untuk `batchSafetyStatus: unsafe` |
| `muted-tan` (status khusus) | `#8A7256` | sama | Dipakai KHUSUS untuk status `depleted` |
| `neutral` (`muted`/`border`) | turunan skala Neutral terang | turunan skala Neutral gelap | Pakai skala yang sudah ada di swatch Neutral |

**Keputusan final (menggantikan draft sebelumnya):** warna status **dipisah dari warna brand/accent** — Tertiary oranye (`#F97316`) TETAP jadi brand aksen (tombol CTA, highlight), tapi TIDAK dipakai lagi untuk status `unsafe`. Status `unsafe` sekarang punya warna sendiri (`#B45309`) supaya makna "brand" dan "peringatan data" tidak bercampur. Ini lebih aman untuk konsistensi jangka panjang dibanding opsi dobel-fungsi yang dibahas di draft awal.

**Aturan warna status (WAJIB konsisten di semua halaman, versi final):**
- `active` → success (`#4E6A3E`)
- `deleted` → neutral/abu-abu (skala Neutral)
- `depleted` → muted-tan (`#8A7256`)
- `expired` → destructive (`#C4441F`)
- `batchSafetyStatus: unsafe` → warning (`#B45309`)
- `batchSafetyStatus: safe` → success atau neutral (tidak perlu menonjol)

---

## 3. Tipografi

| Elemen | Font | Size (Tailwind) | Weight |
| --- | --- | --- | --- |
| Headline (H1) | Epilogue | `text-2xl` | `font-bold` |
| Judul section (H2) | Epilogue | `text-lg` | `font-semibold` |
| Body/isi tabel (teks) | Work Sans | `text-sm` | `font-normal` |
| Label form | Work Sans | `text-sm` | `font-medium` |
| **Kolom angka di tabel** (quantity, costPrices, _id) | **JetBrains Mono** | `text-sm` | `font-normal` |
| Caption/timestamp | Work Sans | `text-xs` | `font-normal`, warna `muted` |

**Aturan khusus:** JetBrains Mono dipakai HANYA untuk data numerik/kode di tabel (bukan body text biasa) — supaya angka sejajar rapi dan gampang di-scan, konsisten di semua tabel (Inventory, SubInventory, Transaksi, dst).

---

## 4. Bentuk & Spacing

| Elemen | Aturan |
| --- | --- |
| Border radius default | `rounded-lg` |
| Radius tombol | `rounded-md` |
| Spacing antar section | `gap-6` |
| Padding card/container | `p-6` (container utama), `p-4` (sel dalam tabel) |
| Lebar sidebar | `w-64`, fixed, min-width app `1280px` |
| Icon library | `lucide-react` |
| Ukuran icon | 16px inline, 20px tombol, stroke-width 2 |

---

## 5. Komponen & State (Referensi ke shadcn/ui yang Sudah Ada)

Karena base komponen sudah `shadcn/ui`, DESIGN.md ini **tidak mendefinisikan ulang** tampilan Button/Input/Dialog dari nol — cukup catat **penyesuaian** dari default shadcn (kalau ada):

- Tombol primary pakai warna `#F97316`, bukan default shadcn slate
- Semua tabel pakai style striped/zebra, header sticky di atas

**State yang wajib konsisten di semua komponen interaktif:**

| State | Aturan |
|---|---|
| Hover | Ikuti default shadcn (opacity/shade shift bawaan) — tidak ada override khusus |
| Active/pressed | Ikuti default shadcn |
| Disabled (karena role/permission) | Elemen **disembunyikan total**, tidak dirender — bukan ditampilkan abu-abu |
| Disabled (karena kondisi data, misal `sufficient: false`) | Elemen tetap tampil, `opacity-50 cursor-not-allowed` (default shadcn disabled), **wajib disertai teks kecil di bawahnya** menjelaskan alasan |
| Focus ring | `ring-orange-500/40` |
| Empty & loading state | Teks + 1 ikon lucide sederhana, tanpa ilustrasi custom, warna icon = `muted` |

---

## 5b. Pola State Khusus (Keputusan Final)

- **Warning banner** (`hasUnsafeBatch`, non-blocking): card dengan border kiri tebal warna `warning` (`#B45309`), ikon segitiga peringatan (lucide `triangle-alert`), teks singkat penjelasan. **Bukan toast** — karena harus tetap kelihatan selama user ada di halaman itu, tidak boleh hilang otomatis.
- **Disabled berbasis data vs permission**: lihat tabel di Section 5 di atas — dua kasus ini **beda perlakuan visual**, bukan cuma beda alasan di baliknya.
- **Strikethrough + badge `isReversed: true`**: teks baris pakai `line-through` warna `muted`, ditambah badge kecil warna neutral bertuliskan "Dibatalkan" di ujung baris. Kombinasi ini dipakai bersamaan, bukan salah satu saja.
- **Em-dash (`—`) untuk null value** (`quantityTotal: null`, `expired: null` pada kategori packaging): warna teks `muted`, font tetap JetBrains Mono mengikuti kolom aslinya (biar tidak "loncat" visual).
- **Error inline vs toast**: aturan pembagi — error yang terikat ke 1 field spesifik (400 validasi, 409 duplikat nama) → **tampil inline di bawah field itu**. Error yang tidak terikat 1 field atau soal hasil aksi keseluruhan (409 gagal arsip karena masih ada batch aktif, network error) → **toast**.

---

## 6. Layout Dasar (Desktop/Monitor-only)

- Target device: monitor/desktop, **bukan mobile-first** — lebar minimum yang didukung: `1280px`
- Struktur umum: sidebar navigasi kiri (fixed) + header atas + area konten
- Tabel adalah komponen utama di banyak halaman (sesuai sifat app inventory) — prioritaskan keterbacaan data padat, bukan visual dekoratif berlebihan

---

## 7. Ikon

Sudah didefinisikan di Section 4: library `lucide-react`, ukuran 16px (inline) / 20px (tombol), stroke-width 2.

---

## 8. Yang TIDAK Boleh Berubah Tanpa Diskusi Tim

- Warna badge status (section 2) — karena langsung terhubung ke makna data dari API contract
- Struktur layout sidebar+header (section 6) — karena semua halaman menempel ke ini

---

### Cara Pakai Dokumen Ini di 3 Tempat

1. **Di Stitch:** pilih layar → Modify → Design System → tempel isi Section 1-4 ke kolom DESIGN.md, dan warna di Section 2 ke Theme.
2. **Di Antigravity:** lampirkan file ini utuh di prompt pertama tiap sesi baru, sebelum minta generate komponen apapun.
3. **Di kode:** jadikan acuan saat setup `tailwind.config.js` dan variabel tema shadcn (`components/ui/`) — supaya token warna yang di-generate shadcn (`npx shadcn init`) disesuaikan manual mengikuti Section 2, bukan dibiarkan default.