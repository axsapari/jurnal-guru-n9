import { User, SchoolConfig, ClassRoom, Student, LearningObjective, JournalEntry } from '../types';

export const INITIAL_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'SMP NEGERI 1 NUSANTARA',
  npsn: '20234567',
  address: 'Jl. Pendidikan Merdeka No. 45, Kecamatan Cerdas, Kota Pendidikan',
  phone: '(021) 555-0199',
  email: 'info@smpn1nusantara.sch.id',
  website: 'www.smpn1nusantara.sch.id',
  logoUrl: 'https://images.unsplash.com/photo-1599584385967-826ef237c179?auto=format&fit=crop&w=200&q=80',
  headmasterName: 'Drs. H. Ahmad Wijaya, M.Pd.',
  headmasterNip: '19680315 199303 1 004',
  city: 'Kota Pendidikan',
  province: 'Jawa Barat'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Drs. H. Ahmad Wijaya, M.Pd.',
    nip: '19680315 199303 1 004',
    email: 'kepala@smpn1nusantara.sch.id',
    role: 'admin',
    subject: 'Manajemen Sekolah / Kepala Sekolah',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-1',
    name: 'Siti Rahmawati, S.Pd.',
    nip: '19850412 200902 2 008',
    email: 'siti.rahmawati@smpn1nusantara.sch.id',
    role: 'teacher',
    subject: 'Matematika',
    phone: '081398765432',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-2',
    name: 'Budi Santoso, M.Pd.',
    nip: '19821105 200801 1 012',
    email: 'budi.santoso@smpn1nusantara.sch.id',
    role: 'teacher',
    subject: 'Bahasa Indonesia',
    phone: '081211223344',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-3',
    name: 'Dewi Lestari, S.Si.',
    nip: '19900218 201403 2 005',
    email: 'dewi.lestari@smpn1nusantara.sch.id',
    role: 'teacher',
    subject: 'IPA (Ilmu Pengetahuan Alam)',
    phone: '081566778899',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-4',
    name: 'Rahmat Hidayat, S.Pd.',
    nip: '19880825 201201 1 003',
    email: 'rahmat.hidayat@smpn1nusantara.sch.id',
    role: 'teacher',
    subject: 'PJOK',
    phone: '081799887766',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'cls-7a', name: '7A', grade: '7', academicYear: '2025/2026', homeroomTeacherId: 'usr-1', studentCount: 30 },
  { id: 'cls-7b', name: '7B', grade: '7', academicYear: '2025/2026', homeroomTeacherId: 'usr-2', studentCount: 28 },
  { id: 'cls-8a', name: '8A', grade: '8', academicYear: '2025/2026', homeroomTeacherId: 'usr-3', studentCount: 32 },
  { id: 'cls-8b', name: '8B', grade: '8', academicYear: '2025/2026', homeroomTeacherId: 'usr-4', studentCount: 30 },
  { id: 'cls-9a', name: '9A', grade: '9', academicYear: '2025/2026', homeroomTeacherId: 'usr-1', studentCount: 31 }
];

export const INITIAL_STUDENTS: Student[] = [
  // Kelas 7A
  { id: 'std-7a-1', classId: 'cls-7a', nisn: '0098765001', name: 'Aditya Pratama', gender: 'L' },
  { id: 'std-7a-2', classId: 'cls-7a', nisn: '0098765002', name: 'Anisa Rahmawati', gender: 'P' },
  { id: 'std-7a-3', classId: 'cls-7a', nisn: '0098765003', name: 'Bagas Kurniawan', gender: 'L' },
  { id: 'std-7a-4', classId: 'cls-7a', nisn: '0098765004', name: 'Citra Dewi', gender: 'P' },
  { id: 'std-7a-5', classId: 'cls-7a', nisn: '0098765005', name: 'Daffa Rizky', gender: 'L' },
  { id: 'std-7a-6', classId: 'cls-7a', nisn: '0098765006', name: 'Elsa Fitriani', gender: 'P' },

  // Kelas 7B
  { id: 'std-7b-1', classId: 'cls-7b', nisn: '0098765010', name: 'Fajar Nugraha', gender: 'L' },
  { id: 'std-7b-2', classId: 'cls-7b', nisn: '0098765011', name: 'Gita Gutawa', gender: 'P' },
  { id: 'std-7b-3', classId: 'cls-7b', nisn: '0098765012', name: 'Hendra Saputra', gender: 'L' },

  // Kelas 8A
  { id: 'std-8a-1', classId: 'cls-8a', nisn: '0087654001', name: 'Indah Permata', gender: 'P' },
  { id: 'std-8a-2', classId: 'cls-8a', nisn: '0087654002', name: 'Joko Widodo', gender: 'L' },
  { id: 'std-8a-3', classId: 'cls-8a', nisn: '0087654003', name: 'Kartika Sari', gender: 'P' }
];

export const INITIAL_TP_LIST: LearningObjective[] = [
  { id: 'tp-mat-71', subject: 'Matematika', grade: '7', code: 'TP.MAT.7.1', description: 'Memahami konsep bilangan bulat dan operasi hitung penjumlahan serta pengurangan' },
  { id: 'tp-mat-72', subject: 'Matematika', grade: '7', code: 'TP.MAT.7.2', description: 'Menyelesaikan masalah kontekstual menggunakan rasio dan aljabar sederhana' },
  { id: 'tp-mat-81', subject: 'Matematika', grade: '8', code: 'TP.MAT.8.1', description: 'Memahami teori Teorema Pythagoras dan penerapannya pada segitiga siku-siku' },
  
  { id: 'tp-indo-71', subject: 'Bahasa Indonesia', grade: '7', code: 'TP.IND.7.1', description: 'Menganalisis isi teks deskripsi dan mengidentifikasi informasi utama' },
  { id: 'tp-indo-72', subject: 'Bahasa Indonesia', grade: '7', code: 'TP.IND.7.2', description: 'Menulis teks cerita fantasi dengan memperhatikan struktur dan kaidah bahasa' },
  
  { id: 'tp-ipa-71', subject: 'IPA (Ilmu Pengetahuan Alam)', grade: '7', code: 'TP.IPA.7.1', description: 'Mengklasifikasikan makhluk hidup berdasarkan karakteristik ilmiah' },
  { id: 'tp-ipa-81', subject: 'IPA (Ilmu Pengetahuan Alam)', grade: '8', code: 'TP.IPA.8.1', description: 'Menganalisis sistem pencernaan manusia dan gangguan kesehatan terkait' },

  { id: 'tp-pjok-71', subject: 'PJOK', grade: '7', code: 'TP.PJK.7.1', description: 'Mempraktikkan teknik dasar permainan bola besar (sepak bola dan bola voli)' }
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'JRNL-20260725-7A-01',
    date: todayStr,
    timeSlot: 'Jam ke 1-2 (07:30 - 09:00)',
    teacherId: 'usr-1',
    teacherName: 'Siti Rahmawati, S.Pd.',
    classId: 'cls-7a',
    className: '7A',
    subject: 'Matematika',
    tpIds: ['tp-mat-71'],
    tpDescriptions: ['Memahami konsep bilangan bulat dan operasi hitung penjumlahan serta pengurangan'],
    summary: 'Penyampaian materi konsep dasar bilangan bulat positif dan negatif menggunakan garis bilangan interaktif. Siswa berdiskusi kelompok menyelesaikan 5 soal latihan kontekstual.',
    attendance: {
      'std-7a-1': 'hadir',
      'std-7a-2': 'hadir',
      'std-7a-3': 'sakit',
      'std-7a-4': 'hadir',
      'std-7a-5': 'hadir',
      'std-7a-6': 'izin'
    },
    attendanceSummary: { hadir: 4, sakit: 1, izin: 1, alpa: 0, total: 6 },
    incidents: [
      {
        id: 'inc-1',
        studentId: 'std-7a-3',
        studentName: 'Bagas Kurniawan',
        category: 'catatan',
        note: 'Orang tua mengirimkan surat keterangan sakit dari dokter.'
      },
      {
        id: 'inc-2',
        studentId: 'std-7a-1',
        studentName: 'Aditya Pratama',
        category: 'prestasi',
        note: 'Sangat aktif mempresentasikan hasil analisis latihan matematika di depan kelas.'
      }
    ],
    photoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
    photoDriveId: 'DRIVE_IMG_JRNL_7A_001',
    photoFileName: 'JRNL_20260725_7A_Matematika.jpg',
    syncStatus: 'synced',
    createdAt: new Date().toISOString()
  },
  {
    id: 'JRNL-20260725-7B-02',
    date: todayStr,
    timeSlot: 'Jam ke 3-4 (09:15 - 10:45)',
    teacherId: 'usr-2',
    teacherName: 'Budi Santoso, M.Pd.',
    classId: 'cls-7b',
    className: '7B',
    subject: 'Bahasa Indonesia',
    tpIds: ['tp-indo-71'],
    tpDescriptions: ['Menganalisis isi teks deskripsi dan mengidentifikasi informasi utama'],
    summary: 'Membaca bersama teks deskripsi keindahan objek wisata lokal. Siswa mengidentifikasi kalimat bermajelis dan ciri-ciri umum objek.',
    attendance: {
      'std-7b-1': 'hadir',
      'std-7b-2': 'hadir',
      'std-7b-3': 'hadir'
    },
    attendanceSummary: { hadir: 3, sakit: 0, izin: 0, alpa: 0, total: 3 },
    incidents: [],
    photoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
    photoDriveId: 'DRIVE_IMG_JRNL_7B_002',
    photoFileName: 'JRNL_20260725_7B_BahasaIndonesia.jpg',
    syncStatus: 'synced',
    createdAt: new Date().toISOString()
  }
];
