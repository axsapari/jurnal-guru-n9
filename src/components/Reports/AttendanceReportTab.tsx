import React, { useState, useMemo } from 'react';
import { Users, Download, Printer } from 'lucide-react';
import { JournalEntry, SchoolConfig, ClassRoom, Student, AttendanceStatus } from '../../types';
import { KopSurat } from '../KopSurat';
import * as XLSX from 'xlsx';

interface AttendanceReportTabProps {
  journals: JournalEntry[];
  schoolConfig: SchoolConfig;
  classes: ClassRoom[];
  students: Student[];
}

const STATUS_LETTER: Record<AttendanceStatus, string> = { hadir: 'H', sakit: 'S', izin: 'I', alpa: 'A' };

export const AttendanceReportTab: React.FC<AttendanceReportTabProps> = ({ journals, schoolConfig, classes, students }) => {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Mapel yang tersedia untuk kelas ini (dari jurnal yang sudah pernah diisi)
  const subjectsInClass = useMemo(() => {
    const list = [...new Set(journals.filter(j => j.classId === classId).map(j => j.subject))];
    return list.sort();
  }, [journals, classId]);

  const activeSubject = subjectsInClass.includes(subject) ? subject : (subjectsInClass[0] || '');

  // Jurnal (=pertemuan) untuk kelas + mapel + rentang tanggal yang dipilih.
  // Diurutkan per tanggal karena satu tanggal bisa punya lebih dari satu pertemuan (jam berbeda).
  const meetings = useMemo(() => {
    return journals
      .filter(j => j.classId === classId && j.subject === activeSubject)
      .filter(j => (!startDate || j.date >= startDate) && (!endDate || j.date <= endDate))
      .sort((a, b) => a.date === b.date ? a.timeSlot.localeCompare(b.timeSlot) : a.date.localeCompare(b.date));
  }, [journals, classId, activeSubject, startDate, endDate]);

  const classStudents = useMemo(() => students.filter(s => s.classId === classId), [students, classId]);

  // Matriks: satu baris per siswa, satu kolom per pertemuan (tanggal), isinya H/S/I/A
  const matrix = useMemo(() => {
    return classStudents.map(s => {
      const cells = meetings.map(m => m.attendance?.[s.id] || null);
      const counts = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
      cells.forEach(c => { if (c) counts[c]++; });
      const total = counts.hadir + counts.sakit + counts.izin + counts.alpa;
      const percentHadir = total > 0 ? (counts.hadir / total) * 100 : null;
      return { student: s, cells, counts, total, percentHadir };
    });
  }, [classStudents, meetings]);

  const handleExportExcel = () => {
    const className = classes.find(c => c.id === classId)?.name || classId;
    const rows = matrix.map((r, i) => {
      const row: any = { 'No': i + 1, 'Nama Siswa': r.student.name, 'NISN': r.student.nisn };
      meetings.forEach((m, mi) => { row[m.date] = r.cells[mi] ? STATUS_LETTER[r.cells[mi]!] : ''; });
      row['Hadir'] = r.counts.hadir;
      row['Sakit'] = r.counts.sakit;
      row['Izin'] = r.counts.izin;
      row['Alpa'] = r.counts.alpa;
      row['% Hadir'] = r.percentHadir !== null ? r.percentHadir.toFixed(1) : '-';
      return row;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Daftar Hadir');
    XLSX.writeFile(wb, `Daftar_Hadir_${activeSubject}_${className}.xlsx`);
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar hadir per pertemuan (tanggal) untuk satu kelas & mata pelajaran, lengkap dengan rekap.
            </p>
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
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Mata Pelajaran</label>
            <select value={activeSubject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100">
              {subjectsInClass.length === 0 && <option value="">Belum ada jurnal</option>}
              {subjectsInClass.map(s => <option key={s} value={s}>{s}</option>)}
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
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900">
        <KopSurat
          config={schoolConfig}
          title="DAFTAR HADIR SISWA"
          subtitle={`Kelas: ${classes.find(c => c.id === classId)?.name || '-'} | Mata Pelajaran: ${activeSubject || '-'} | Periode: ${startDate || 'Semua'} s.d. ${endDate || 'Sekarang'}`}
        />

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse border border-slate-800 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-center border-b border-slate-800">
                <th className="border border-slate-800 p-1.5 w-6">No</th>
                <th className="border border-slate-800 p-1.5 text-left min-w-[120px]">Nama Siswa</th>
                {meetings.map(m => (
                  <th key={m.id} className="border border-slate-800 p-1 w-8" title={`${m.date} — ${m.timeSlot}`}>
                    {m.date.slice(8, 10)}/{m.date.slice(5, 7)}
                  </th>
                ))}
                <th className="border border-slate-800 p-1 w-8 bg-emerald-50">H</th>
                <th className="border border-slate-800 p-1 w-8 bg-blue-50">S</th>
                <th className="border border-slate-800 p-1 w-8 bg-amber-50">I</th>
                <th className="border border-slate-800 p-1 w-8 bg-rose-50">A</th>
                <th className="border border-slate-800 p-1 w-10">% H</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((r, i) => (
                <tr key={r.student.id}>
                  <td className="border border-slate-800 p-1 text-center font-sans">{i + 1}</td>
                  <td className="border border-slate-800 p-1 font-sans">{r.student.name}</td>
                  {r.cells.map((c, ci) => (
                    <td key={ci} className={`border border-slate-800 p-1 text-center font-sans font-bold ${c === 'alpa' ? 'text-rose-700' : c === 'sakit' ? 'text-blue-700' : c === 'izin' ? 'text-amber-700' : 'text-slate-700'}`}>
                      {c ? STATUS_LETTER[c] : '-'}
                    </td>
                  ))}
                  <td className="border border-slate-800 p-1 text-center font-sans">{r.counts.hadir}</td>
                  <td className="border border-slate-800 p-1 text-center font-sans">{r.counts.sakit}</td>
                  <td className="border border-slate-800 p-1 text-center font-sans">{r.counts.izin}</td>
                  <td className="border border-slate-800 p-1 text-center font-sans">{r.counts.alpa}</td>
                  <td className="border border-slate-800 p-1 text-center font-sans font-bold">{r.percentHadir !== null ? `${r.percentHadir.toFixed(0)}%` : '-'}</td>
                </tr>
              ))}
              {matrix.length === 0 && (
                <tr><td colSpan={meetings.length + 7} className="border border-slate-800 p-6 text-center text-slate-500 font-sans italic">Tidak ada data siswa/jurnal untuk filter ini.</td></tr>
              )}
            </tbody>
          </table>
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
            <p className="font-bold text-slate-900">Guru Mata Pelajaran</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">&nbsp;</p>
            <p className="text-[11px] text-slate-600">NIP. -</p>
          </div>
        </div>
      </div>
    </div>
  );
};
