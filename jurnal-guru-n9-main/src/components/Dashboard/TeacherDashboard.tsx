import React from 'react';
import { 
  BookOpen, PlusCircle, CheckCircle, Clock, Calendar, 
  Users, Sparkles, FileText, Camera, AlertCircle 
} from 'lucide-react';
import { User, JournalEntry, ClassRoom } from '../../types';

interface TeacherDashboardProps {
  currentUser: User;
  journals: JournalEntry[];
  classes: ClassRoom[];
  onOpenJournalForm: () => void;
  onViewJournalDetails: (entry: JournalEntry) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  journals,
  classes,
  onOpenJournalForm,
  onViewJournalDetails
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // My journals
  const myJournals = journals.filter(j => j.teacherId === currentUser.id);
  const todayMyJournals = myJournals.filter(j => j.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-100 text-xs font-semibold backdrop-blur-xs">
              <Sparkles size={14} className="text-amber-300" />
              <span>Jurnal Harian Guru Aktif</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Selamat Datang, {currentUser.name}
            </h2>
            <p className="text-sm text-indigo-200">
              Mata Pelajaran: <span className="font-semibold text-white">{currentUser.subject || 'Guru Kelas'}</span> | NIP: {currentUser.nip}
            </p>
          </div>

          <button
            onClick={onOpenJournalForm}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg transition cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Isi Jurnal Hari Ini</span>
          </button>
        </div>
      </div>

      {/* Today's Alert Banner */}
      {todayMyJournals.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">Anda Belum Mengisi Jurnal Mengajar Hari Ini</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Jangan lupa mencatat kegiatan pembelajaran, TP, absensi siswa, dan mengunggah foto laporan visual.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenJournalForm}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            + Buat Sekarang
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
          <CheckCircle size={22} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-950">
              Jurnal Hari Ini Sudah Terisi ({todayMyJournals.length} Pertemuan)
            </p>
            <p className="text-xs text-emerald-800">
              Terima kasih telah mendokumentasikan kegiatan mengajar dan absensi siswa dengan tertib.
            </p>
          </div>
        </div>
      )}

      {/* My Journal History List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 dark:text-white">
            <BookOpen size={18} className="text-indigo-600" />
            <span>Riwayat Jurnal Harian Saya ({myJournals.length})</span>
          </h3>
          <button
            onClick={onOpenJournalForm}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            + Tambah Jurnal
          </button>
        </div>

        {myJournals.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Belum ada riwayat jurnal harian. Klik tombol di atas untuk mengisi jurnal pertama Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myJournals.map(j => (
              <div
                key={j.id}
                onClick={() => onViewJournalDetails(j)}
                className="border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 hover:shadow-md transition cursor-pointer bg-white space-y-3 dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">
                    Kelas {j.className}
                  </span>
                  <span className="text-xs text-slate-500 font-medium dark:text-slate-400 dark:text-slate-500">{j.date}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{j.subject}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400 dark:text-slate-500">{j.timeSlot}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg dark:bg-slate-800/60 dark:text-slate-400 dark:text-slate-500">
                  {j.summary}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <Users size={14} className="text-indigo-500" />
                    <span>Hadir: {j.attendanceSummary.hadir}/{j.attendanceSummary.total}</span>
                  </div>

                  {j.syncStatus === 'pending' ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Offline (Tersimpan Lokal)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tersinkron
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
