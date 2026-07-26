import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Save, Plus, Trash2, Scale, ListChecks, FileDown, AlertTriangle } from 'lucide-react';
import { User, ClassRoom, Student, LearningObjective, GradeType, Grade } from '../../types';
import { StorageService } from '../../services/storageService';
import * as XLSX from 'xlsx';

interface GradesManagementProps {
  currentUser: User;
  classes: ClassRoom[];
  learningObjectives: LearningObjective[];
}

const DEFAULT_SEMESTER = 'Ganjil';
const DEFAULT_ACADEMIC_YEAR = '2025/2026';

type Tab = 'input' | 'weights' | 'recap';

export const GradesManagement: React.FC<GradesManagementProps> = ({ currentUser, classes, learningObjectives }) => {
  const teacherSubjects = currentUser.subjects && currentUser.subjects.length > 0
    ? currentUser.subjects
    : (currentUser.subject ? [currentUser.subject] : ['Umum']);

  const [tab, setTab] = useState<Tab>('input');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [subject, setSubject] = useState(teacherSubjects[0]);

  const [students, setStudents] = useState<Student[]>([]);
  const [gradeTypes, setGradeTypes] = useState<GradeType[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  // Input Nilai state
  const [gradeTypeId, setGradeTypeId] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [tpId, setTpId] = useState('');
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bobot Penilaian state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeWeight, setNewTypeWeight] = useState('20');

  const loadClassData = async () => {
    if (!classId) return;
    setLoading(true);
    const [studentList, allGradeTypes, allGrades] = await Promise.all([
      StorageService.getStudents(classId),
      StorageService.getGradeTypes(),
      StorageService.getGrades(),
    ]);
    setStudents(studentList);
    setGradeTypes(allGradeTypes.filter(g => g.classId === classId && g.subject === subject));
    setGrades(allGrades.filter(g => g.classId === classId && g.subject === subject));
    setLoading(false);
  };

  useEffect(() => { loadClassData(); }, [classId, subject]);

  useEffect(() => {
    // Pre-fill score inputs from existing grades when assessment selection changes
    if (gradeTypeId && assessmentName) {
      const next: Record<string, string> = {};
      students.forEach(s => {
        const existing = grades.find(g => g.studentId === s.id && g.gradeTypeId === gradeTypeId && g.assessmentName === assessmentName);
        if (existing) next[s.id] = String(existing.score);
      });
      setScoreInputs(next);
    } else {
      setScoreInputs({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeTypeId, assessmentName]);

  const existingAssessmentNames = useMemo(() => {
    return [...new Set(grades.filter(g => g.gradeTypeId === gradeTypeId).map(g => g.assessmentName))].sort();
  }, [grades, gradeTypeId]);

  const handleSaveGrades = async () => {
    if (!gradeTypeId || !assessmentName.trim()) {
      setFeedback({ type: 'error', message: 'Pilih jenis penilaian dan isi nama penilaian dulu.' });
      return;
    }
    const rows: Grade[] = [];
    for (const s of students) {
      const raw = scoreInputs[s.id];
      if (raw === undefined || raw.trim() === '') continue;
      const score = parseFloat(raw);
      if (isNaN(score) || score < 0 || score > 100) continue;
      const existing = grades.find(g => g.studentId === s.id && g.gradeTypeId === gradeTypeId && g.assessmentName === assessmentName);
      rows.push({
        id: existing?.id || 'grd-' + Date.now() + '-' + s.id,
        studentId: s.id,
        classId,
        subject,
        gradeTypeId,
        assessmentName: assessmentName.trim(),
        score,
        date: assessmentDate,
        tpId: tpId || undefined,
        teacherId: currentUser.id,
        semester: DEFAULT_SEMESTER,
        academicYear: DEFAULT_ACADEMIC_YEAR,
      });
    }
    if (rows.length === 0) {
      setFeedback({ type: 'error', message: 'Belum ada nilai yang diisi.' });
      return;
    }
    await StorageService.saveGrades(rows);
    setFeedback({ type: 'success', message: `${rows.length} nilai berhasil disimpan.` });
    loadClassData();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddGradeType = async () => {
    if (!newTypeName.trim()) return;
    const weight = parseFloat(newTypeWeight) || 0;
    const newType: GradeType = {
      id: 'gt-' + Date.now(),
      classId,
      subject,
      name: newTypeName.trim(),
      weight,
      teacherId: currentUser.id,
      semester: DEFAULT_SEMESTER,
      academicYear: DEFAULT_ACADEMIC_YEAR,
    };
    await StorageService.addGradeType(newType);
    setNewTypeName('');
    setNewTypeWeight('20');
    loadClassData();
  };

  const handleUpdateWeight = async (id: string, weight: number) => {
    const updated = gradeTypes.map(t => t.id === id ? { ...t, weight } : t);
    setGradeTypes(updated);
    await StorageService.saveGradeTypes(updated);
  };

  const handleDeleteGradeType = async (id: string) => {
    if (!confirm('Hapus jenis penilaian ini? Semua nilai di bawahnya juga akan terhapus.')) return;
    await StorageService.deleteGradeType(id);
    loadClassData();
  };

  const totalWeight = gradeTypes.reduce((sum, t) => sum + (t.weight || 0), 0);

  // ---------- Rekap Nilai Akhir ----------
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

  const handleExportRecap = () => {
    const className = classes.find(c => c.id === classId)?.name || classId;
    const rows = finalGrades.map((fg, idx) => {
      const row: any = { 'No': idx + 1, 'Nama Siswa': fg.student.name, 'NISN': fg.student.nisn };
      fg.breakdown.forEach(b => { row[b.typeName] = b.avg !== null ? b.avg.toFixed(1) : '-'; });
      row['Nilai Akhir'] = fg.final !== null ? fg.final.toFixed(1) : '-';
      return row;
    });
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Rekap Nilai');
    XLSX.writeFile(wb, `Rekap_Nilai_${subject}_${className}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap size={20} className="text-indigo-600 dark:text-indigo-400" />
          <span>Nilai / Penilaian</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 dark:text-slate-500">
          Catat nilai tugas/ulangan, atur bobot penilaian, dan lihat rekap nilai akhir per kelas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Kelas</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Mata Pelajaran</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
            >
              {teacherSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-1.5 mt-4 border-b border-slate-100 dark:border-slate-800 pb-0">
          {[
            { id: 'input', label: 'Input Nilai', icon: ListChecks },
            { id: 'weights', label: 'Bobot Penilaian', icon: Scale },
            { id: 'recap', label: 'Rekap Nilai Akhir', icon: GraduationCap },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition cursor-pointer ${
                  tab === t.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Memuat data...</div>
      ) : (
        <>
          {/* TAB: Input Nilai */}
          {tab === 'input' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {gradeTypes.length === 0 ? (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>Belum ada jenis penilaian untuk kelas & mapel ini. Buka tab "Bobot Penilaian" untuk membuat jenis penilaian dulu (misal: Tugas Harian, UH, UAS).</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Jenis Penilaian</label>
                      <select
                        value={gradeTypeId}
                        onChange={e => { setGradeTypeId(e.target.value); setAssessmentName(''); }}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">— Pilih —</option>
                        {gradeTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.weight}%)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Nama Penilaian</label>
                      <input
                        list="assessment-names"
                        value={assessmentName}
                        onChange={e => setAssessmentName(e.target.value)}
                        placeholder="misal: Ulangan Bab 1"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                      />
                      <datalist id="assessment-names">
                        {existingAssessmentNames.map(n => <option key={n} value={n} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Tanggal</label>
                      <input
                        type="date"
                        value={assessmentDate}
                        onChange={e => setAssessmentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">TP Terkait (opsional)</label>
                      <select
                        value={tpId}
                        onChange={e => setTpId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">—</option>
                        {learningObjectives.filter(t => t.subject === subject).map(t => (
                          <option key={t.id} value={t.id}>{t.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {feedback && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${feedback.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
                      {feedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-3 py-1">
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={scoreInputs[s.id] ?? ''}
                          onChange={e => setScoreInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="0-100"
                          className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-center text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveGrades}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Save size={15} /> Simpan Nilai
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: Bobot Penilaian */}
          {tab === 'weights' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Nama Jenis Penilaian</label>
                  <input
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    placeholder="misal: Tugas Harian"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 dark:text-slate-500">Bobot (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newTypeWeight}
                    onChange={e => setNewTypeWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddGradeType}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={15} /> Tambah
                </button>
              </div>

              <div className={`text-xs font-bold ${totalWeight === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Total bobot: {totalWeight}% {totalWeight !== 100 ? '— sebaiknya totalnya 100%' : '✓'}
              </div>

              <div className="space-y-2">
                {gradeTypes.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800">
                    <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={t.weight}
                      onChange={e => handleUpdateWeight(t.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-center text-slate-900 dark:text-slate-100 dark:text-white"
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500">%</span>
                    <button onClick={() => handleDeleteGradeType(t.id)} className="text-slate-400 hover:text-rose-600 cursor-pointer dark:text-slate-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {gradeTypes.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 dark:text-slate-400">Belum ada jenis penilaian untuk kelas & mapel ini.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: Rekap Nilai Akhir */}
          {tab === 'recap' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Rekap Nilai Akhir</h3>
                <button
                  onClick={handleExportRecap}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown size={13} /> Export Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <tr>
                      <th className="text-left px-4 py-2 font-bold">Nama Siswa</th>
                      {gradeTypes.map(t => (
                        <th key={t.id} className="text-center px-3 py-2 font-bold whitespace-nowrap">{t.name} ({t.weight}%)</th>
                      ))}
                      <th className="text-center px-4 py-2 font-bold">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalGrades.map(fg => (
                      <tr key={fg.student.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-medium">{fg.student.name}</td>
                        {fg.breakdown.map((b, i) => (
                          <td key={i} className="text-center px-3 py-2 text-slate-600 dark:text-slate-400 dark:text-slate-500">
                            {b.avg !== null ? b.avg.toFixed(1) : '-'}
                          </td>
                        ))}
                        <td className="text-center px-4 py-2 font-bold text-indigo-700 dark:text-indigo-400">
                          {fg.final !== null ? fg.final.toFixed(1) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {finalGrades.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 dark:text-slate-400">Belum ada siswa di kelas ini.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
