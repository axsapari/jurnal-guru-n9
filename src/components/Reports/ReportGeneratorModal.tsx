import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap } from 'lucide-react';
import { JournalEntry, SchoolConfig, ClassRoom, User, Student } from '../../types';
import { StorageService } from '../../services/storageService';
import { JournalReportTab } from './JournalReportTab';
import { AttendanceReportTab } from './AttendanceReportTab';
import { GradeReportTab } from './GradeReportTab';

interface ReportGeneratorModalProps {
  journals: JournalEntry[];
  schoolConfig: SchoolConfig;
  classes: ClassRoom[];
  teachers: User[];
}

type ReportTab = 'journal' | 'attendance' | 'grades';

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  journals,
  schoolConfig,
  classes,
  teachers
}) => {
  const [tab, setTab] = useState<ReportTab>('journal');
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    StorageService.getStudents().then(setStudents);
  }, []);

  const tabs = [
    { id: 'journal' as ReportTab, label: 'Laporan Jurnal Guru', icon: BookOpen },
    { id: 'attendance' as ReportTab, label: 'Laporan Kehadiran Siswa', icon: Users },
    { id: 'grades' as ReportTab, label: 'Laporan Penilaian', icon: GraduationCap },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'journal' && (
        <JournalReportTab journals={journals} schoolConfig={schoolConfig} classes={classes} teachers={teachers} />
      )}
      {tab === 'attendance' && (
        <AttendanceReportTab journals={journals} schoolConfig={schoolConfig} classes={classes} students={students} />
      )}
      {tab === 'grades' && (
        <GradeReportTab schoolConfig={schoolConfig} classes={classes} />
      )}
    </div>
  );
};
