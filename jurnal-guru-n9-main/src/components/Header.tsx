import React, { useState, useEffect } from 'react';
import { 
  BookOpen, LayoutDashboard, FileSpreadsheet, Users, GraduationCap,
  Target, Bell, UserCheck, Settings, ChevronDown, Sun, Moon, Building2, LogOut, DatabaseBackup, Sparkles, CalendarDays
} from 'lucide-react';
import { User, SchoolConfig } from '../types';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  schoolConfig: SchoolConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectUser: (user: User) => void;
  onOpenSchoolSettings: () => void;
  onOpenBackupModal?: () => void;
  onLogout?: () => void;
  pendingReminderCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  schoolConfig,
  activeTab,
  setActiveTab,
  onSelectUser,
  onOpenSchoolSettings,
  onOpenBackupModal,
  onLogout,
  pendingReminderCount = 0
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('jurnal_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('jurnal_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const isAdmin = currentUser.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Jurnal Harian', icon: BookOpen },
    { id: 'grades', label: 'Nilai', icon: GraduationCap },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'classes', label: 'Kelas & Siswa', icon: Users },
    { id: 'tp', label: 'Tujuan Pembelajaran (TP)', icon: Target },
    { id: 'participation', label: 'Keaktifan', icon: Sparkles },
    { id: 'calendar', label: 'Kalender', icon: CalendarDays },
    ...(isAdmin ? [
      { id: 'teachers', label: 'Kelola Guru', icon: UserCheck },
      { id: 'reminders', label: 'Pengingat Guru', icon: Bell, badge: pendingReminderCount }
    ] : [])
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:mr-20 md:max-w-none">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              {schoolConfig.logoUrl ? (
                <img src={schoolConfig.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white">
                  <BookOpen size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight flex items-center gap-2 truncate">
                <span>Jurnal Guru</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800 shrink-0">
                  {schoolConfig.schoolName.split(' ')[0] || 'Sekolah'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate dark:text-slate-500">
                Sistem Jurnal & Absensi Terpadu
              </p>
            </div>
          </div>

          {/* Right Action Tools: School Settings, Dark Mode Toggle & User Profile */}
          <div className="flex items-center gap-2">
            
            {/* Button: Pengaturan Sekolah & Kop Surat */}
            <button
              onClick={onOpenSchoolSettings}
              title="Ubah Detail Sekolah, Logo & Kop Surat"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer text-xs font-semibold dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Building2 size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden lg:inline">Identitas Sekolah</span>
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isDarkMode ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* User Account Dropdown (Multi-user Switching) */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-left dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-white dark:ring-slate-800"
                />
                <div className="hidden sm:block pr-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    {isAdmin ? (
                      <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold">Admin</span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[9px] rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-semibold">Guru</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium dark:text-slate-500">
                    NIP: {currentUser.nip}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
              </button>

              {/* Dropdown Menu for Multi-User Switching */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-slate-400">
                      Pengguna Aktif Saat Ini
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">{currentUser.email}</p>
                  </div>

                  {allUsers.length > 1 && isAdmin && (
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-1.5 dark:text-slate-400">
                        Pengguna Terdaftar
                      </p>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {allUsers.map(u => (
                          <div
                            key={u.id}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-left ${
                              u.id === currentUser.id 
                                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-semibold border border-indigo-100 dark:border-indigo-800' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <img 
                              src={u.avatar} 
                              alt={u.name} 
                              className="w-7 h-7 rounded-lg object-cover" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-[11px] dark:text-white">{u.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate dark:text-slate-500">
                                {u.role === 'admin' ? 'Kepala Sekolah / Admin' : (u.subjects?.join(', ') || u.subject || 'Guru Kelas')}
                              </p>
                            </div>
                            {u.role === 'admin' && (
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                Admin
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option to Edit School Info directly from user menu */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 px-3 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenSchoolSettings();
                      }}
                      className="w-full flex items-center gap-2 p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Building2 size={15} />
                      <span>Edit Kop & Identitas Sekolah</span>
                    </button>
                    {isAdmin && onOpenBackupModal && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenBackupModal();
                        }}
                        className="w-full flex items-center gap-2 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <DatabaseBackup size={15} />
                        <span>Backup & Restore Data</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <LogOut size={15} />
                        <span>Keluar (Logout)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar (rail vertikal hanya untuk desktop) */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

