import React, { useState, useMemo } from 'react';
import { Users, Download, Printer } from 'lucide-react';
import { JournalEntry, SchoolConfig, ClassRoom, Student } from '../../types';
import { KopSurat } from '../KopSurat';
import * as XLSX from 'xlsx';

interface AttendanceReportTabProps {
  journals: JournalEntry[];
  schoolConfig: SchoolConfig;
  classes: ClassRoom[];
  students: Student[];
}

type ViewMode = 'per-siswa' | 'per-tanggal';

export const AttendanceReportTab: React.FC<AttendanceReportTabProps> = ({ journals, schoolConfig, classes, students }) => {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [view, setView] = useState<ViewMode>('per-siswa');

  const filteredJournals = useMemo(() => journals.filter(j => {
    const matchesClass = !classId || j.classId === classId;
    const matchesStart = !startDate || j.date >= startDate;
    const matchesEnd = !endDate || j.date <= endDate;
    return matchesClass && matchesStart && matchesEnd;
  }), [journals, classId, startDate, endDate]);

  const classStudents = useMemo(() => students.filter(s => s.classId === classId), [students, classId]);

  // Rekap per siswa: total H/S/I/A untuk setiap siswa di kelas ini
  const perStudentRecap = useMemo(() => {
    return classStudents.map(s => {
      const counts = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
      filteredJournals.forEach(j => {
        const status = j.attendance?.[s.id];
        if (status) counts[status]++;
      });
      const total = counts.hadir + counts.sakit + counts.izin + counts.alpa;
      const percentHadir = total > 0 ? (counts.hadir / total) * 100 : null;
      return { student: s, counts, total, percentHadir };
    });
  }, [classStudents, filteredJournals]);

  // Rekap per tanggal: total H/S/I/A untuk setiap pertemuan (tanggal) di kelas ini
  const perDateRecap = useMemo(() => {
    const byDate = new Map<string, { hadir: number; sakit: number; izin: number; alpa: number; total: number }>();
    filteredJournals.forEach(j => {
      const existing = byDate.get(j.date) || { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 };
      existing.hadir += j.attendanceSummary.hadir;
      existing.sakit += j.attendanceSummary.sakit;
      existing.izin += j.attendanceSummary.izin;
      existing.alpa += j.attendanceSummary.alpa;
      existing.total += j.attendanceSummary.total;
      byDate.set(j.date, existing);
    });
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredJournals]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const studentRows = perStudentRecap.map((r, i) => ({
      'No': i + 1, 'Nama Siswa': r.student.name, 'NISN': r.student.nisn,
      'Hadir': r.counts.hadir, 'Sakit': r.counts.sakit, 'Izin': r.counts.izin, 'Alpa': r.counts.alpa,
      'Total Pertemuan': r.total, '% Kehadiran': r.percentHadir !== null ? r.percentHadir.toFixed(1) : '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'Rekap per Siswa');

    const dateRows = perDateRecap.map(([date, c], i) => ({
      'No': i + 1, 'Tanggal': date, 'Hadir': c.hadir, 'Sakit': c.sakit, 'Izin': c.izin, 'Alpa': c.alpa, 'Total': c.total,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dateRows), 'Rekap per Tanggal');

    const className = classes.find(c => c.id === classId)?.name || classId;
    XLSX.writeFile(wb, `Rekap_Kehadiran_${className}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>Laporan Kehadiran Siswa</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rekap kehadiran per siswa dan per tanggal pertemuan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">
              <Download size={14} /> <span>Export Excel</span>
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">
              <Printer size={14} /> <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100">
              {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tampilan</label>
            <select value={view} onChange={e => setView(e.target.value as ViewMode)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100">
              <option value="per-siswa">Rekap per Siswa</option>
              <option value="per-tanggal">Rekap per Tanggal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900">
        <KopSurat
          config={schoolConfig}
          title={`LAPORAN KEHADIRAN SISWA — ${view === 'per-siswa' ? 'REKAP PER SISWA' : 'REKAP PER TANGGAL'}`}
          subtitle={`Kelas: ${classes.find(c => c.id === classId)?.name || '-'} | Periode: ${startDate || 'Semua'} s.d. ${endDate || 'Sekarang'}`}
        />

        <div className="overflow-x-auto mt-4">
          {view === 'per-siswa' ? (
            <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-center border-b border-slate-800">
                  <th className="border border-slate-800 p-2 w-8">No</th>
                  <th className="border border-slate-800 p-2">Nama Siswa</th>
                  <th className="border border-slate-800 p-2 w-16">Hadir</th>
                  <th className="border border-slate-800 p-2 w-16">Sakit</th>
                  <th className="border border-slate-800 p-2 w-16">Izin</th>
                  <th className="border border-slate-800 p-2 w-16">Alpa</th>
                  <th className="border border-slate-800 p-2 w-20">% Hadir</th>
                </tr>
              </thead>
              <tbody>
                {perStudentRecap.map((r, i) => (
                  <tr key={r.student.id}>
                    <td className="border border-slate-800 p-2 text-center font-sans">{i + 1}</td>
                    <td className="border border-slate-800 p-2 font-sans">{r.student.name}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{r.counts.hadir}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{r.counts.sakit}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{r.counts.izin}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{r.counts.alpa}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans font-bold">{r.percentHadir !== null ? `${r.percentHadir.toFixed(0)}%` : '-'}</td>
                  </tr>
                ))}
                {perStudentRecap.length === 0 && (
                  <tr><td colSpan={7} className="border border-slate-800 p-6 text-center text-slate-500 font-sans italic">Tidak ada data siswa/jurnal untuk filter ini.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-center border-b border-slate-800">
                  <th className="border border-slate-800 p-2 w-8">No</th>
                  <th className="border border-slate-800 p-2">Tanggal</th>
                  <th className="border border-slate-800 p-2 w-16">Hadir</th>
                  <th className="border border-slate-800 p-2 w-16">Sakit</th>
                  <th className="border border-slate-800 p-2 w-16">Izin</th>
                  <th className="border border-slate-800 p-2 w-16">Alpa</th>
                  <th className="border border-slate-800 p-2 w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {perDateRecap.map(([date, c], i) => (
                  <tr key={date}>
                    <td className="border border-slate-800 p-2 text-center font-sans">{i + 1}</td>
                    <td className="border border-slate-800 p-2 font-sans font-bold">{date}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{c.hadir}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{c.sakit}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{c.izin}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans">{c.alpa}</td>
                    <td className="border border-slate-800 p-2 text-center font-sans font-bold">{c.total}</td>
                  </tr>
                ))}
                {perDateRecap.length === 0 && (
                  <tr><td colSpan={7} className="border border-slate-800 p-6 text-center text-slate-500 font-sans italic">Tidak ada data jurnal untuk filter ini.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-12 flex justify-between items-end font-sans text-xs pt-6">
          <div className="text-center w-60">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala Sekolah</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">{schoolConfig.headmasterName}</p>
            <p className="text-[11px] text-slate-600">NIP. {schoolConfig.headmasterNip}</p>
          </div>
          <div className="text-center w-60">
            <p className="text-slate-600">{schoolConfig.city}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold text-slate-900">Petugas / Pembuat Laporan</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">{schoolConfig.headmasterName}</p>
            <p className="text-[11px] text-slate-600">NIP. {schoolConfig.headmasterNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
