-- ============================================================
-- MIGRASI v4: jalankan di SQL Editor Supabase (setelah migrasi v3)
-- ============================================================

-- Kelas yang diampu tiap guru (dipakai untuk membatasi pilihan kelas/mapel/TP)
alter table users add column if not exists class_ids jsonb default '[]';

-- Field kop surat tambahan (baris "Pemerintah Kota..." dan "Dinas Pendidikan...")
alter table school_config add column if not exists government_line1 text default '';
alter table school_config add column if not exists government_line2 text default '';
