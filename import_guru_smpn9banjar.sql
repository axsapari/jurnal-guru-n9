-- ============================================================
-- IMPOR DATA GURU dari file Excel Dapodik
-- SMP NEGERI 9 BANJAR — jalankan di SQL Editor Supabase
-- Aman dijalankan ulang (ON CONFLICT DO NOTHING, tidak akan duplikat)
--
-- CATATAN: Agus Sugiharto Sapari (axsapari@gmail.com) SENGAJA dikecualikan
-- dari daftar ini karena sepertinya itu akun admin yang sudah kamu pakai.
--
-- Semua guru diimpor dengan:
--   - role = 'teacher' (admin bisa ubah ke admin lewat menu Kelola Guru kalau perlu)
--   - mata pelajaran & kelas yang diampu masih KOSONG (isi manual lewat Edit Guru,
--     karena data Excel Dapodik ini tidak mencantumkan mata pelajaran)
--   - password belum diset (guru akan membuat password sendiri saat login pertama kali)
-- ============================================================

insert into users (id, name, nip, email, role, subjects, class_ids, avatar, phone, password_hash, must_change_password)
values
  ('usr-imp-89112001', 'Enung Nuryani', '196801101989112001', 'enungnuryani1968@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '088218518411', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-06041011', 'Hendi Herdiana', '197005252006041011', 'hendiherdiana1@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '08112111255', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-09022005', 'A''i Dahlia', '198104152009022005', 'ai.dahlia82@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '081329206467', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-09021002', 'Rendra Heryana Putra', '198605312009021002', 'rendrahp86@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '088218350867', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-24211002', 'Saeful Ramdhan', '198801052024211002', 'saefulramdhan37@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '081323485991', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-24212003', 'Euis Hidayah', '198512032024212003', 'euishidayah52@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '082116418040', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-19032002', 'Kurnia Yunita', '198406282019032002', 'kurniayunita15@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '082246092288', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-19032003', 'Sriyatun', '198503202019032003', 'sriyatunpurwanto85@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '085822994442', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-19032006', 'Ida Nurjanah', '198704202019032006', 'ida.nurjanah2004@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '081394453944', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-19031007', 'Tri Feby Adinsyah', '199102182019031007', 'trifeby.a@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '085311349850', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-24212006', 'WIJI SEPTIANI', '198909212024212006', 'wijicakrayana@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '082118102889', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-20121003', 'Arko Susanto', '198904072020121003', 'arkosusanto1612@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '085603006003', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-20122011', 'Alia Zakiyah', '199405162020122011', 'aliazakiyah1605@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '087826524349', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-20122006', 'Eti Sofiyati', '199510312020122006', 'sofiyatieti@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '082316512755', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-23212008', 'Gita Annisa Nursyahnaz', '199712202023212008', 'gita.syahnaz@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '089665021036', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-24212007', 'Ayu Resti Lestari', '199001082024212007', 'ayurestilestari@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '081223289353', 'CHANGE_ON_FIRST_LOGIN', true),
  ('usr-imp-24211003', 'MOCHAMMAD FERNANDA AL WALI', '199906072024211003', 'fernanda17alwali@gmail.com', 'teacher', '[]'::jsonb, '[]'::jsonb, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '083116607703', 'CHANGE_ON_FIRST_LOGIN', true)
on conflict (id) do nothing;
