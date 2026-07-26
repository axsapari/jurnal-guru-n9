export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: UserRole;
  subject?: string; // deprecated: kept for backward compatibility, use `subjects`
  subjects?: string[]; // a teacher may teach more than one subject
  avatar?: string;
  phone?: string;
  passwordHash?: string;
  mustChangePassword?: boolean;
}

export interface SchoolConfig {
  schoolName: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl: string;
  cityLogoUrl?: string;
  headmasterName: string;
  headmasterNip: string;
  city: string;
  province: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "7A", "8B"
  grade: string; // e.g. "7", "8"
  academicYear: string; // e.g. "2025/2026"
  homeroomTeacherId?: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  classId: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
}

export interface LearningObjective {
  id: string;
  subject: string;
  grade: string;
  code: string; // e.g. "TP.7.1"
  description: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa';

export interface IncidentRecord {
  id: string;
  studentId: string;
  studentName: string;
  category: 'catatan' | 'prestasi' | 'pelanggaran';
  note: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "Jam 1-2 (07:30 - 09:00)"
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subject: string;
  tpIds: string[];
  tpDescriptions: string[];
  summary: string;
  attendance: Record<string, AttendanceStatus>; // studentId -> status
  attendanceSummary: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
  };
  incidents: IncidentRecord[];
  photoUrl?: string;
  photoDriveId?: string;
  photoFileName?: string;
  syncStatus: 'synced' | 'pending';
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  channel: 'whatsapp' | 'email' | 'in_app';
  message: string;
  sentAt: string;
  status: 'sent' | 'read';
}

// Jenis penilaian per kelas/mapel, contoh: "Tugas Harian" (bobot 20%), "UH" (30%), "UAS" (50%)
export interface GradeType {
  id: string;
  classId: string;
  subject: string;
  name: string; // nama_jenis
  weight: number; // bobot (%)
  teacherId?: string;
  semester: string;
  academicYear: string;
}

// Satu nilai untuk satu siswa pada satu sesi penilaian (assessmentName), contoh: "Ulangan Bab 1"
export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  gradeTypeId: string;
  assessmentName: string; // nama_penilaian
  score: number; // 0-100
  date: string;
  tpId?: string;
  teacherId: string;
  semester: string;
  academicYear: string;
}
