-- ============================================================
-- MIGRASI v5: jalankan di SQL Editor Supabase (setelah migrasi v3 & v4)
-- Menambahkan: Keaktifan Siswa, Kalender & Jadwal Mengajar
-- ============================================================

-- Keaktifan / Partisipasi Siswa
create table if not exists participations (
  id text primary key,
  student_id text references students(id) on delete cascade,
  class_id text references classes(id) on delete cascade,
  date date,
  score numeric default 0,
  teacher_id text references users(id) on delete set null,
  semester text default 'Ganjil',
  academic_year text default ''
);
alter table participations enable row level security;
drop policy if exists "public read/write participations" on participations;
create policy "public read/write participations" on participations for all using (true) with check (true);

-- Jadwal Mengajar Guru (hasil impor Excel)
create table if not exists teaching_schedule (
  id text primary key,
  teacher_id text references users(id) on delete cascade,
  class_id text references classes(id) on delete cascade,
  subject text not null,
  day_of_week int not null,
  time_slot text not null,
  academic_year text default ''
);
alter table teaching_schedule enable row level security;
drop policy if exists "public read/write teaching_schedule" on teaching_schedule;
create policy "public read/write teaching_schedule" on teaching_schedule for all using (true) with check (true);
