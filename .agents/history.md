# Riwayat Perubahan & Preferensi Proyek (CoffeBar)

Dokumen ini mencatat riwayat perubahan penting, preferensi teknologi, keputusan desain, dan catatan dari user. Setiap agen wajib membaca dokumen ini sebelum melakukan perubahan pada proyek.

---

## 🛠️ Preferensi Teknologi & Standardisasi Kode
* **State Management & Fetching**: Gunakan **TanStack Query (React Query)** untuk hooks pengambil data/mutasi (gunakan `mutationFn` untuk operasi write/POST/PUT/DELETE).
* **Form Handling**: Gunakan **Formik (`useFormik`)** untuk menangani input form di setiap halaman.
* **Validasi Form**: Gunakan **Yup** untuk validasi skema form. Skema validasi Yup wajib diletakkan di folder terpisah (misalnya di `src/utils/schemas.ts` atau folder khusus skema) untuk memisahkan logika validasi dari UI.
* **Toast Notification**: Gunakan **ToastContext (`useToast`)** secara terintegrasi langsung di dalam hooks (pada callback `onSuccess` atau `onError` milik TanStack Query) untuk memanggil notifikasi toast dengan UI custom bawaan yang disukai user tanpa prop-drilling.

---

## 📅 [2026-07-08] Inisialisasi Folder History & Aturan Proyek
* **Perubahan**: Membuat folder `.agents/` dan file `.agents/AGENTS.md` untuk menginstruksikan AI Agent membaca riwayat ini sebelum memulai tugas.
* **Tujuan**: Agar pengerjaan fitur/perbaikan selalu konsisten dan sesuai dengan konteks/riwayat sebelumnya.

## 📅 [2026-07-08] Refaktorisasi Global: TanStack Query & Formik
* **Perubahan**: 
  - Melakukan migrasi seluruh API custom hooks (`useAuth`, `useIngredients`, `useMenus`, `useInventory`, `useExpenses`, `usePersonalCups`, `useOrders`, `useSales`, `useReports`) ke **TanStack Query (React Query)** dengan standar `mutationFn`.
  - Melakukan migrasi seluruh penanganan form (`AuthPage`, `IngredientsPage`, `MenusPage`, `ExpensesPage`, `PersonalCupsPage`, `OrdersPage`) ke **Formik** menggunakan validasi skema **Yup** yang diletakkan terpisah di `src/utils/schemas.ts`.
* **Tujuan**: Mengimplementasikan standardisasi kode yang diminta oleh user, meningkatkan keandalan manajemen server-state, serta memisahkan logika validasi form secara teratur.

## 📅 [2026-07-08] Integrasi Toast Custom Menggunakan React Context
* **Perubahan**:
  - Membuat `ToastContext` di `src/context/ToastContext.tsx` untuk membungkus aplikasi dengan `<ToastProvider>`.
  - Mempertahankan tampilan UI visual toaster custom bawaan yang premium (border/background HSL dengan ikon centang/silang).
  - Mengintegrasikan hook `useToast` langsung ke dalam query/mutation hooks agar kode halaman bersih dan bebas dari prop-drilling `triggerToast`.
* **Tujuan**: Memenuhi preferensi user untuk tetap menggunakan desain visual toaster custom bawaan, namun dipanggil secara modular dari dalam hooks.

## 📅 [2026-07-08] Refaktorisasi Arsitektur Berbasis Fitur (Feature-Based Architecture) & Layout Separation
* **Perubahan**:
  - Memisahkan container layout global dari `App.tsx` menjadi komponen tersendiri `SidebarLayout.tsx` di `src/components/layout/`.
  - Melakukan restrukturisasi file ke arsitektur berbasis fitur (co-location) di bawah folder `src/features/[feature_name]/` yang masing-masing mengemas hooks, types, schemas, dan api.
  - Memindahkan core client request helper ke `src/lib/apiClient.ts` dan merekonstruksi `src/lib/api.ts` sebagai central hub api demi kompatibilitas ke belakang (backward compatibility).
  - Menghapus folder lama `src/hooks/`, `src/types/`, `src/api/`, dan file `src/utils/schemas.ts` yang sudah didepresiasi.
* **Tujuan**: Merapikan arsitektur folder frontend agar lebih modular, terorganisir dengan rapi, dan mudah dikelola di masa mendatang sesuai rekomendasi.

## 📅 [2026-07-08] Integrasi Structured Logger di Seluruh Service Backend (NestJS)
* **Perubahan**:
  - Mengimplementasikan `Logger` bawaan NestJS (`@nestjs/common`) di seluruh service backend: `AuthService`, `ExpensesService`, `IngredientsService`, `InventoryService`, `MenusService`, `OrdersService`, `PersonalCupsService`, `RecipesService`, `ReportsService`, dan `SalesService`.
  - Membungkus operasi database/Prisma dan validasi input yang krusial menggunakan blok `try-catch`.
  - Mencatat *error message* dan *stack trace* secara detail (`this.logger.error`) sebelum melempar kembali error tersebut ke controller.
  - Menambahkan log info sukses (`this.logger.log`) ketika transaksi berhasil (misal: pencatatan penjualan, pembuatan menu, registrasi user).
* **Tujuan**: Membantu pelacakan masalah (seperti input salah, kegagalan transaksi, constraint database) melalui log konsol backend yang jelas dan informatif.

## 📅 [2026-07-08] Integrasi Biaya Kerugian Bahan Baku (Waste/Defect) ke Laporan Keuangan
* **Perubahan**:
  - Mengubah `ReportsService` di backend untuk menghitung total akumulasi biaya bahan baku yang rusak (`type = 'WASTE'`) menggunakan metode harga beli FIFO (`totalWasteCost` dan `monthlyWasteCost`).
  - Mengurangi biaya `WASTE` tersebut dari laba bersih bulanan dan laba bersih keseluruhan (*Net Profit*).
  - Memperbarui halaman `ReportsPage.tsx` di frontend untuk menampilkan baris **"Kerugian Waste/Defect"** pada kartu Laba Rugi (Profit & Loss) agar laporan keuangan akurat.
* **Tujuan**: Memisahkan pencatatan penyesuaian audit/koreksi biasa dengan barang yang rusak/defect nyata agar kerugian dari barang defect otomatis tercatat memotong keuntungan bisnis (*Net Profit*).

## 📅 [2026-07-10] Penambahan Fitur Estimasi Porsi Menu dan Integrasi pada Form Pesanan
* **Perubahan**:
  - Menghubungkan data `menus` ke halaman `IngredientsPage.tsx` dan data `ingredients` ke halaman `OrdersPage.tsx` melalui `SidebarLayout.tsx`.
  - Menambahkan algoritma kalkulasi sisa porsi menu berbasis stok riil dan pencarian bahan pembatas (*limiting ingredient*).
  - Membangun section UI baru di halaman Kelola Bahan Baku untuk menyajikan kartu estimasi porsi menu secara interaktif dan dinamis.
  - Mengintegrasikan sisa porsi langsung pada dropdown pilihan menu utama & extra di form Pesanan (`[Sisa X porsi]`/`[HABIS]`) beserta peringatan eror validasi kuantitas yang melebihi batas stok.
* **Tujuan**: Memudahkan pengelola bar memantau stok preventif, serta membantu kasir melacak secara real-time ketersediaan porsi produk saat melayani pesanan pelanggan.

## 📅 [2026-07-11] Perbaikan Pemilihan Cup pada Log Konsumsi Pribadi
* **Perubahan**:
  - Mengubah tipe `PersonalCup` di frontend (`types.ts`) untuk menggunakan properti `useCup` (boolean) alih-alih `excludePackaging`.
  - Memperbarui tabel & list rendering pada `PersonalCupsPage.tsx` agar menggunakan `c.useCup` untuk menampilkan badge status kemasan cup gelas yang tepat.
  - Menambahkan properti `useCup` ke skema validasi `personalCupSchema` di `schemas.ts`.
* **Tujuan**: Menyelaraskan field parameter frontend dengan skema database backend sehingga status penggunaan kemasan (cup) pada konsumsi internal tersimpan dan ter-render dengan benar di UI.

## 📅 [2026-07-12] Penambahan Fitur Simulasi Stok & Estimator Bahan Baku
* **Perubahan**:
  - Membuat halaman baru `EstimatorPage.tsx` di `src/features/estimator/` yang menghitung total kebutuhan bahan baku kumulatif dari beberapa menu pilihan beserta kuantitas simulasi.
  - Membandingkan kebutuhan bahan baku kumulatif secara real-time dengan stok saat ini di database.
  - Menampilkan status ketersediaan stok (cukup vs kurang) serta nominal defisit per bahan baku yang tidak mencukupi.
  - Menghitung total estimasi HPP bahan baku untuk batch menu simulasi.
  - Mendaftarkan halaman baru tersebut di sidebar navigasi layout utama (`SidebarLayout.tsx`) di bawah section Operasional.
* **Tujuan**: Memungkinkan pengelola bar memprediksi kelayakan pengerjaan pesanan kustom berskala besar/pembelian borongan dengan melacak kesiapan sisa stok bahan baku secara dinamis.

## 📅 [2026-07-12] Implementasi Modul Stock Reservation & Complete Order Flow (Phase 1)
* **Perubahan**:
  - Membuat model `StockReservation`, `CashReconciliation`, dan `IngredientPriceHistory` di `schema.prisma` serta menerapkannya menggunakan `prisma db push`.
  - Mengimplementasikan logic stock reservation di `OrdersService` yang mengalkulasi kebutuhan bahan resep secara dinamis saat order dibuat (`create`) atau diperbarui (`update`).
  - Memperbarui proses penyelesaian pesanan (`complete`) agar berjalan dalam satu transaksi database, menghapus reservasi, memotong stok fisik secara FIFO, mendukung pencatatan metode/status pembayaran, serta menerapkan idempotency check.
  - Memperbarui halaman kelola Bahan Baku (`IngredientsPage.tsx`) untuk menampilkan *Stok Fisik*, *Reserved*, *Tersedia*, dan *Safety Stock*.
  - Menyesuaikan dropdown porsi menu pesanan (`OrdersPage.tsx`) agar divalidasi berdasarkan *Stok Tersedia* (Stok Fisik - Reserved).
  - Menulis integration test lengkap untuk Phase 1 di `orders.service.spec.ts`.
* **Tujuan**: Memastikan data transaksi pesanan, stok bahan, dan keuangan terintegrasi secara aman, transparan, dan tidak terjadi *double counting*.

## 📅 [2026-07-12] Implementasi Saran Belanja, Kas Aman Ditarik & Rekonsiliasi Kas (Phase 2)
* **Perubahan**:
  - Menambahkan sub-tab **Rekomendasi Belanja** di halaman Pengeluaran (`ExpensesPage.tsx`) yang mengalkulasi kebutuhan belanja secara dinamis berdasarkan target stok (safety stock / minimum stock) dikurangi stok tersedia (fisik - reserved), menyertakan status prioritas belanja (*Mendesak*, *Perlu segera*, *Aman*), masukan input inline safety stock, serta fitur checkbox "Gunakan Rekomendasi Terpilih" untuk mempre-populasi form belanja.
  - Menambahkan widget **Kalkulator Kas Aman Ditarik** di halaman Laporan Keuangan (`ReportsPage.tsx`) yang menghitung kas dingin yang aman diambil owner dengan memperhitungkan cadangan belanja bahan kritis dan buffer operasional yang dapat disesuaikan (disimpan di `localStorage`).
  - Membuat modul **Rekonsiliasi Kas / Tutup Hari** di backend (`ReconciliationsService` & `ReconciliationsController`) dan mendaftarkannya di `AppModule`.
  - Mengimplementasikan halaman **Rekonsiliasi Kas** (`ReconciliationsPage.tsx`) lengkap dengan log audit selisih kas, pilihan alasan selisih, dan checkbox penyesuaian otomatis (yang membuat record Expense/Sale penyeimbang stok-free secara otomatis di database).
  - Menghubungkan log rekonsiliasi kas ke **Dashboard** (`DashboardPage.tsx`) melalui indikator ringkasan audit kas (Terakhir Direkonsiliasi, Selisih Terakhir, Status Kas).
  - Menambahkan integration test suite lengkap untuk rekonsiliasi kas di `reconciliations.service.spec.ts`.
* **Tujuan**: Memberikan rekomendasi belanja stok yang efisien berbasis sisa stok riil, serta membantu pemilik memantau dan meminimalkan selisih kas fisik laci kas dan kas tercatat sistem secara aman.

## 📅 [2026-07-12] Implementasi Filter Laporan Global & Analisis Konsumsi Pribadi (Phase 3)
* **Perubahan**:
  - Meng-upgrade endpoint `getReports` di backend (`ReportsService` & `ReportsController`) untuk menerima query parameters `startDate` dan `endDate`, memfilter pencarian database, serta menghitung komparasi metrik finansial (Pendapatan & Profit) terhadap periode sebelumnya secara aman dari pembagian dengan 0.
  - Memperbarui file `types.ts` milik fitur `personal-cups` di frontend dengan menambahkan field `staffName`.
  - Mengimplementasikan **Date Filter Bar** global di halaman Laporan Keuangan (`ReportsPage.tsx`) yang memperbarui metrik keuangan secara dinamis melalui local fetch yang terisolasi.
  - Menampilkan **indikator persentase pertumbuhan** di dalam KPI cards Laba Rugi dan Gross Profit jika filter tanggal aktif.
  - Menambahkan grafik visualisasi **Tren Keuangan Harian (Sales vs Net Cash Flow)** berbasis Recharts yang reaktif terhadap filter tanggal di halaman Laporan Keuangan.
  - Menambahkan widget **Analisis Konsumsi Staf & Owner** di bawah Laporan Keuangan yang menyajikan data konsumsi internal staf (dikategorikan per nama staf dan per produk terpopuler) lengkap dengan konfigurasi budget bulanan dan peringatan visual (*Alert Banner*) jika budget terlampaui.
  - Menulis integration test lengkap untuk laporan filter tanggal di `reports.service.spec.ts`.
* **Tujuan**: Memberikan transparansi analitik yang dinamis bagi pemilik kedai kopi untuk mengukur pertumbuhan pendapatan periode-ke-periode dan mengontrol kebocoran HPP akibat konsumsi internal staf secara sistematis.



