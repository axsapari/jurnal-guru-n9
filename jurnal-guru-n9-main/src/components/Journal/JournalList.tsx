import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, Calendar, Users, Camera, 
  Trash2, Eye, FileSpreadsheet, CheckCircle2, Clock, X, FileText, Check, AlertTriangle
} from 'lucide-react';
import { JournalEntry, ClassRoom, User, AttendanceStatus } from '../../types';
import { StorageService } from '../../services/storageService';

interface JournalListProps {
  journals: JournalEntry[];
  classes: ClassRoom[];
  teachers: User[];
  currentUser: User;
  onRefresh: () => void;
  onOpenNewJournal: () => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  journals,
  classes,
  teachers,
  currentUser,
  onRefresh,
  onOpenNewJournal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState('ALL');
  const [viewingJournal, setViewingJournal] = useState<JournalEntry | null>(null);

  // Filter journals
  const filteredJournals = journals.filter(j => {
    const matchesSearch = 
      j.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.className.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'ALL' || j.classId === selectedClass;
    const matchesTeacher = selectedTeacher === 'ALL' || j.teacherId === selectedTeacher;

    return matchesSearch && matchesClass && matchesTeacher;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal harian ini?')) {
      await StorageService.deleteJournalEntry(id);
      if (viewingJournal?.id === id) setViewingJournal(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-white">
              <BookOpen size={20} className="text-indigo-600" />
              <span>Daftar Jurnal Harian Mengajar</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400 dark:text-slate-500">
              Total {filteredJournals.length} catatan kegiatan & absensi terdaftar
            </p>
          </div>

          <button
            onClick={onOpenNewJournal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Buat Jurnal Harian</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Cari mata pelajaran, guru, materi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800/60 dark:text-white dark:border-slate-800"
            />
          </div>

          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-800"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>Kelas {c.name}</option>
            ))}
          </select>

          <select
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-800"
          >
            <option value="ALL">Semua Guru</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Journal Cards List */}
      {filteredJournals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <BookOpen size={36} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada jurnal harian ditemukan</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">Coba ubah kata kunci pencarian atau filter kelas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJournals.map(j => (
            <div
              key={j.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800"
            >
              <div className="space-y-3">
                {/* Card Header: Class & Date */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    Kelas {j.className}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1 dark:text-slate-400 dark:text-slate-500">
                    <Calendar size={13} /> {j.date}
                  </span>
                </div>

                {/* Subject & Teacher */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{j.subject}</h3>
                  <p className="text-xs text-slate-500 font-medium dark:text-slate-400 dark:text-slate-500">{j.teacherName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 dark:text-slate-500 dark:text-slate-400">{j.timeSlot}</p>
                </div>

                {/* Material Summary */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  {j.summary}
                </p>

                {/* Attendance Counter */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold dark:text-slate-300">
                    <Users size={14} className="text-indigo-600" />
                    <span>Hadir: {j.attendanceSummary.hadir}/{j.attendanceSummary.total}</span>
                  </div>

                  {j.photoUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <Camera size={12} /> Foto Drive
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between dark:border-slate-800">
                <button
                  onClick={() => setViewingJournal(j)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Eye size={14} /> Lihat Detail
                </button>

                {(currentUser.role === 'admin' || currentUser.id === j.teacherId) && (
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer dark:text-slate-500 dark:text-slate-400"
                    title="Hapus Jurnal"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journal Details Modal */}
      {viewingJournal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Detail Jurnal Harian Mengajar</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">ID: {viewingJournal.id}</p>
              </div>
              <button
                onClick={() => setViewingJournal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Key Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs dark:bg-slate-800/60 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-semibold block dark:text-slate-500 dark:text-slate-400">Tanggal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingJournal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block dark:text-slate-500 dark:text-slate-400">Kelas</span>
                  <span className="font-bold text-indigo-700">Kelas {viewingJournal.className}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block dark:text-slate-500 dark:text-slate-400">Guru</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingJournal.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block dark:text-slate-500 dark:text-slate-400">Mata Pelajaran</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewingJournal.subject}</span>
                </div>
              </div>

              {/* TP List */}
              {viewingJournal.tpDescriptions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1 dark:text-white">Tujuan Pembelajaran (TP)</h4>
                  <ul className="space-y-1">
                    {viewingJournal.tpDescriptions.map((tp, idx) => (
                      <li key={idx} className="text-xs bg-indigo-50 text-indigo-900 p-2 rounded-xl font-medium">
                        • {tp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Material Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 dark:text-white">Uraian Kegiatan / Ringkasan Materi</h4>
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
                  {viewingJournal.summary}
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 dark:text-white">
                  Rekapitulasi Kehadiran Siswa
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200">
                    <span className="block font-black text-lg">{viewingJournal.attendanceSummary.hadir}</span>
                    <span className="font-bold">Hadir</span>
                  </div>
                  <div className="bg-blue-50 text-blue-800 p-2 rounded-xl border border-blue-200">
                    <span className="block font-black text-lg">{viewingJournal.attendanceSummary.sakit}</span>
                    <span className="font-bold">Sakit</span>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-2 rounded-xl border border-amber-200">
                    <span className="block font-black text-lg">{viewingJournal.attendanceSummary.izin}</span>
                    <span className="font-bold">Izin</span>
                  </div>
                  <div className="bg-rose-50 text-rose-800 p-2 rounded-xl border border-rose-200">
                    <span className="block font-black text-lg">{viewingJournal.attendanceSummary.alpa}</span>
                    <span className="font-bold">Alpa</span>
                  </div>
                </div>
              </div>

              {/* Incidents */}
              {viewingJournal.incidents.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 dark:text-white">Catatan Kejadian Siswa</h4>
                  <div className="space-y-1.5">
                    {viewingJournal.incidents.map(inc => (
                      <div key={inc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs dark:bg-slate-800/60 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">{inc.studentName}</span>: {inc.note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Evidence */}
              {viewingJournal.photoUrl && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 dark:text-white">Foto Laporan Visual (Drive)</h4>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2 dark:bg-slate-800/60 dark:border-slate-800">
                    <img 
                      src={viewingJournal.photoUrl} 
                      alt="Laporan Visual" 
                      className="max-h-60 mx-auto rounded-xl object-cover border border-slate-300 dark:border-slate-700" 
                    />
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      {viewingJournal.photoFileName || viewingJournal.photoDriveId}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right dark:bg-slate-800/60 dark:border-slate-800">
              <button
                onClick={() => setViewingJournal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
