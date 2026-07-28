import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Download, Printer } from 'lucide-react';
import { SchoolConfig, ClassRoom, Student, GradeType, Grade, User } from '../../types';
import { KopSurat } from '../KopSurat';
import { StorageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface GradeReportTabProps {
  currentUser: User;
  schoolConfig: SchoolConfig;
  classes: ClassRoom[];
}

export const GradeReportTab: React.FC<GradeReportTabProps> = ({ currentUser, schoolConfig, classes }) => {
  const isAdmin = currentUser.role === 'admin';
  const scopedClasses = (isAdmin || !currentUser.classIds || currentUser.classIds.length === 0)
    ? classes
    : classes.filter(c => currentUser.classIds!.includes(c.id));

  const [classId, setClassId] = useState(scopedClasses[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeTypes, setGradeTypes] = useState<GradeType[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    Promise.all([
      StorageService.getStudents(classId),
      StorageService.getGradeTypes(),
      StorageService.getGrades(),
    ]).then(([studentList, allTypes, allGrades]) => {
      setStudents(studentList);
      let typesForClass = allTypes.filter(t => t.classId === classId);
      if (!isAdmin) typesForClass = typesForClass.filter(t => t.teacherId === currentUser.id);
      const subjectList = [...new Set(typesForClass.map(t => t.subject))];
      setSubjects(subjectList);
      const activeSubject = subjectList.includes(subject) ? subject : (subjectList[0] || '');
      setSubject(activeSubject);
      setGradeTypes(typesForClass.filter(t => t.subject === activeSubject));
      setGrades(allGrades.filter(g => g.classId === classId && g.subject === activeSubject));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!subject) return;
    StorageService.getGradeTypes().then(allTypes => {
      let filtered = allTypes.filter(t => t.classId === classId && t.subject === subject);
      if (!isAdmin) filtered = filtered.filter(t => t.teacherId === currentUser.id);
      setGradeTypes(filtered);
    });
    StorageService.getGrades().then(allGrades => {
      setGrades(allGrades.filter(g => g.classId === classId && g.subject === subject));
    });
  }, [subject, classId, isAdmin, currentUser.id]);

  const finalGrades = useMemo(() => {
    return students.map(s => {
      let weightedTotal = 0;
      let weightUsed = 0;
      const breakdown = gradeTypes.map(type => {
        const typeGrades = grades.filter(g => g.studentId === s.id && g.gradeTypeId === type.id);
        const avg = typeGrades.length > 0 ? typeGrades.reduce((a, g) => a + g.score, 0) / typeGrades.length : null;
        if (avg !== null) {
          weightedTotal += avg * (type.weight / 100);
          weightUsed += type.weight;
        }
        return { typeName: type.name, avg };
      });
      const final = weightUsed > 0 ? weightedTotal / (weightUsed / 100) : null;
      return { student: s, breakdown, final };
    });
  }, [students, gradeTypes, grades]);

  const handleExportExcel = () => {
    const className = classes.find(c => c.id === classId)?.name || classId;
    const rows = finalGrades.map((fg, idx) => {
      const row: any = { 'No': idx + 1, 'Nama Siswa': fg.student.name, 'NISN': fg.student.nisn };
      fg.breakdown.forEach(b => { row[b.typeName] = b.avg !== null ? b.avg.toFixed(1) : '-'; });
      row['Nilai Akhir'] = fg.final !== null ? fg.final.toFixed(1) : '-';
      return row;
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Laporan Nilai');
    XLSX.writeFile(wb, `Laporan_Nilai_${subject}_${className}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>Laporan Penilaian</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rekap nilai akhir per kelas & mata pelajaran, siap cetak dengan kop surat.</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100">
              {scopedClasses.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Mata Pelajaran</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100">
              {subjects.length === 0 && <option value="">Belum ada data nilai</option>}
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900">
        <KopSurat
          config={schoolConfig}
          title="LAPORAN NILAI AKHIR SISWA"
          subtitle={`Kelas: ${classes.find(c => c.id === classId)?.name || '-'} | Mata Pelajaran: ${subject || '-'}`}
        />

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse border border-slate-800 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-center border-b border-slate-800">
                <th className="border border-slate-800 p-2 w-8">No</th>
                <th className="border border-slate-800 p-2">Nama Siswa</th>
                {gradeTypes.map(t => (
                  <th key={t.id} className="border border-slate-800 p-2 w-20">{t.name} ({t.weight}%)</th>
                ))}
                <th className="border border-slate-800 p-2 w-20">Nilai Akhir</th>
              </tr>
            </thead>
            <tbody>
              {finalGrades.map((fg, i) => (
                <tr key={fg.student.id}>
                  <td className="border border-slate-800 p-2 text-center font-sans">{i + 1}</td>
                  <td className="border border-slate-800 p-2 font-sans">{fg.student.name}</td>
                  {fg.breakdown.map((b, j) => (
                    <td key={j} className="border border-slate-800 p-2 text-center font-sans">{b.avg !== null ? b.avg.toFixed(1) : '-'}</td>
                  ))}
                  <td className="border border-slate-800 p-2 text-center font-sans font-bold">{fg.final !== null ? fg.final.toFixed(1) : '-'}</td>
                </tr>
              ))}
              {!loading && finalGrades.length === 0 && (
                <tr><td colSpan={2 + gradeTypes.length + 1} className="border border-slate-800 p-6 text-center text-slate-500 font-sans italic">Belum ada data nilai untuk kelas & mapel ini.</td></tr>
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
            <p className="text-slate-600">{schoolConfig.city.replace(/^(Kota|Kabupaten)\s+/i, '')}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold text-slate-900">Guru Mata Pelajaran</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">{currentUser.name}</p>
            <p className="text-[11px] text-slate-600">NIP. {currentUser.nip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
