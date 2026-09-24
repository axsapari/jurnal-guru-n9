import React, { useState, useEffect, useMemo } from 'react';
import { X, User as UserIcon, CheckCircle2, GraduationCap, Sparkles, AlertTriangle } from 'lucide-react';
import { Student, JournalEntry, Grade, Participation, IncidentRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface StudentProfileModalProps {
  student: Student | null;
  journals: JournalEntry[]; // semua jurnal (akan difilter untuk kelas siswa ini)
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, journals, onClose }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    Promise.all([StorageService.getGrades(), StorageService.getParticipations()]).then(([g, p]) => {
      setGrades(g.filter(x => x.studentId === student.id));
      setParticipations(p.filter(x => x.studentId === student.id));
      setLoading(false);
    });
  }, [student]);

  const classJournals = useMemo(() => {
    if (!student) return [];
    return journals.filter(j => j.classId === student.classId);
  }, [journals, student]);

  const attendanceSummary = useMemo(() => {
    const counts = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
    classJournals.forEach(j => {
      const status = j.attendance?.[student?.id || ''];
      if (status) counts[status]++;
    });
    const total = counts.hadir + counts.sakit + counts.izin + counts.alpa;
    return { ...counts, total, percentHadir: total > 0 ? (counts.hadir / total) * 100 : null };
  }, [classJournals, student]);

  const incidents: (IncidentRecord & { date: string; subject: string })[] = useMemo(() => {
    if (!student) return [];
    const list: (IncidentRecord & { date: string; subject: string })[] = [];
    classJournals.forEach(j => {
      j.incidents.filter(inc => inc.studentId === student.id).forEach(inc => {
        list.push({ ...inc, date: j.date, subject: j.subject });
      });
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [classJournals, student]);

  const avgParticipation = participations.length > 0
    ? participations.reduce((a, p) => a + p.score, 0) / participations.length
    : null;

  const gradesBySubject = useMemo(() => {
    const bySubject = new Map<string, Grade[]>();
    grades.forEach(g => {
      const list = bySubject.get(g.subject) || [];
      list.push(g);
      bySubject.set(g.subject, list);
    });
    return [...bySubject.entries()].map(([subject, list]) => ({
      subject,
      avg: list.reduce((a, g) => a + g.score, 0) / list.length,
      count: list.length,
    }));
  }, [grades]);

  useEscapeKey(!!student, onClose);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl max-h-[88vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserIcon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{student.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">NISN: {student.nisn} · {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Memuat data...</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Kehadiran */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Ringkasan Kehadiran
              </h4>
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{attendanceSummary.hadir}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Hadir</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{attendanceSummary.sakit}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Sakit</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{attendanceSummary.izin}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Izin</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{attendanceSummary.alpa}</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Alpa</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{attendanceSummary.percentHadir !== null ? `${attendanceSummary.percentHadir.toFixed(0)}%` : '-'}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">% Hadir</p>
                </div>
              </div>
            </div>

            {/* Nilai per mapel */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <GraduationCap size={14} /> Rata-rata Nilai per Mata Pelajaran
              </h4>
              {gradesBySubject.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada nilai tercatat.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gradesBySubject.map(g => (
                    <div key={g.subject} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{g.subject}</p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{g.avg.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{g.count} nilai tercatat</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keaktifan */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Sparkles size={14} /> Rata-rata Keaktifan
              </h4>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {avgParticipation !== null ? avgParticipation.toFixed(1) : '-'}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">({participations.length} pertemuan dinilai)</span>
              </p>
            </div>

            {/* Catatan Kejadian */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Catatan Kejadian ({incidents.length})
              </h4>
              {incidents.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Belum ada catatan.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {incidents.map((inc, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inc.category === 'prestasi' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                          inc.category === 'pelanggaran' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' :
                          'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}>{inc.category.toUpperCase()}</span>
                        <span className="text-slate-400 dark:text-slate-500">{inc.date} · {inc.subject}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1">{inc.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
