# Panduan Tugas Proyek: ModernStore Modernization

Selamat datang di proyek ModernStore! Tugas Anda adalah mentransformasikan kerangka aplikasi ini menjadi toko online yang fungsional, estetik, dan siap produksi.

---

## Fase 1: Konsep & Branding
Sebelum mulai coding, tentukan identitas toko Anda:
1.  **Tentukan Tema Toko:** Anda ingin menjual apa? (Contoh: Toko Baju, Toko Gadget, Toko Tanaman, Toko Perabot Luxury, dll).
2.  **Color Palette:** Tentukan setidaknya 3 warna utama (Primary, Secondary, Accent) yang mencerminkan brand Anda.
3.  **Typography:** Pilih font dari Google Fonts dan terapkan di `tailwind.config.ts`.
4.  **Logo & Assets:** Siapkan logo minimalis (bisa menggunakan teks atau SVG sederhana) dan aset gambar produk yang relevan.

---

## Fase 2: Implementasi Halaman Publik
Lengkapi bagian-bagian yang masih berupa "Canvas Kosong":

### 1. Homepage (`app/(public)/page.tsx`)
- Implementasikan section **Featured Categories**.
- Implementasikan section **Best Sellers** (Tampilkan 3-4 produk unggulan).
- Implementasikan section **Trust Signals** (Free Shipping, Secure Payment, etc).

### 2. About Page (`app/(public)/about/page.tsx`)
- Bangun narasi brand di bagian "Our Story".
- Buat section "Our Mission" dan "Core Values" menggunakan Lucide Icons.
- Tambahkan section "Meet the Team".

### 3. Contact Page (`app/(public)/contact/page.tsx`)
- Implementasikan Information Grid (Email, Phone, Address).
- Bangun **Contact Form** yang fungsional (kelola state menggunakan React Hooks).
- Tambahkan Google Maps embed untuk lokasi toko.

---

## Fase 3: Logika Keranjang (Cart)
Buka file `lib/store/cart.ts` dan selesaikan fungsi-fungsi yang masih kosong:
- **`addItem`**: Tambahkan logika untuk menggabungkan item yang sama (update quantity).
- **`removeItem`**: Hapus item dari keranjang.
- **`updateQuantity`**: Ubah jumlah item.
- **`clearCart`**: Kosongkan seluruh keranjang.

---

## Fase 4: Integrasi API & Backend
Ini adalah bagian terpenting untuk memisahkan Frontend dan Backend:
1.  Buka semua file di `app/api/` (products, articles, users, orders).
2.  Ganti pembacaan file lokal (`readFileSync`) dengan pemanggilan API eksternal menggunakan `fetch`.
3.  Konfigurasikan `BACKEND_API_URL` di file `.env`.
4.  Pastikan semua method (GET, POST, PATCH, DELETE) terhubung dengan benar ke backend Anda yang terpisah.

---

## Fase 5: Admin CMS & CRUD
Ini adalah tugas untuk mengelola data toko Anda:

### 1. Product Management
- **Add Product (`/admin/products/new`):** Buat halaman form untuk menambah produk baru.
- **Edit Product (`/admin/products/[id]`):** Buat halaman untuk mengedit produk yang sudah ada.
- **Delete Logic:** Pastikan tombol hapus di tabel produk berfungsi (hubungkan ke API DELETE).

### 2. Article Management
- **Add/Edit Article:** Buat form untuk mengelola konten blog/artikel.
- **Image Upload:** (Opsional) Implementasikan cara mengunggah atau memasukkan URL gambar untuk artikel.

### 3. User & Order Management
- **User List:** Tampilkan daftar user dan tambahkan fitur untuk mengaktifkan/nonaktifkan user.
- **Order Details:** Buat halaman detail untuk melihat isi pesanan pelanggan (Items, Total, Customer Info).

### 4. Form Validation & UX
- Gunakan library seperti `react-hook-form` dan `zod` untuk validasi input.
- Tambahkan loading state dan toast notification (sudah disediakan `sonner`) saat operasi simpan/hapus berhasil.

---

## Fase 6: Middleware & Security
Amankan aplikasi Anda agar tidak semua orang bisa masuk ke area admin:
1.  **Middleware Implementation:** Buat file `middleware.ts` di root project.
2.  **Route Protection:** Gunakan middleware untuk memproteksi path `/admin/:path*`. Redirect user ke `/auth/login` jika belum terautentikasi.
3.  **Role Validation:** (Opsional) Tambahkan pengecekan role 'admin' di dalam token/session sebelum mengizinkan akses ke dashboard.

---

## Fase 7: Checkout & Fulfillment
Selesaikan alur belanja hingga pesanan tersimpan:
1.  **Checkout Flow:** Lengkapi halaman `app/(public)/checkout` dengan form Shipping Address dan Payment Method.
2.  **Order Persistence:** Saat tombol "Place Order" diklik, panggil endpoint `POST /api/orders` untuk menyimpan data pesanan secara permanen.
3.  **Success Page:** Buat halaman konfirmasi setelah pesanan berhasil dibuat (Order Success).

---

## Fase 8: Polish & Performance
Sentuhan akhir untuk website profesional:
1.  **Global Search:** Implementasikan bar pencarian di Header yang bisa memfilter produk secara real-time.
2.  **Image Optimization:** Gunakan komponen `next/image` untuk semua gambar agar loading lebih cepat dan efisien.
3.  **SEO Metadata:** Tambahkan judul dan deksripsi unik untuk setiap halaman menggunakan `GenerateMetadata` API di Next.js.
4.  **Deployment:** Deploy project Anda ke Vercel dan pastikan semua Environment Variables (`BACKEND_API_URL`, dll) sudah terkonfigurasi.

---

## Kriteria Penilaian
- **Estetika:** Mengikuti prinsip "Quiet Luxury" (bersih, luas, elegan).
- **Resiliensi:** Aplikasi tidak crash jika data API kosong atau error.
- **Kebersihan Kode:** Penamaan variabel yang jelas dan penggunaan komponen yang reusable.
- **Fungsionalitas:** Alur dari melihat produk -> tambah ke keranjang -> checkout berjalan lancar.

**Selamat Mengerjakan! Semangat membangun masa depan e-commerce.**
