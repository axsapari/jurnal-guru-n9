-- ============================================================
-- MIGRASI v7: jalankan di SQL Editor Supabase (setelah v3-v6)
-- Menambahkan: tipe entri jurnal (mengajar vs kegiatan lain)
-- ============================================================

alter table journal_entries add column if not exists entry_type text default 'mengajar';
