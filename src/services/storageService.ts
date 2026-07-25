import { 
  User, SchoolConfig, ClassRoom, Student, LearningObjective, JournalEntry, ReminderLog 
} from '../types';
import { 
  INITIAL_SCHOOL_CONFIG, INITIAL_USERS, INITIAL_CLASSES, 
  INITIAL_STUDENTS, INITIAL_TP_LIST, INITIAL_JOURNALS 
} from '../data/initialData';

const STORAGE_KEYS = {
  SCHOOL: 'jurnal_school_config',
  USERS: 'jurnal_users',
  CLASSES: 'jurnal_classes',
  STUDENTS: 'jurnal_students',
  TPS: 'jurnal_tps',
  JOURNALS: 'jurnal_entries',
  REMINDERS: 'jurnal_reminders',
  CURRENT_USER_ID: 'jurnal_current_user_id',
  GAS_WEBAPP_URL: 'jurnal_gas_webapp_url'
};

export class StorageService {
  // Initialize storage with defaults if empty
  static initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SCHOOL)) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(INITIAL_SCHOOL_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TPS)) {
      localStorage.setItem(STORAGE_KEYS.TPS, JSON.stringify(INITIAL_TP_LIST));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOURNALS)) {
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(INITIAL_JOURNALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-admin');
    }
  }

  // School Config
  static getSchoolConfig(): SchoolConfig {
    const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
    return data ? JSON.parse(data) : INITIAL_SCHOOL_CONFIG;
  }

  static saveSchoolConfig(config: SchoolConfig): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(config));
  }

  // Users
  static getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-admin';
    return users.find(u => u.id === currentId) || users[0];
  }

  static setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  // Classes
  static getClasses(): ClassRoom[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return data ? JSON.parse(data) : INITIAL_CLASSES;
  }

  static saveClasses(classes: ClassRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  // Students
  static getStudents(classId?: string): Student[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const students: Student[] = data ? JSON.parse(data) : INITIAL_STUDENTS;
    if (classId) {
      return students.filter(s => s.classId === classId);
    }
    return students;
  }

  static saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    this.saveStudents(students);
  }

  // Learning Objectives (TP)
  static getLearningObjectives(): LearningObjective[] {
    const data = localStorage.getItem(STORAGE_KEYS.TPS);
    return data ? JSON.parse(data) : INITIAL_TP_LIST;
  }

  static saveLearningObjectives(tps: LearningObjective[]): void {
    localStorage.setItem(STORAGE_KEYS.TPS, JSON.stringify(tps));
  }

  static addLearningObjective(tp: LearningObjective): void {
    const tps = this.getLearningObjectives();
    tps.push(tp);
    this.saveLearningObjectives(tps);
  }

  // Journals
  static getJournals(): JournalEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.JOURNALS);
    return data ? JSON.parse(data) : INITIAL_JOURNALS;
  }

  static saveJournals(journals: JournalEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
  }

  static saveJournalEntry(entry: JournalEntry): { entry: JournalEntry; isOffline: boolean } {
    const isOffline = !navigator.onLine;
    const journalToAdd = {
      ...entry,
      syncStatus: isOffline ? ('pending' as const) : ('synced' as const)
    };

    const journals = this.getJournals();
    const existingIndex = journals.findIndex(j => j.id === entry.id);

    if (existingIndex >= 0) {
      journals[existingIndex] = journalToAdd;
    } else {
      journals.unshift(journalToAdd);
    }

    this.saveJournals(journals);

    // If online & WebApp URL is configured, send to Google Sheets background
    if (!isOffline) {
      this.syncToGas(journalToAdd).catch(console.error);
    }

    return { entry: journalToAdd, isOffline };
  }

  static deleteJournalEntry(id: string): void {
    const journals = this.getJournals().filter(j => j.id !== id);
    this.saveJournals(journals);
  }

  // Offline Pending Sync Count
  static getPendingSyncCount(): number {
    const journals = this.getJournals();
    return journals.filter(j => j.syncStatus === 'pending').length;
  }

  // Sync Pending Entries when reconnected
  static async syncAllPending(): Promise<{ syncedCount: number; errors: number }> {
    const journals = this.getJournals();
    const pendingList = journals.filter(j => j.syncStatus === 'pending');

    if (pendingList.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    for (const entry of pendingList) {
      try {
        await this.syncToGas(entry);
        entry.syncStatus = 'synced';
        syncedCount++;
      } catch (err) {
        console.error('Failed sync for entry', entry.id, err);
        errors++;
      }
    }

    // Update local state
    this.saveJournals(journals);
    return { syncedCount, errors };
  }

  // Send single entry to Google Sheets Web App Endpoint (if set)
  static async syncToGas(entry: JournalEntry): Promise<boolean> {
    const gasUrl = this.getGasWebAppUrl();
    if (!gasUrl) {
      // If no GAS URL set, simulate successful sync
      return true;
    }

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_JOURNAL', payload: entry })
      });
      return response.ok;
    } catch (e) {
      console.warn('Sync to GAS failed, remaining in pending queue:', e);
      return false;
    }
  }

  // GAS WebApp URL Config
  static getGasWebAppUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_WEBAPP_URL) || '';
  }

  static setGasWebAppUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.GAS_WEBAPP_URL, url);
  }

  // Reminders
  static getReminders(): ReminderLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  }

  static addReminder(reminder: ReminderLog): void {
    const reminders = this.getReminders();
    reminders.unshift(reminder);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }
}
