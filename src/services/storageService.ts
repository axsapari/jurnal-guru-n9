import { supabase } from './supabaseClient';
import {
  User, SchoolConfig, ClassRoom, Student, LearningObjective, JournalEntry, ReminderLog, GradeType, Grade, Participation, ScheduleEntry
} from '../types';

// Device-local only: which user profile this browser is "acting as", and
// a queue for offline journal entries. Everything else now lives in
// Supabase and is shared across every device/user.
const LOCAL_KEYS = {
  CURRENT_USER_ID: 'jurnal_current_user_id',
  PENDING_JOURNALS: 'jurnal_pending_journals',
  SESSION_USER_ID: 'jurnal_session_user_id',
};

const userFromDb = (r: any): User => ({
  id: r.id, name: r.name, nip: r.nip, email: r.email, role: r.role,
  subject: r.subject, subjects: Array.isArray(r.subjects) ? r.subjects : (r.subject ? [r.subject] : []),
  classIds: Array.isArray(r.class_ids) ? r.class_ids : [],
  avatar: r.avatar, phone: r.phone,
  passwordHash: r.password_hash, mustChangePassword: r.must_change_password,
});
const userToDb = (u: User) => ({
  id: u.id, name: u.name, nip: u.nip, email: u.email, role: u.role,
  subject: u.subjects?.[0] ?? u.subject ?? '', subjects: u.subjects ?? (u.subject ? [u.subject] : []),
  class_ids: u.classIds ?? [],
  avatar: u.avatar, phone: u.phone,
  password_hash: u.passwordHash, must_change_password: u.mustChangePassword ?? true,
});

// ---------- mappers: camelCase (app) <-> snake_case (db) ----------

const schoolFromDb = (r: any): SchoolConfig => ({
  schoolName: r.school_name, npsn: r.npsn, address: r.address, phone: r.phone,
  email: r.email, website: r.website, logoUrl: r.logo_url, cityLogoUrl: r.city_logo_url,
  governmentLine1: r.government_line1, governmentLine2: r.government_line2,
  headmasterName: r.headmaster_name, headmasterNip: r.headmaster_nip,
  city: r.city, province: r.province,
});
const schoolToDb = (c: SchoolConfig) => ({
  id: 1, school_name: c.schoolName, npsn: c.npsn, address: c.address, phone: c.phone,
  email: c.email, website: c.website, logo_url: c.logoUrl, city_logo_url: c.cityLogoUrl ?? '',
  government_line1: c.governmentLine1 ?? '', government_line2: c.governmentLine2 ?? '',
  headmaster_name: c.headmasterName, headmaster_nip: c.headmasterNip,
  city: c.city, province: c.province,
});

const classFromDb = (r: any): ClassRoom => ({
  id: r.id, name: r.name, grade: r.grade, academicYear: r.academic_year,
  homeroomTeacherId: r.homeroom_teacher_id ?? undefined, studentCount: r.student_count ?? undefined,
});
const classToDb = (c: ClassRoom) => ({
  id: c.id, name: c.name, grade: c.grade, academic_year: c.academicYear,
  homeroom_teacher_id: c.homeroomTeacherId ?? null, student_count: c.studentCount ?? 0,
});

const studentFromDb = (r: any): Student => ({
  id: r.id, classId: r.class_id, nisn: r.nisn, name: r.name, gender: r.gender, parentPhone: r.parent_phone,
});
const studentToDb = (s: Student) => ({
  id: s.id, class_id: s.classId, nisn: s.nisn, name: s.name, gender: s.gender, parent_phone: s.parentPhone ?? '',
});

const tpFromDb = (r: any): LearningObjective => ({
  id: r.id, subject: r.subject, grade: r.grade, code: r.code, description: r.description,
});
const tpToDb = (t: LearningObjective) => ({
  id: t.id, subject: t.subject, grade: t.grade, code: t.code, description: t.description,
});

const journalFromDb = (r: any): JournalEntry => ({
  id: r.id, date: r.date, timeSlot: r.time_slot, teacherId: r.teacher_id,
  teacherName: r.teacher_name, classId: r.class_id, className: r.class_name,
  subject: r.subject, tpIds: r.tp_ids ?? [], tpDescriptions: r.tp_descriptions ?? [],
  summary: r.summary, attendance: r.attendance ?? {},
  attendanceSummary: r.attendance_summary ?? { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 },
  incidents: r.incidents ?? [], photoUrl: r.photo_url ?? undefined,
  photoDriveId: r.photo_drive_id ?? undefined, photoFileName: r.photo_file_name ?? undefined,
  syncStatus: r.sync_status, createdAt: r.created_at,
});
const journalToDb = (j: JournalEntry) => ({
  id: j.id, date: j.date, time_slot: j.timeSlot, teacher_id: j.teacherId,
  teacher_name: j.teacherName, class_id: j.classId, class_name: j.className,
  subject: j.subject, tp_ids: j.tpIds, tp_descriptions: j.tpDescriptions,
  summary: j.summary, attendance: j.attendance, attendance_summary: j.attendanceSummary,
  incidents: j.incidents, photo_url: j.photoUrl ?? null, photo_drive_id: j.photoDriveId ?? null,
  photo_file_name: j.photoFileName ?? null, sync_status: j.syncStatus, created_at: j.createdAt,
});

const gradeTypeFromDb = (r: any): GradeType => ({
  id: r.id, classId: r.class_id, subject: r.subject, name: r.name, weight: Number(r.weight) || 0,
  teacherId: r.teacher_id ?? undefined, semester: r.semester, academicYear: r.academic_year,
});
const gradeTypeToDb = (t: GradeType) => ({
  id: t.id, class_id: t.classId, subject: t.subject, name: t.name, weight: t.weight,
  teacher_id: t.teacherId ?? null, semester: t.semester, academic_year: t.academicYear,
});

const gradeFromDb = (r: any): Grade => ({
  id: r.id, studentId: r.student_id, classId: r.class_id, subject: r.subject,
  gradeTypeId: r.grade_type_id, assessmentName: r.assessment_name, score: Number(r.score),
  date: r.date, tpId: r.tp_id ?? undefined, teacherId: r.teacher_id,
  semester: r.semester, academicYear: r.academic_year,
});
const gradeToDb = (g: Grade) => ({
  id: g.id, student_id: g.studentId, class_id: g.classId, subject: g.subject,
  grade_type_id: g.gradeTypeId, assessment_name: g.assessmentName, score: g.score,
  date: g.date, tp_id: g.tpId ?? null, teacher_id: g.teacherId,
  semester: g.semester, academic_year: g.academicYear,
});

const participationFromDb = (r: any): Participation => ({
  id: r.id, studentId: r.student_id, classId: r.class_id, date: r.date,
  score: Number(r.score) || 0, teacherId: r.teacher_id, semester: r.semester, academicYear: r.academic_year,
});
const participationToDb = (p: Participation) => ({
  id: p.id, student_id: p.studentId, class_id: p.classId, date: p.date,
  score: p.score, teacher_id: p.teacherId, semester: p.semester, academic_year: p.academicYear,
});

const scheduleFromDb = (r: any): ScheduleEntry => ({
  id: r.id, teacherId: r.teacher_id, classId: r.class_id, subject: r.subject,
  dayOfWeek: r.day_of_week, timeSlot: r.time_slot, academicYear: r.academic_year,
});
const scheduleToDb = (s: ScheduleEntry) => ({
  id: s.id, teacher_id: s.teacherId, class_id: s.classId, subject: s.subject,
  day_of_week: s.dayOfWeek, time_slot: s.timeSlot, academic_year: s.academicYear,
});

const reminderFromDb = (r: any): ReminderLog => ({
  id: r.id, teacherId: r.teacher_id, teacherName: r.teacher_name, date: r.date,
  channel: r.channel, message: r.message, sentAt: r.sent_at, status: r.status,
});
const reminderToDb = (r: ReminderLog) => ({
  id: r.id, teacher_id: r.teacherId, teacher_name: r.teacherName, date: r.date,
  channel: r.channel, message: r.message, sent_at: r.sentAt, status: r.status,
});

function assertOk(error: any, context: string) {
  if (error) {
    console.error(`Supabase error [${context}]:`, error);
    throw new Error(`${context}: ${error.message}`);
  }
}

export class StorageService {
  // No-op now: schema + seed data are created once via supabase_schema.sql.
  // Kept so existing callers (App.tsx) don't need to change.
  static async initStorage(): Promise<void> {
    if (!localStorage.getItem(LOCAL_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(LOCAL_KEYS.CURRENT_USER_ID, 'usr-admin');
    }
  }

  // School Config
  static async getSchoolConfig(): Promise<SchoolConfig> {
    const { data, error } = await supabase.from('school_config').select('*').eq('id', 1).maybeSingle();
    assertOk(error, 'getSchoolConfig');
    return data ? schoolFromDb(data) : {
      schoolName: '', npsn: '', address: '', phone: '', email: '', website: '',
      logoUrl: '', cityLogoUrl: '', governmentLine1: '', governmentLine2: '', headmasterName: '', headmasterNip: '', city: '', province: '',
    };
  }

  static async saveSchoolConfig(config: SchoolConfig): Promise<void> {
    const { error } = await supabase.from('school_config').upsert(schoolToDb(config));
    assertOk(error, 'saveSchoolConfig');
  }

  // Upload a logo image (school logo or city/government logo) to Supabase
  // Storage and return its public URL, ready to store in SchoolConfig.
  static async uploadLogo(file: File, kind: 'school' | 'city'): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${kind}-logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });
    assertOk(error, 'uploadLogo');
    const { data } = supabase.storage.from('logos').getPublicUrl(path);
    return data.publicUrl;
  }

  // Upload a teacher/admin profile photo. Reuses the same public "logos"
  // bucket (already set up with public read/write policies) under an
  // "avatar-" prefix, so no extra bucket/policy setup is needed.
  static async uploadAvatar(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });
    assertOk(error, 'uploadAvatar');
    const { data } = supabase.storage.from('logos').getPublicUrl(path);
    return data.publicUrl;
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('name');
    assertOk(error, 'getUsers');
    return (data ?? []).map(userFromDb);
  }

  static async saveUsers(users: User[]): Promise<void> {
    const { error } = await supabase.from('users').upsert(users.map(userToDb));
    assertOk(error, 'saveUsers');
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    assertOk(error, 'deleteUser');
  }

  // ---------- Auth / Session ----------
  // Session token = logged-in user's id, kept in sessionStorage (cleared when
  // the browser tab closes). See src/utils/authUtils.ts for the caveat about
  // what level of security this actually provides.

  static getSession(): string | null {
    return sessionStorage.getItem(LOCAL_KEYS.SESSION_USER_ID);
  }

  static clearSession(): void {
    sessionStorage.removeItem(LOCAL_KEYS.SESSION_USER_ID);
  }

  // Logs in by email + password. Handles first-login (password not yet set)
  // by adopting whatever password is entered as the new one, mirroring the
  // reference app's "CHANGE_ON_FIRST_LOGIN" flow.
  static async login(email: string, password: string): Promise<User> {
    const { sha256, FIRST_LOGIN_SENTINEL } = await import('../utils/authUtils');
    const hash = await sha256(password);

    const { data, error } = await supabase.from('users').select('*').ilike('email', email.trim()).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Email tidak ditemukan.');

    let user = userFromDb(data);

    if (!user.passwordHash || user.passwordHash === FIRST_LOGIN_SENTINEL) {
      // First login: adopt the entered password as this account's password.
      const { error: upErr } = await supabase.from('users').update({ password_hash: hash, must_change_password: false }).eq('id', user.id);
      assertOk(upErr, 'login (set first password)');
      user = { ...user, passwordHash: hash, mustChangePassword: false };
    } else if (user.passwordHash !== hash) {
      throw new Error('Password salah.');
    }

    sessionStorage.setItem(LOCAL_KEYS.SESSION_USER_ID, user.id);
    return user;
  }

  // Admin action: reset a teacher's password back to "not set" so they can
  // set a fresh one the next time they log in.
  static async resetPassword(userId: string): Promise<void> {
    const { FIRST_LOGIN_SENTINEL } = await import('../utils/authUtils');
    const { error } = await supabase.from('users').update({ password_hash: FIRST_LOGIN_SENTINEL, must_change_password: true }).eq('id', userId);
    assertOk(error, 'resetPassword');
  }

  static async getCurrentUser(): Promise<User> {
    const users = await this.getUsers();
    const currentId = localStorage.getItem(LOCAL_KEYS.CURRENT_USER_ID) || 'usr-admin';
    return users.find(u => u.id === currentId) || users[0];
  }

  static setCurrentUser(userId: string): void {
    localStorage.setItem(LOCAL_KEYS.CURRENT_USER_ID, userId);
  }

  // Classes
  static async getClasses(): Promise<ClassRoom[]> {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    assertOk(error, 'getClasses');
    return (data ?? []).map(classFromDb);
  }

  static async saveClasses(classes: ClassRoom[]): Promise<void> {
    const { error } = await supabase.from('classes').upsert(classes.map(classToDb));
    assertOk(error, 'saveClasses');
  }

  static async deleteClass(id: string): Promise<void> {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    assertOk(error, 'deleteClass');
  }

  // Students
  static async getStudents(classId?: string): Promise<Student[]> {
    let query = supabase.from('students').select('*').order('name');
    if (classId) query = query.eq('class_id', classId);
    const { data, error } = await query;
    assertOk(error, 'getStudents');
    return (data ?? []).map(studentFromDb);
  }

  static async saveStudents(students: Student[]): Promise<void> {
    const { error } = await supabase.from('students').upsert(students.map(studentToDb));
    assertOk(error, 'saveStudents');
  }

  static async addStudent(student: Student): Promise<void> {
    const { error } = await supabase.from('students').insert(studentToDb(student));
    assertOk(error, 'addStudent');
  }

  static async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase.from('students').delete().eq('id', id);
    assertOk(error, 'deleteStudent');
  }

  // Learning Objectives (TP)
  static async getLearningObjectives(): Promise<LearningObjective[]> {
    const { data, error } = await supabase.from('learning_objectives').select('*').order('code');
    assertOk(error, 'getLearningObjectives');
    return (data ?? []).map(tpFromDb);
  }

  static async saveLearningObjectives(tps: LearningObjective[]): Promise<void> {
    const { error } = await supabase.from('learning_objectives').upsert(tps.map(tpToDb));
    assertOk(error, 'saveLearningObjectives');
  }

  static async addLearningObjective(tp: LearningObjective): Promise<void> {
    const { error } = await supabase.from('learning_objectives').insert(tpToDb(tp));
    assertOk(error, 'addLearningObjective');
  }

  static async deleteLearningObjective(id: string): Promise<void> {
    const { error } = await supabase.from('learning_objectives').delete().eq('id', id);
    assertOk(error, 'deleteLearningObjective');
  }

  // Journals
  static async getJournals(): Promise<JournalEntry[]> {
    const { data, error } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false });
    assertOk(error, 'getJournals');
    return (data ?? []).map(journalFromDb);
  }

  static async saveJournalEntry(entry: JournalEntry): Promise<{ entry: JournalEntry; isOffline: boolean }> {
    const isOffline = !navigator.onLine;
    const journalToAdd: JournalEntry = {
      ...entry,
      syncStatus: isOffline ? 'pending' : 'synced',
    };

    if (!isOffline) {
      const { error } = await supabase.from('journal_entries').upsert(journalToDb(journalToAdd));
      assertOk(error, 'saveJournalEntry');
    } else {
      // Queue locally until connection returns; flushed by syncAllPending().
      const pending = JSON.parse(localStorage.getItem(LOCAL_KEYS.PENDING_JOURNALS) || '[]');
      pending.push(journalToAdd);
      localStorage.setItem(LOCAL_KEYS.PENDING_JOURNALS, JSON.stringify(pending));
    }

    return { entry: journalToAdd, isOffline };
  }

  static async deleteJournalEntry(id: string): Promise<void> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    assertOk(error, 'deleteJournalEntry');
  }

  // Offline Pending Sync Count
  static getPendingSyncCount(): number {
    const pending = JSON.parse(localStorage.getItem(LOCAL_KEYS.PENDING_JOURNALS) || '[]');
    return pending.length;
  }

  // Sync Pending Entries when reconnected
  static async syncAllPending(): Promise<{ syncedCount: number; errors: number }> {
    const pending: JournalEntry[] = JSON.parse(localStorage.getItem(LOCAL_KEYS.PENDING_JOURNALS) || '[]');
    if (pending.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;
    const stillPending: JournalEntry[] = [];

    for (const entry of pending) {
      const { error } = await supabase.from('journal_entries').upsert(journalToDb({ ...entry, syncStatus: 'synced' }));
      if (error) {
        console.error('Failed sync for entry', entry.id, error);
        errors++;
        stillPending.push(entry);
      } else {
        syncedCount++;
      }
    }

    localStorage.setItem(LOCAL_KEYS.PENDING_JOURNALS, JSON.stringify(stillPending));
    return { syncedCount, errors };
  }

  // Reminders
  static async getReminders(): Promise<ReminderLog[]> {
    const { data, error } = await supabase.from('reminders').select('*').order('sent_at', { ascending: false });
    assertOk(error, 'getReminders');
    return (data ?? []).map(reminderFromDb);
  }

  static async addReminder(reminder: ReminderLog): Promise<void> {
    const { error } = await supabase.from('reminders').insert(reminderToDb(reminder));
    assertOk(error, 'addReminder');
  }

  // ---------- Penilaian (Grades) ----------

  static async getGradeTypes(): Promise<GradeType[]> {
    const { data, error } = await supabase.from('grade_types').select('*').order('name');
    assertOk(error, 'getGradeTypes');
    return (data ?? []).map(gradeTypeFromDb);
  }

  static async addGradeType(gradeType: GradeType): Promise<void> {
    const { error } = await supabase.from('grade_types').insert(gradeTypeToDb(gradeType));
    assertOk(error, 'addGradeType');
  }

  static async saveGradeTypes(gradeTypes: GradeType[]): Promise<void> {
    const { error } = await supabase.from('grade_types').upsert(gradeTypes.map(gradeTypeToDb));
    assertOk(error, 'saveGradeTypes');
  }

  static async deleteGradeType(id: string): Promise<void> {
    const { error } = await supabase.from('grade_types').delete().eq('id', id);
    assertOk(error, 'deleteGradeType');
  }

  static async getGrades(): Promise<Grade[]> {
    const { data, error } = await supabase.from('grades').select('*');
    assertOk(error, 'getGrades');
    return (data ?? []).map(gradeFromDb);
  }

  // Upsert a batch of grades in one call (used when saving a whole score-entry table at once)
  static async saveGrades(grades: Grade[]): Promise<void> {
    const { error } = await supabase.from('grades').upsert(grades.map(gradeToDb));
    assertOk(error, 'saveGrades');
  }

  static async deleteGrade(id: string): Promise<void> {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    assertOk(error, 'deleteGrade');
  }

  // ---------- Keaktifan / Partisipasi ----------

  static async getParticipations(): Promise<Participation[]> {
    const { data, error } = await supabase.from('participations').select('*');
    assertOk(error, 'getParticipations');
    return (data ?? []).map(participationFromDb);
  }

  static async saveParticipations(list: Participation[]): Promise<void> {
    const { error } = await supabase.from('participations').upsert(list.map(participationToDb));
    assertOk(error, 'saveParticipations');
  }

  // ---------- Jadwal Mengajar ----------

  static async getSchedule(): Promise<ScheduleEntry[]> {
    const { data, error } = await supabase.from('teaching_schedule').select('*');
    assertOk(error, 'getSchedule');
    return (data ?? []).map(scheduleFromDb);
  }

  static async saveSchedule(list: ScheduleEntry[]): Promise<void> {
    const { error } = await supabase.from('teaching_schedule').upsert(list.map(scheduleToDb));
    assertOk(error, 'saveSchedule');
  }

  static async clearSchedule(): Promise<void> {
    const { error } = await supabase.from('teaching_schedule').delete().neq('id', '__none__');
    assertOk(error, 'clearSchedule');
  }

  // ---------- Backup & Restore ----------
  // Downloads/uploads every table as one JSON bundle. Restore uses upsert,
  // so it's safe to run against a database that already has some data —
  // matching IDs get overwritten, new IDs get inserted, nothing is deleted.

  static async exportBackup(): Promise<Record<string, any>> {
    const [school, users, classes, students, tps, journals, reminders, gradeTypes, grades, participations, schedule] = await Promise.all([
      this.getSchoolConfig(), this.getUsers(), this.getClasses(), this.getStudents(),
      this.getLearningObjectives(), this.getJournals(), this.getReminders(),
      this.getGradeTypes(), this.getGrades(), this.getParticipations(), this.getSchedule(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      schoolConfig: school, users, classes, students, learningObjectives: tps,
      journals, reminders, gradeTypes, grades, participations, schedule,
    };
  }

  // ---------- Semester / Tahun Ajaran Aktif ----------
  // Disimpan sebagai satu baris JSON di app_settings supaya tidak perlu
  // tabel baru. Dipakai sebagai default semester/tahun ajaran saat mencatat
  // nilai & keaktifan, dan sebagai filter tampilan.

  static async getActivePeriod(): Promise<{ semester: string; academicYear: string }> {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'active_period').maybeSingle();
    if (data?.value) {
      try {
        return JSON.parse(data.value);
      } catch {
        // fall through to default
      }
    }
    return { semester: 'Ganjil', academicYear: '2025/2026' };
  }

  static async setActivePeriod(semester: string, academicYear: string): Promise<void> {
    const { error } = await supabase.from('app_settings').upsert({
      key: 'active_period',
      value: JSON.stringify({ semester, academicYear }),
    });
    assertOk(error, 'setActivePeriod');
  }

  static async importBackup(data: Record<string, any>): Promise<void> {
    if (data.schoolConfig) await this.saveSchoolConfig(data.schoolConfig);
    if (Array.isArray(data.users) && data.users.length) await this.saveUsers(data.users);
    if (Array.isArray(data.classes) && data.classes.length) await this.saveClasses(data.classes);
    if (Array.isArray(data.students) && data.students.length) await this.saveStudents(data.students);
    if (Array.isArray(data.learningObjectives) && data.learningObjectives.length) await this.saveLearningObjectives(data.learningObjectives);
    if (Array.isArray(data.journals)) {
      for (const j of data.journals) await this.saveJournalEntry(j);
    }
    if (Array.isArray(data.gradeTypes) && data.gradeTypes.length) await this.saveGradeTypes(data.gradeTypes);
    if (Array.isArray(data.grades) && data.grades.length) await this.saveGrades(data.grades);
    if (Array.isArray(data.participations) && data.participations.length) await this.saveParticipations(data.participations);
    if (Array.isArray(data.schedule) && data.schedule.length) await this.saveSchedule(data.schedule);
  }
}
