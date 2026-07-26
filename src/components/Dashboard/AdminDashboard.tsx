import React from 'react';
import { 
  Users, BookOpen, CheckCircle, Clock, AlertCircle, Send, 
  FileText, TrendingUp, Camera, Award, ArrowUpRight, ShieldCheck, HeartPulse
} from 'lucide-react';
import { JournalEntry, User, ClassRoom } from '../../types';

interface AdminDashboardProps {
  journals: JournalEntry[];
  teachers: User[];
  classes: ClassRoom[];
  onOpenJournalForm: () => void;
  onSendReminder: (teacher: User) => void;
  onViewJournalDetails: (entry: JournalEntry) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  journals,
  teachers,
  classes,
  onOpenJournalForm,
  onSendReminder,
  onViewJournalDetails
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's journals
  const todayJournals = journals.filter(j => j.date === todayStr);

  // Active teaching teachers (excluding admin)
  const activeTeachers = teachers.filter(t => t.role === 'teacher');
  const teacherCount = activeTeachers.length;

  // Teachers who submitted today
  const submittedTeacherIds = new Set(todayJournals.map(j => j.teacherId));
  const submittedCount = submittedTeacherIds.size;
  const progressPercent = teacherCount > 0 ? Math.round((submittedCount / teacherCount) * 100) : 0;

  // Calculate attendance statistics
  let totalHadir = 0;
  let totalSakit = 0;
  let totalIzin = 0;
  let totalAlpa = 0;
  let totalSiswaLogged = 0;

  journals.forEach(j => {
    totalHadir += j.attendanceSummary.hadir;
    totalSakit += j.attendanceSummary.sakit;
    totalIzin += j.attendanceSummary.izin;
    totalAlpa += j.attendanceSummary.alpa;
    totalSiswaLogged += j.attendanceSummary.total;
  });

  const attendanceRate = totalSiswaLogged > 0 
    ? Math.round((totalHadir / totalSiswaLogged) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-indigo-300 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Dashboard Admin & Kepala Sekolah</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Progres Pengisian Jurnal Mengajar Real-time
            </h2>
            <p className="text-sm text-indigo-200 leading-relaxed">
              Pantau kehadiran siswa, ketercapaian Tujuan Pembelajaran (TP), dan kelengkapan foto laporan harian secara otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenJournalForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
            >
              <BookOpen size={16} />
              <span>+ Buat Jurnal Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 dark:text-white">
              <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Capaian Jurnal Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 dark:text-slate-500">
              {submittedCount} dari {teacherCount} guru mata pelajaran telah mengisi jurnal harian
            </p>
          </div>
          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Journals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider dark:text-slate-500">Total Jurnal Logged</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{journals.length}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle size={12} /> {todayJournals.length} dibuat hari ini
            </p>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <HeartPulse size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider dark:text-slate-500">Tingkat Kehadiran Siswa</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{attendanceRate}%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 dark:text-slate-500">
              Hadir: {totalHadir} | Sakit: {totalSakit} | Alpa: {totalAlpa}
            </p>
          </div>
        </div>

        {/* Card 3: Classes Monitored */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider dark:text-slate-500">Kelas Terdaftar</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{classes.length} Kelas</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 dark:text-slate-500">
              Daftar siswa & member aktif
            </p>
          </div>
        </div>

        {/* Card 4: Drive Visual Evidence */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Camera size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider dark:text-slate-500">Foto Laporan Drive</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {journals.filter(j => j.photoUrl).length} Foto
            </p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              Tersimpan dengan ID Otomatis
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Status & Quick Reminder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status Pengisian Guru */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 dark:text-white">
              <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Status Pengisian Guru Hari Ini</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Total {activeTeachers.length} Guru
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {activeTeachers.map(teacher => {
              const hasSubmitted = submittedTeacherIds.has(teacher.id);
              const teacherJournalCount = todayJournals.filter(j => j.teacherId === teacher.id).length;

              return (
                <div key={teacher.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition dark:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <img 
                      src={teacher.avatar} 
                      alt={teacher.name} 
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 dark:text-white">{teacher.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">{teacher.subject} • NIP: {teacher.nip}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800">
                        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Sudah Mengisi ({teacherJournalCount})</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200/60 dark:border-amber-800">
                          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                          <span>Belum Mengisi</span>
                        </span>

                        <button
                          onClick={() => onSendReminder(teacher)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition cursor-pointer"
                          title="Kirim pengingat WhatsApp / Notifikasi"
                        >
                          <Send size={12} />
                          <span>Ingatkan</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Recent Visual Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 dark:text-white">
            <Camera size={18} className="text-rose-600 dark:text-rose-400" />
            <span>Laporan Visual Terbaru</span>
          </h3>

          <div className="space-y-3">
            {journals.slice(0, 3).map(j => (
              <div 
                key={j.id} 
                onClick={() => onViewJournalDetails(j)}
                className="group border border-slate-100 dark:border-slate-800 rounded-xl p-3 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xs transition cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 dark:bg-slate-800/60"
              >
                <div className="flex gap-3">
                  {j.photoUrl ? (
                    <img 
                      src={j.photoUrl} 
                      alt="Bukti Mengajar" 
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 group-hover:opacity-90 border border-slate-200 dark:border-slate-700 dark:border-slate-800" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs dark:text-slate-500">
                      No Photo
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded">
                        Kelas {j.className}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400">{j.date}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 truncate dark:text-white">{j.subject}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate dark:text-slate-500">{j.teacherName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
