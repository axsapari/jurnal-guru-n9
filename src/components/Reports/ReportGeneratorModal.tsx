import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Filter, 
  Calendar, BookOpen, Users, Camera, ShieldCheck
} from 'lucide-react';
import { JournalEntry, SchoolConfig, ClassRoom, User } from '../../types';
import { KopSurat } from '../KopSurat';
import { ExportUtils } from '../../utils/exportUtils';

interface ReportGeneratorModalProps {
  journals: JournalEntry[];
  schoolConfig: SchoolConfig;
  classes: ClassRoom[];
  teachers: User[];
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  journals,
  schoolConfig,
  classes,
  teachers
}) => {
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterTeacher, setFilterTeacher] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter journals
  const reportJournals = journals.filter(j => {
    const matchesClass = filterClass === 'ALL' || j.classId === filterClass;
    const matchesTeacher = filterTeacher === 'ALL' || j.teacherId === filterTeacher;
    const matchesStart = !startDate || j.date >= startDate;
    const matchesEnd = !endDate || j.date <= endDate;
    return matchesClass && matchesTeacher && matchesStart && matchesEnd;
  });

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportExcel = () => {
    ExportUtils.exportJournalsToExcel(reportJournals, schoolConfig);
  };

  return (
    <div className="space-y-6">
      {/* Print Hide Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-indigo-600" />
              <span>Rekapitulasi Laporan Jurnal & Absensi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cetak laporan resmi ber-Kop Surat Sekolah lengkap dengan foto laporan visual per pertemuan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Cetak PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Kelas</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Guru</label>
            <select
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Guru</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Printable Paper Area (Forma A4 Layout) */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900">
        
        {/* Kop Surat Sekolah */}
        <KopSurat
          config={schoolConfig}
          title="LAPORAN REKAPITULASI JURNAL HARIAN MENGAJAR DAN ABSENSI SISWA"
          subtitle={`Periode: ${startDate || 'Semua'} s.d. ${endDate || 'Sekarang'} | Filter Kelas: ${filterClass === 'ALL' ? 'Semua Kelas' : filterClass}`}
        />

        {/* Report Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-center border-b border-slate-800">
                <th className="border border-slate-800 p-2 w-8">No</th>
                <th className="border border-slate-800 p-2 w-24">Tanggal & Jam</th>
                <th className="border border-slate-800 p-2 w-28">Guru & Mapel</th>
                <th className="border border-slate-800 p-2 w-12">Kelas</th>
                <th className="border border-slate-800 p-2">Tujuan Pembelajaran (TP) & Ringkasan</th>
                <th className="border border-slate-800 p-2 w-24">Kehadiran (H/S/I/A)</th>
                <th className="border border-slate-800 p-2 w-28">Catatan Kejadian</th>
                <th className="border border-slate-800 p-2 w-28 text-center">Foto Visual Laporan</th>
              </tr>
            </thead>
            <tbody>
              {reportJournals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-800 p-6 text-center text-slate-500 font-sans italic">
                    Tidak ada data jurnal sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                reportJournals.map((j, idx) => (
                  <tr key={j.id} className="align-top hover:bg-slate-50/50">
                    <td className="border border-slate-800 p-2 text-center font-bold font-sans">{idx + 1}</td>
                    <td className="border border-slate-800 p-2 font-sans">
                      <p className="font-bold">{j.date}</p>
                      <p className="text-[10px] text-slate-600">{j.timeSlot}</p>
                    </td>
                    <td className="border border-slate-800 p-2 font-sans">
                      <p className="font-bold">{j.teacherName}</p>
                      <p className="text-[10px] text-indigo-900 italic">{j.subject}</p>
                    </td>
                    <td className="border border-slate-800 p-2 text-center font-bold font-sans">{j.className}</td>
                    <td className="border border-slate-800 p-2 font-sans leading-relaxed">
                      {j.tpDescriptions.length > 0 && (
                        <p className="font-semibold text-slate-900 mb-1">
                          TP: {j.tpDescriptions.join('; ')}
                        </p>
                      )}
                      <p className="text-slate-800">{j.summary}</p>
                    </td>
                    <td className="border border-slate-800 p-2 font-sans text-xs">
                      <p className="font-semibold text-emerald-800">Hadir: {j.attendanceSummary.hadir}</p>
                      <p className="text-blue-800">Sakit: {j.attendanceSummary.sakit}</p>
                      <p className="text-amber-800">Izin: {j.attendanceSummary.izin}</p>
                      <p className="text-rose-800">Alpa: {j.attendanceSummary.alpa}</p>
                    </td>
                    <td className="border border-slate-800 p-2 font-sans text-[10px]">
                      {j.incidents.length === 0 ? (
                        <span className="text-slate-400 italic">Nihil</span>
                      ) : (
                        j.incidents.map(inc => (
                          <p key={inc.id} className="mb-0.5">
                            <span className="font-bold">{inc.studentName}</span>: {inc.note}
                          </p>
                        ))
                      )}
                    </td>
                    <td className="border border-slate-800 p-2 text-center font-sans">
                      {j.photoUrl ? (
                        <div className="space-y-1">
                          <img 
                            src={j.photoUrl} 
                            alt="Bukti Visual" 
                            className="w-20 h-16 object-cover mx-auto rounded border border-slate-300" 
                          />
                          <p className="text-[8px] font-mono text-slate-500 break-all">
                            {j.photoFileName || j.photoDriveId}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Tanpa Foto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signature Section */}
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
