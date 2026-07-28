import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { User, SchoolConfig, ClassRoom, LearningObjective, JournalEntry, Student } from './types';

// Components
import { Header } from './components/Header';
import { SideNav } from './components/SideNav';
import { LoginScreen } from './components/LoginScreen';
import { OfflineBanner } from './components/OfflineBanner';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { JournalList } from './components/Journal/JournalList';
import { JournalFormModal } from './components/Journal/JournalFormModal';
import { ActivityFormModal } from './components/Journal/ActivityFormModal';
import { ReportGeneratorModal } from './components/Reports/ReportGeneratorModal';
import { ClassManagement } from './components/Management/ClassManagement';
import { TpManagement } from './components/Management/TpManagement';
import { TeacherManagement } from './components/Management/TeacherManagement';
import { GradesManagement } from './components/Grades/GradesManagement';
import { ParticipationManagement } from './components/Participation/ParticipationManagement';
import { CalendarView } from './components/Calendar/CalendarView';
import { BackupRestoreModal } from './components/Management/BackupRestoreModal';
import { FooterCredit, AboutModal } from './components/DeveloperCredit';
import { ReminderCenterModal } from './components/Reminders/ReminderCenterModal';
import { SchoolSettingsModal } from './components/Management/SchoolSettingsModal';

const CACHE_KEY = 'jurnal_offline_cache_v1';

function saveCache(payload: object) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, cachedAt: new Date().toISOString() }));
  } catch {
    // localStorage full or unavailable — non-critical, just skip caching silently
  }
}

function loadCache(): any | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fatalError, setFatalError] = useState<string | null>(null); // only when there's truly nothing to show
  const [connectionError, setConnectionError] = useState<string | null>(null); // non-blocking, shown as a corner badge
  const [usingCache, setUsingCache] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activePeriod, setActivePeriod] = useState<{ semester: string; academicYear: string }>({ semester: 'Ganjil', academicYear: '2026/2027' });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [showSchoolSettingsModal, setShowSchoolSettingsModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);

  const refreshState = async (activeUserId?: string) => {
    try {
      const [school, journalList, classList, tpList, userList, period, studentList] = await Promise.all([
        StorageService.getSchoolConfig(),
        StorageService.getJournals(),
        StorageService.getClasses(),
        StorageService.getLearningObjectives(),
        StorageService.getUsers(),
        StorageService.getActivePeriod(),
        StorageService.getStudents(),
      ]);
      setSchoolConfig(school);
      setJournals(journalList);
      setClasses(classList);
      setLearningObjectives(tpList);
      setUsers(userList);
      setActivePeriod(period);
      setAllStudents(studentList);
      setUsingCache(false);
      saveCache({ schoolConfig: school, journals: journalList, classes: classList, learningObjectives: tpList, users: userList, activePeriod: period, allStudents: studentList });

      const sessionId = activeUserId || StorageService.getSession();
      if (sessionId) {
        const match = userList.find(u => u.id === sessionId);
        if (match) setCurrentUser(match);
      }
      setConnectionError(null);
      setFatalError(null);
    } catch (err: any) {
      console.error('Gagal memuat data dari Supabase:', err);
      const message = err?.message || 'Gagal terhubung ke database.';

      // Don't block the whole app — fall back to the last cached data if we
      // have any, and just show a small non-blocking status badge instead.
      const cache = loadCache();
      if (cache) {
        setSchoolConfig(cache.schoolConfig ?? null);
        setJournals(cache.journals ?? []);
        setClasses(cache.classes ?? []);
        setLearningObjectives(cache.learningObjectives ?? []);
        setUsers(cache.users ?? []);
        if (cache.activePeriod) setActivePeriod(cache.activePeriod);
        setAllStudents(cache.allStudents ?? []);
        setUsingCache(true);

        const sessionId = activeUserId || StorageService.getSession();
        if (sessionId) {
          const match = (cache.users ?? []).find((u: User) => u.id === sessionId);
          if (match) setCurrentUser(match);
        }
        setConnectionError(message);
        setFatalError(null);
      } else {
        // No cache and no connection — genuinely nothing we can show.
        setFatalError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial boot: load public data (school branding) + resume session if any
  useEffect(() => {
    StorageService.initStorage().then(() => refreshState());
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        Memuat data...
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950 p-6">
        <div className="max-w-md text-center text-red-600 dark:text-red-400">
          <p className="font-semibold mb-2">Tidak bisa terhubung ke database</p>
          <p className="text-sm">{fatalError}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">Belum ada data tersimpan di perangkat ini untuk ditampilkan sementara. Periksa koneksi internet, lalu muat ulang halaman.</p>
        </div>
      </div>
    );
  }

  // Not logged in yet -> show login screen instead of the app
  if (!currentUser) {
    return (
      <LoginScreen
        schoolConfig={schoolConfig}
        onLoggedIn={(user) => {
          setCurrentUser(user);
          refreshState(user.id);
        }}
      />
    );
  }

  const handleLogout = () => {
    StorageService.clearSession();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleJournalSaved = () => {
    refreshState();
  };

  const isAdmin = currentUser.role === 'admin';

  // Count pending reminders for notification badge
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTeachers = users.filter(u => u.role === 'teacher');
  const todaySubmittedTeacherIds = new Set(journals.filter(j => j.date === todayStr).map(j => j.teacherId));
  const pendingReminderCount = activeTeachers.filter(t => !todaySubmittedTeacherIds.has(t.id)).length;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col transition-colors duration-200">
      {/* Network & Offline Status Banner */}
      <OfflineBanner
        onSyncComplete={refreshState}
        connectionError={connectionError}
        usingCache={usingCache}
      />

      {/* Main Navigation Header */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        schoolConfig={schoolConfig!}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectUser={() => {}}
        onOpenSchoolSettings={() => setShowSchoolSettingsModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenAboutModal={() => setShowAboutModal(true)}
        onLogout={handleLogout}
        pendingReminderCount={pendingReminderCount}
      />

      {/* Right-side vertical navigation rail (desktop) */}
      <SideNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        pendingReminderCount={pendingReminderCount}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:mr-20 max-w-7xl">
        {/* TAB 1: Dashboard Analitik */}
        {activeTab === 'dashboard' && (
          isAdmin ? (
            <AdminDashboard
              journals={journals}
              teachers={users}
              classes={classes}
              students={allStudents}
              onOpenJournalForm={() => setShowJournalModal(true)}
              onOpenActivityForm={() => setShowActivityModal(true)}
              onSendReminder={(teacher) => {
                setActiveTab('reminders');
              }}
              onViewJournalDetails={(entry) => {
                setActiveTab('journal');
              }}
            />
          ) : (
            <TeacherDashboard
              currentUser={currentUser}
              journals={journals}
              classes={classes}
              onOpenJournalForm={() => setShowJournalModal(true)}
              onOpenActivityForm={() => setShowActivityModal(true)}
              onViewJournalDetails={(entry) => {
                setActiveTab('journal');
              }}
            />
          )
        )}

        {/* TAB 2: Jurnal Harian List */}
        {activeTab === 'journal' && (
          <JournalList
            journals={journals}
            classes={classes}
            teachers={users}
            currentUser={currentUser}
            onRefresh={refreshState}
            onOpenNewJournal={() => setShowJournalModal(true)}
          />
        )}

        {/* TAB 3: Nilai (Penilaian) */}
        {activeTab === 'grades' && (
          <GradesManagement
            currentUser={currentUser}
            classes={classes}
            learningObjectives={learningObjectives}
            activePeriod={activePeriod}
          />
        )}

        {/* TAB 4: Laporan */}
        {activeTab === 'reports' && (
          <ReportGeneratorModal
            currentUser={currentUser}
            journals={journals}
            schoolConfig={schoolConfig!}
            classes={classes}
            teachers={users}
          />
        )}

        {/* TAB 5: Kelas & Siswa */}
        {activeTab === 'classes' && (
          <ClassManagement
            currentUser={currentUser}
            classes={classes}
            teachers={users}
            journals={journals}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 6: Tujuan Pembelajaran (TP) */}
        {activeTab === 'tp' && (
          <TpManagement
            currentUser={currentUser}
            learningObjectives={learningObjectives}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 7: Keaktifan Siswa */}
        {activeTab === 'participation' && (
          <ParticipationManagement
            currentUser={currentUser}
            classes={classes}
            activePeriod={activePeriod}
          />
        )}

        {/* TAB 8: Kalender Akademik */}
        {activeTab === 'calendar' && (
          <CalendarView
            currentUser={currentUser}
            classes={classes}
            journals={journals}
          />
        )}

        {/* TAB 9: Kelola Guru (Admin) */}
        {activeTab === 'teachers' && isAdmin && (
          <TeacherManagement
            users={users}
            classes={classes}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 10: Pengingat Guru (Admin) */}
        {activeTab === 'reminders' && isAdmin && (
          <ReminderCenterModal
            teachers={users}
            journals={journals}
          />
        )}
      </main>

      <FooterCredit />

      {/* Journal Entry Input Form Modal */}
      <JournalFormModal
        isOpen={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        currentUser={currentUser}
        classes={classes}
        learningObjectives={learningObjectives}
        onSaved={handleJournalSaved}
      />

      {/* Non-teaching Activity Log Modal */}
      <ActivityFormModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        currentUser={currentUser}
        onSaved={handleJournalSaved}
      />

      {/* School Settings & Letterhead Modal */}
      <SchoolSettingsModal
        isOpen={showSchoolSettingsModal}
        onClose={() => setShowSchoolSettingsModal(false)}
        schoolConfig={schoolConfig!}
        activePeriod={activePeriod}
        onSaved={refreshState}
      />

      {/* Backup & Restore Modal (Admin) */}
      {isAdmin && (
        <BackupRestoreModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          onRestored={refreshState}
        />
      )}

      {/* About / Developer Credit Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        schoolName={schoolConfig?.schoolName}
      />
    </div>
  );
}
