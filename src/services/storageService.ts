import { supabase } from './supabaseClient';
import {
  User, SchoolConfig, ClassRoom, Student, LearningObjective, JournalEntry, ReminderLog
} from '../types';

// Device-local only: which user profile this browser is "acting as", and
// a queue for offline journal entries. Everything else now lives in
// Supabase and is shared across every device/user.
const LOCAL_KEYS = {
  CURRENT_USER_ID: 'jurnal_current_user_id',
  PENDING_JOURNALS: 'jurnal_pending_journals',
};

// ---------- mappers: camelCase (app) <-> snake_case (db) ----------

const schoolFromDb = (r: any): SchoolConfig => ({
  schoolName: r.school_name, npsn: r.npsn, address: r.address, phone: r.phone,
  email: r.email, website: r.website, logoUrl: r.logo_url,
  headmasterName: r.headmaster_name, headmasterNip: r.headmaster_nip,
  city: r.city, province: r.province,
});
const schoolToDb = (c: SchoolConfig) => ({
  id: 1, school_name: c.schoolName, npsn: c.npsn, address: c.address, phone: c.phone,
  email: c.email, website: c.website, logo_url: c.logoUrl,
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
  id: r.id, classId: r.class_id, nisn: r.nisn, name: r.name, gender: r.gender,
});
const studentToDb = (s: Student) => ({
  id: s.id, class_id: s.classId, nisn: s.nisn, name: s.name, gender: s.gender,
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
      logoUrl: '', headmasterName: '', headmasterNip: '', city: '', province: '',
    };
  }

  static async saveSchoolConfig(config: SchoolConfig): Promise<void> {
    const { error } = await supabase.from('school_config').upsert(schoolToDb(config));
    assertOk(error, 'saveSchoolConfig');
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('name');
    assertOk(error, 'getUsers');
    return (data ?? []) as User[];
  }

  static async saveUsers(users: User[]): Promise<void> {
    const { error } = await supabase.from('users').upsert(users);
    assertOk(error, 'saveUsers');
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    assertOk(error, 'deleteUser');
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

  // Optional: Google Apps Script webhook URL (kept as a shared app setting)
  static async getGasWebAppUrl(): Promise<string> {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'gas_webapp_url').maybeSingle();
    return data?.value || '';
  }

  static async setGasWebAppUrl(url: string): Promise<void> {
    const { error } = await supabase.from('app_settings').upsert({ key: 'gas_webapp_url', value: url });
    assertOk(error, 'setGasWebAppUrl');
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
}
