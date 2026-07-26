-- ============================================================
-- Aplikasi Jurnal Harian Guru - Supabase Schema
-- Jalankan seluruh file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1. Konfigurasi Sekolah (single row)
create table if not exists school_config (
  id int primary key default 1,
  school_name text not null default '',
  npsn text default '',
  address text default '',
  phone text default '',
  email text default '',
  website text default '',
  logo_url text default '',
  city_logo_url text default '',
  headmaster_name text default '',
  headmaster_nip text default '',
  city text default '',
  province text default '',
  constraint single_row check (id = 1)
);

-- 2. Pengguna (admin & guru)
create table if not exists users (
  id text primary key,
  name text not null,
  nip text default '',
  email text default '',
  role text not null check (role in ('admin', 'teacher')),
  subject text,
  avatar text,
  phone text
);

-- 3. Kelas
create table if not exists classes (
  id text primary key,
  name text not null,
  grade text not null,
  academic_year text not null,
  homeroom_teacher_id text references users(id) on delete set null,
  student_count int default 0
);

-- 4. Siswa
create table if not exists students (
  id text primary key,
  class_id text references classes(id) on delete cascade,
  nisn text default '',
  name text not null,
  gender text check (gender in ('L', 'P'))
);

-- 5. Tujuan Pembelajaran (TP)
create table if not exists learning_objectives (
  id text primary key,
  subject text not null,
  grade text not null,
  code text not null,
  description text default ''
);

-- 6. Jurnal Harian
create table if not exists journal_entries (
  id text primary key,
  date date not null,
  time_slot text,
  teacher_id text references users(id) on delete set null,
  teacher_name text,
  class_id text references classes(id) on delete set null,
  class_name text,
  subject text,
  tp_ids jsonb default '[]',
  tp_descriptions jsonb default '[]',
  summary text,
  attendance jsonb default '{}',
  attendance_summary jsonb default '{}',
  incidents jsonb default '[]',
  photo_url text,
  photo_drive_id text,
  photo_file_name text,
  sync_status text default 'synced',
  created_at timestamptz default now()
);

-- 7. Log Pengingat
create table if not exists reminders (
  id text primary key,
  teacher_id text references users(id) on delete set null,
  teacher_name text,
  date date,
  channel text check (channel in ('whatsapp', 'email', 'in_app')),
  message text,
  sent_at timestamptz default now(),
  status text default 'sent'
);

-- 8. Pengaturan aplikasi (mis. URL Google Apps Script opsional)
create table if not exists app_settings (
  key text primary key,
  value text
);

-- ============================================================
-- Row Level Security
-- CATATAN PENTING: skema di bawah ini membuka akses baca/tulis
-- untuk siapa pun yang memegang "anon key" (kunci publik di frontend),
-- karena aplikasi ini belum punya sistem login sungguhan (Supabase Auth).
-- Ini setara dengan level keamanan localStorage sebelumnya, hanya saja
-- sekarang datanya dibagikan ke semua pengguna, bukan tersimpan per-device.
-- Kalau nanti mau menambahkan login asli per guru, RLS ini perlu diperketat.
-- ============================================================

alter table school_config enable row level security;
alter table users enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table learning_objectives enable row level security;
alter table journal_entries enable row level security;
alter table reminders enable row level security;
alter table app_settings enable row level security;

create policy "public read/write school_config" on school_config for all using (true) with check (true);
create policy "public read/write users" on users for all using (true) with check (true);
create policy "public read/write classes" on classes for all using (true) with check (true);
create policy "public read/write students" on students for all using (true) with check (true);
create policy "public read/write learning_objectives" on learning_objectives for all using (true) with check (true);
create policy "public read/write journal_entries" on journal_entries for all using (true) with check (true);
create policy "public read/write reminders" on reminders for all using (true) with check (true);
create policy "public read/write app_settings" on app_settings for all using (true) with check (true);

-- ============================================================
-- Storage bucket untuk logo sekolah & logo pemerintah kota/kabupaten
-- (dipakai di kop surat). Publik dibaca (agar tampil di aplikasi),
-- publik ditulis (karena aplikasi ini belum punya login sungguhan).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "public upload logos" on storage.objects
  for insert with check (bucket_id = 'logos');

create policy "public update logos" on storage.objects
  for update using (bucket_id = 'logos');

-- ============================================================
-- Seed data awal (opsional - boleh dihapus/diedit sesuai sekolahmu)
-- ============================================================
insert into school_config (id, school_name) values (1, 'Nama Sekolah Anda')
  on conflict (id) do nothing;

insert into users (id, name, nip, email, role) values
  ('usr-admin', 'Administrator', '-', 'admin@sekolah.sch.id', 'admin')
  on conflict (id) do nothing;
