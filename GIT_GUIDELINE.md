# GIT_GUIDELINE.md — Setup & Aturan Git untuk Tim

Panduan ini dipakai bareng `CONVENTIONS.md`. File ini fokus ke: setup repo, aturan commit, aturan branch, dan command install project.

---

## 1. Setup Awal Repo (dikerjakan 1 orang, sekali saja)

```bash
# Buat project Vite + React
npm create vite@latest nama-project -- --template react

cd nama-project
npm install

# Init git & first commit
git init
git add .
git commit -m "chore: initial commit dari vite template"

# Buat repo di GitHub dulu (lewat web, tanpa README/gitignore — biar tidak konflik),
# lalu hubungkan:
git remote add origin https://github.com/[org-atau-username]/nama-project.git
git branch -M main
git push -u origin main

# Buat branch develop sebagai base kerja harian
git checkout -b develop
git push -u origin develop
```

**Struktur branch dasar:**
- `main` — HANYA untuk versi yang sudah stabil/final (misal buat demo/submit). Tidak ada push langsung ke sini.
- `develop` — branch utama tempat semua fitur digabung. Semua `feature/...` bermuara ke sini.
- `feature/...` — kerjaan harian, 1 branch per fitur.

---

## 2. Install Semua Dependency Project

Jalankan berurutan setelah clone repo:

```bash
# Masuk ke folder project
cd nama-project
npm install

# Tailwind CSS (versi stabil terbaru)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui
npx shadcn@latest init

# Routing
npm install react-router-dom

# HTTP client
npm install axios

# Validasi form
npm install zod

# State management
npm install zustand

# Real-time
npm install socket.io-client

# Linting & formatting (jaga konsistensi kode antar developer)
npm install -D eslint prettier eslint-config-prettier
```

**Catatan setup `.env`:**
```bash
# Buat file .env di root project (JANGAN di-commit, sudah ada di .gitignore Vite default)
VITE_API_URL=http://localhost:5000
```

---

## 3. Alur Kerja Harian (Branching)

```bash
# Selalu mulai dari develop yang terbaru
git checkout develop
git pull origin develop

# Buat branch baru untuk fitur yang dikerjakan
git checkout -b feature/kasir-transaksi

# ... kerja, commit beberapa kali ...

# Push branch ke GitHub
git push -u origin feature/kasir-transaksi

# Buka Pull Request: feature/kasir-transaksi → develop (lewat GitHub, bukan CLI)
# Minta minimal 1 orang lain review sebelum merge
```

**Penamaan branch:**
| Tipe | Format | Contoh |
|---|---|---|
| Fitur baru | `feature/[nama-fitur]` | `feature/admin-produk` |
| Perbaikan bug | `fix/[nama-bug]` | `fix/login-redirect-error` |
| Perubahan kecil/config | `chore/[deskripsi]` | `chore/setup-eslint` |

Gunakan huruf kecil semua dan tanda hubung (`-`), bukan spasi atau underscore.

---

## 4. Aturan Commit Message

Format: `[tipe]: [deskripsi singkat, present tense, huruf kecil]`

| Tipe | Kapan dipakai | Contoh |
|---|---|---|
| `feat` | Nambah fitur/komponen baru | `feat: tambah halaman transaksi kasir` |
| `fix` | Perbaikan bug | `fix: perbaiki validasi form login` |
| `style` | Ubah tampilan/styling saja, tanpa ubah logic | `style: rapikan spacing dashboard admin` |
| `refactor` | Rapikan/restruktur kode tanpa ubah fungsi | `refactor: pindahkan logic fetch ke services/api.js` |
| `chore` | Setup, config, dependency, hal non-fitur | `chore: install zod dan zustand` |
| `docs` | Update dokumentasi | `docs: update CONVENTIONS.md` |

**Aturan tambahan:**
- 1 commit = 1 perubahan logis. Jangan gabung "tambah fitur A + perbaiki bug B" dalam 1 commit.
- Deskripsi pakai present tense: `tambah`, bukan `menambahkan` atau `menambah`.
- Commit sesering mungkin selama kerja (tiap selesai 1 langkah kecil), jangan ditumpuk jadi 1 commit besar di akhir — supaya kalau ada masalah, gampang dilacak commit mana penyebabnya.

---

## 5. Aturan Pull Request

**Judul PR:** sama formatnya dengan commit, misal `feat: halaman kelola produk admin`

**Isi deskripsi PR (template singkat):**
```markdown
## Apa yang berubah
- [ringkas fitur/perbaikan]

## Cara test
- [langkah singkat buat reviewer coba]

## Checklist
- [ ] Sudah reuse komponen shared yang ada (tidak bikin ulang)
- [ ] Sudah ikut struktur folder & naming di CONVENTIONS.md
- [ ] Sudah dicoba jalan di local, tidak ada error di console
```

**Aturan merge:**
- Minimal 1 approval sebelum merge ke `develop`.
- Reviewer fokus cek 2 hal (biar cepat): reuse komponen yang sudah ada, dan ikut convention folder/naming.
- Yang bikin PR **tidak boleh** merge PR sendiri tanpa direview, kecuali kondisi darurat & sudah diinfokan ke grup.

---

## 6. Command Cepat Referensi

```bash
git status                          # cek perubahan
git add .                           # stage semua perubahan
git commit -m "feat: ..."           # commit
git push                            # push branch aktif
git pull origin develop             # tarik update terbaru dari develop
git checkout develop && git pull    # pindah ke develop + update
git checkout -b feature/nama-baru   # bikin branch baru dari posisi sekarang
git log --oneline -10                # lihat 10 commit terakhir, ringkas
```

---

### Checklist Setup Hari Pertama (per developer)
- [ ] Clone repo, `npm install`
- [ ] Buat `.env` sendiri (isi `VITE_API_URL` sesuai instruksi tim)
- [ ] Jalankan `npm run dev`, pastikan project jalan tanpa error
- [ ] Baca `CONVENTIONS.md` dan file ini sampai selesai
- [ ] Konfirmasi ke PM/tim kalau sudah siap mulai ambil task pertama
