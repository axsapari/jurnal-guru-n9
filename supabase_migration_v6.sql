-- ============================================================
-- MIGRASI v6: jalankan di SQL Editor Supabase (setelah v3, v4, v5)
-- Menambahkan: nomor WA orang tua siswa (untuk notifikasi kehadiran)
-- ============================================================

alter table students add column if not exists parent_phone text default '';

-- (Semester/Tahun Ajaran aktif memakai tabel app_settings yang sudah ada,
-- tidak perlu tabel/kolom baru.)
