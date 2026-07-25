import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { User, SchoolConfig, ClassRoom, LearningObjective, JournalEntry } from './types';

// Components
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { JournalList } from './components/Journal/JournalList';
import { JournalFormModal } from './components/Journal/JournalFormModal';
import { ReportGeneratorModal } from './components/Reports/ReportGeneratorModal';
import { ClassManagement } from './components/Management/ClassManagement';
import { TpManagement } from './components/Management/TpManagement';
import { TeacherManagement } from './components/Management/TeacherManagement';
import { ReminderCenterModal } from './components/Reminders/ReminderCenterModal';
import { GasExportModal } from './components/AppsScript/GasExportModal';
import { SchoolSettingsModal } from './components/Management/SchoolSettingsModal';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [showGasModal, setShowGasModal] = useState<boolean>(false);
  const [showSchoolSettingsModal, setShowSchoolSettingsModal] = useState<boolean>(false);

  const refreshState = async () => {
    try {
      const [user, school, journalList, classList, tpList, userList] = await Promise.all([
        StorageService.getCurrentUser(),
        StorageService.getSchoolConfig(),
        StorageService.getJournals(),
        StorageService.getClasses(),
        StorageService.getLearningObjectives(),
        StorageService.getUsers(),
      ]);
      setCurrentUser(user);
      setSchoolConfig(school);
      setJournals(journalList);
      setClasses(classList);
      setLearningObjectives(tpList);
      setUsers(userList);
      setLoadError(null);
    } catch (err: any) {
      console.error('Gagal memuat data dari Supabase:', err);
      setLoadError(err?.message || 'Gagal terhubung ke database. Periksa konfigurasi Supabase (.env).');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Storage defaults + first load
  useEffect(() => {
    StorageService.initStorage().then(refreshState);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        Memuat data...
      </div>
    );
  }

  if (loadError || !currentUser || !schoolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 dark:bg-slate-950 p-6">
        <div className="max-w-md text-center text-red-600 dark:text-red-400">
          <p className="font-semibold mb-2">Tidak bisa terhubung ke database</p>
          <p className="text-sm">{loadError || 'Data pengguna tidak ditemukan. Pastikan tabel users di Supabase sudah terisi.'}</p>
        </div>
      </div>
    );
  }

  const handleSelectUser = (user: User) => {
    StorageService.setCurrentUser(user.id);
    setCurrentUser(user as User);
    // If switching to teacher and currently on admin-only tab, default to dashboard
    if (user.role === 'teacher' && (activeTab === 'teachers' || activeTab === 'reminders')) {
      setActiveTab('dashboard');
    }
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
        onOpenGasModal={() => setShowGasModal(true)}
      />

      {/* Main Navigation Header */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        schoolConfig={schoolConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectUser={handleSelectUser}
        onOpenSchoolSettings={() => setShowSchoolSettingsModal(true)}
        pendingReminderCount={pendingReminderCount}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Dashboard Analitik */}
        {activeTab === 'dashboard' && (
          isAdmin ? (
            <AdminDashboard
              journals={journals}
              teachers={users}
              classes={classes}
              onOpenJournalForm={() => setShowJournalModal(true)}
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

        {/* TAB 3: Laporan & Kop Surat */}
        {activeTab === 'reports' && (
          <ReportGeneratorModal
            journals={journals}
            schoolConfig={schoolConfig}
            classes={classes}
            teachers={users}
          />
        )}

        {/* TAB 4: Kelas & Siswa */}
        {activeTab === 'classes' && (
          <ClassManagement
            classes={classes}
            teachers={users}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 5: Tujuan Pembelajaran (TP) */}
        {activeTab === 'tp' && (
          <TpManagement
            learningObjectives={learningObjectives}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 6: Kelola Guru (Admin) */}
        {activeTab === 'teachers' && isAdmin && (
          <TeacherManagement
            users={users}
            onRefresh={refreshState}
          />
        )}

        {/* TAB 7: Pengingat Guru (Admin) */}
        {activeTab === 'reminders' && isAdmin && (
          <ReminderCenterModal
            teachers={users}
            journals={journals}
          />
        )}
      </main>

      {/* Journal Entry Input Form Modal */}
      <JournalFormModal
        isOpen={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        currentUser={currentUser}
        classes={classes}
        learningObjectives={learningObjectives}
        onSaved={handleJournalSaved}
      />

      {/* Google Apps Script & Google Sheets Modal */}
      <GasExportModal
        isOpen={showGasModal}
        onClose={() => setShowGasModal(false)}
        onSavedUrl={refreshState}
      />

      {/* School Settings & Letterhead Modal */}
      <SchoolSettingsModal
        isOpen={showSchoolSettingsModal}
        onClose={() => setShowSchoolSettingsModal(false)}
        schoolConfig={schoolConfig}
        onSaved={refreshState}
      />
    </div>
  );
}
