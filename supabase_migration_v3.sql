-- ============================================================
-- MIGRASI: jalankan ini di SQL Editor Supabase kamu (satu kali saja)
-- Aman dijalankan walau sebagian sudah ada (pakai IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. Kolom baru di users: multi-mapel + login
alter table users add column if not exists subjects jsonb default '[]';
alter table users add column if not exists password_hash text;
alter table users add column if not exists must_change_password boolean default true;

-- Isi subjects dari kolom subject lama (kalau masih kosong)
update users set subjects = jsonb_build_array(subject) where subjects = '[]' and subject is not null and subject <> '';

-- Set semua akun yang belum punya password supaya bisa login pertama kali
update users set password_hash = 'CHANGE_ON_FIRST_LOGIN', must_change_password = true where password_hash is null;

-- 2. Tabel Jenis Penilaian
create table if not exists grade_types (
  id text primary key,
  class_id text references classes(id) on delete cascade,
  subject text not null,
  name text not null,
  weight numeric default 0,
  teacher_id text references users(id) on delete set null,
  semester text default 'Ganjil',
  academic_year text default ''
);
alter table grade_types enable row level security;
drop policy if exists "public read/write grade_types" on grade_types;
create policy "public read/write grade_types" on grade_types for all using (true) with check (true);

-- 3. Tabel Nilai
create table if not exists grades (
  id text primary key,
  student_id text references students(id) on delete cascade,
  class_id text references classes(id) on delete cascade,
  subject text not null,
  grade_type_id text references grade_types(id) on delete cascade,
  assessment_name text not null,
  score numeric not null,
  date date,
  tp_id text references learning_objectives(id) on delete set null,
  teacher_id text references users(id) on delete set null,
  semester text default 'Ganjil',
  academic_year text default ''
);
alter table grades enable row level security;
drop policy if exists "public read/write grades" on grades;
create policy "public read/write grades" on grades for all using (true) with check (true);

-- Selesai. Setelah ini jalankan lagi query terpisah di bawah untuk verifikasi:
-- select id, name, email, subjects, password_hash from users;
