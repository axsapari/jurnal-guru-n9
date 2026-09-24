import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Save, Minus, Plus, RotateCcw, Download } from 'lucide-react';
import { User, ClassRoom, Student, Participation } from '../../types';
import { StorageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface ParticipationManagementProps {
  currentUser: User;
  classes: ClassRoom[];
}

const DEFAULT_SEMESTER = 'Ganjil';
const DEFAULT_ACADEMIC_YEAR = '2025/2026';

export const ParticipationManagement: React.FC<ParticipationManagementProps> = ({ currentUser, classes }) => {
  const scopedClasses = (currentUser.role === 'admin' || !currentUser.classIds || currentUser.classIds.length === 0)
    ? classes
    : classes.filter(c => currentUser.classIds!.includes(c.id));

  const [classId, setClassId] = useState(scopedClasses[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [allParticipations, setAllParticipations] = useState<Participation[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tab, setTab] = useState<'input' | 'rekap'>('input');

  useEffect(() => {
    if (!classId) return;
    StorageService.getStudents(classId).then(setStudents);
    StorageService.getParticipations().then(setAllParticipations);
  }, [classId]);

  useEffect(() => {
    // Pre-fill scores for this date from existing data, default 80 for new entries
    const existingForDate = allParticipations.filter(p => p.classId === classId && p.date === date);
    const initial: Record<string, number> = {};
    students.forEach(s => {
      const existing = existingForDate.find(p => p.studentId === s.id);
      initial[s.id] = existing ? existing.score : 80;
    });
    setScores(initial);
  }, [students, date, allParticipations, classId]);

  const adjustScore = (studentId: string, delta: number) => {
    setScores(prev => ({ ...prev, [studentId]: Math.max(0, Math.min(100, (prev[studentId] || 0) + delta)) }));
  };

  const resetAll = () => {
    const reset: Record<string, number> = {};
    students.forEach(s => { reset[s.id] = 80; });
    setScores(reset);
  };

  const handleSave = async () => {
    const rows: Participation[] = students.map(s => {
      const existing = allParticipations.find(p => p.studentId === s.id && p.classId === classId && p.date === date);
      return {
        id: existing?.id || 'part-' + Date.now() + '-' + s.id,
        studentId: s.id,
        classId,
        date,
        score: scores[s.id] ?? 80,
        teacherId: currentUser.id,
        semester: DEFAULT_SEMESTER,
        academicYear: DEFAULT_ACADEMIC_YEAR,
      };
    });
    await StorageService.saveParticipations(rows);
    setFeedback(`Keaktifan ${rows.length} siswa untuk tanggal ${date} berhasil disimpan.`);
    setAllParticipations(await StorageService.getParticipations());
    setTimeout(() => setFeedback(null), 3000);
  };

  // Rekap rata-rata keaktifan per siswa di kelas ini
  const recap = useMemo(() => {
    return students.map(s => {
      const entries = allParticipations.filter(p => p.studentId === s.id && p.classId === classId);
      const avg = entries.length > 0 ? entries.reduce((a, p) => a + p.score, 0) / entries.length : null;
      return { student: s, avg, count: entries.length };
    });
  }, [students, allParticipations, classId]);

  const handleExport = () => {
    const className = classes.find(c => c.id === classId)?.name || classId;
    const rows = recap.map((r, i) => ({
      'No': i + 1, 'Nama Siswa': r.student.name, 'Rata-rata Keaktifan': r.avg !== null ? r.avg.toFixed(1) : '-', 'Jumlah Pertemuan Dinilai': r.count,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Keaktifan');
    XLSX.writeFile(wb, `Rekap_Keaktifan_${className}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
          <span>Keaktifan Siswa</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Catat skor partisipasi/keaktifan siswa per pertemuan (0-100), terpisah dari nilai akademik.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100">
              {scopedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100" />
          </div>
        </div>

        <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-800">
          {[{ id: 'input', label: 'Input Keaktifan' }, { id: 'rekap', label: 'Rekap Rata-rata' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition cursor-pointer ${tab === t.id ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'input' ? (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          {feedback && (
            <div className="p-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {feedback}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={resetAll} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
              <RotateCcw size={12} /> Reset semua ke 80
            </button>
          </div>
          <div className="space-y-1.5">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">{s.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustScore(s.id, -5)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer">
                    <Minus size={12} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white">{scores[s.id] ?? 80}</span>
                  <button onClick={() => adjustScore(s.id, 5)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
            {students.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Belum ada siswa di kelas ini.</p>}
          </div>
          {students.length > 0 && (
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-2">
                <Save size={15} /> Simpan Keaktifan
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Rekap Rata-rata Keaktifan</h3>
            <button onClick={handleExport} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer">
              <Download size={13} /> Export Excel
            </button>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-4 py-2 font-bold">Nama Siswa</th>
                <th className="text-center px-4 py-2 font-bold">Rata-rata</th>
                <th className="text-center px-4 py-2 font-bold">Jumlah Pertemuan</th>
              </tr>
            </thead>
            <tbody>
              {recap.map(r => (
                <tr key={r.student.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-medium">{r.student.name}</td>
                  <td className="text-center px-4 py-2 font-bold text-indigo-700 dark:text-indigo-400">{r.avg !== null ? r.avg.toFixed(1) : '-'}</td>
                  <td className="text-center px-4 py-2 text-slate-500 dark:text-slate-400">{r.count}</td>
                </tr>
              ))}
              {recap.length === 0 && (
                <tr><td colSpan={3} className="text-center py-6 text-slate-400 dark:text-slate-500 italic">Belum ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
