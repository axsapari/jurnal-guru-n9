-- ============================================================
-- MIGRASI v8: jalankan di SQL Editor Supabase (setelah v3-v7)
-- Menambahkan: status "selesai" untuk Tujuan Pembelajaran (TP)
-- ============================================================

alter table learning_objectives add column if not exists completed boolean default false;
