import React from 'react';
import {
  BookOpen, LayoutDashboard, FileSpreadsheet, Users,
  Target, Bell, UserCheck, GraduationCap, Sparkles, CalendarDays
} from 'lucide-react';

interface SideNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  pendingReminderCount?: number;
}

const baseNavItems: { id: string; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Jurnal', icon: BookOpen },
  { id: 'grades', label: 'Nilai', icon: GraduationCap },
  { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
  { id: 'classes', label: 'Kelas', icon: Users },
  { id: 'tp', label: 'TP', icon: Target },
  { id: 'participation', label: 'Keaktifan', icon: Sparkles },
  { id: 'calendar', label: 'Kalender', icon: CalendarDays },
];

export const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab, isAdmin, pendingReminderCount = 0 }) => {
  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? [
      { id: 'teachers', label: 'Guru', icon: UserCheck },
      { id: 'reminders', label: 'Ingatkan', icon: Bell, badge: pendingReminderCount },
    ] : []),
  ];

  return (
    <nav
      className="hidden md:flex flex-col items-center gap-1 fixed right-0 top-16 bottom-0 w-20 py-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-20 overflow-y-auto scrollbar-none print:hidden"
      aria-label="Navigasi utama"
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            className={`relative w-16 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
            <span className="leading-tight text-center px-0.5">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
