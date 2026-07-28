import React, { useState } from 'react';
import { Target, Plus, Trash2, Search, BookOpen, FileDown, UploadCloud } from 'lucide-react';
import { LearningObjective, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImportUtils } from '../../utils/importUtils';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { SUBJECTS } from '../../data/subjects';

interface TpManagementProps {
  currentUser: User;
  learningObjectives: LearningObjective[];
  onRefresh: () => void;
}

export const TpManagement: React.FC<TpManagementProps> = ({
  currentUser,
  learningObjectives,
  onRefresh
}) => {
  const isAdmin = currentUser.role === 'admin';
  // Guru hanya mengelola TP untuk mapel yang diampunya sendiri.
  const teacherSubjects = currentUser.subjects && currentUser.subjects.length > 0
    ? currentUser.subjects
    : (currentUser.subject ? [currentUser.subject] : SUBJECTS);
  const subjectOptions = isAdmin ? SUBJECTS : teacherSubjects;

  const scopedLearningObjectives = isAdmin
    ? learningObjectives
    : learningObjectives.filter(tp => teacherSubjects.includes(tp.subject));

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  
  // New TP Modal
  const [showAddModal, setShowAddModal] = useState(false);
  useEscapeKey(showAddModal, () => setShowAddModal(false));
  const [subject, setSubject] = useState(subjectOptions[0] || 'Matematika');
  const [grade, setGrade] = useState('7');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isImportingTp, setIsImportingTp] = useState(false);
  const [tpImportFeedback, setTpImportFeedback] = useState<{ type: 'success' | 'error'; summary: string; details: string[] } | null>(null);

  const subjects = Array.from(new Set(scopedLearningObjectives.map(tp => tp.subject)));

  const filteredTps = scopedLearningObjectives.filter(tp => {
    const matchesSearch = tp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'ALL' || tp.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleAddTp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const autoCode = code.trim() || `TP.${subject.slice(0,3).toUpperCase()}.${grade}.${learningObjectives.length + 1}`;

    const newTp: LearningObjective = {
      id: 'tp-' + Date.now(),
      subject,
      grade,
      code: autoCode,
      description: description.trim()
    };

    await StorageService.addLearningObjective(newTp);
    setCode('');
    setDescription('');
    setShowAddModal(false);
    onRefresh();
  };

  const handleDeleteTp = async (id: string) => {
    if (confirm('Hapus Tujuan Pembelajaran (TP) ini?')) {
      await StorageService.deleteLearningObjective(id);
      onRefresh();
    }
  };

  const handleImportTp = async (file: File | null) => {
    if (!file) return;
    setIsImportingTp(true);
    setTpImportFeedback(null);

    try {
      const { rows, errors } = await ImportUtils.parseLearningObjectives(file);

      if (rows.length === 0) {
        setTpImportFeedback({ type: 'error', summary: 'Tidak ada data TP valid yang bisa diimpor dari file ini.', details: errors });
        return;
      }

      const newTps: LearningObjective[] = rows.map((r, i) => ({
        id: 'tp-' + Date.now() + '-' + i,
        subject: r.subject,
        grade: r.grade,
        code: r.code || `TP.${r.subject.slice(0, 3).toUpperCase()}.${r.grade}.${learningObjectives.length + i + 1}`,
        description: r.description,
      }));

      await StorageService.saveLearningObjectives([...learningObjectives, ...newTps]);

      setTpImportFeedback({
        type: 'success',
        summary: `Berhasil mengimpor ${newTps.length} Tujuan Pembelajaran.`,
        details: errors,
      });
      onRefresh();
    } catch (err: any) {
      setTpImportFeedback({ type: 'error', summary: `Gagal membaca file: ${err?.message || 'format file tidak dikenali'}`, details: [] });
    } finally {
      setIsImportingTp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-white">
            <Target size={20} className="text-indigo-600" />
            <span>Kelola Tujuan Pembelajaran (TP)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400 dark:text-slate-500">
            Daftar TP yang akan dipilih oleh guru saat melakukan pengisian jurnal harian mengajar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ImportUtils.downloadTpTemplate()}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800/60"
            title="Download template Excel untuk diisi lalu diimpor"
          >
            <FileDown size={15} />
            <span>Template</span>
          </button>

          <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
            <UploadCloud size={15} />
            <span>{isImportingTp ? 'Mengimpor...' : 'Impor TP'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={isImportingTp}
              onChange={e => handleImportTp(e.target.files?.[0] || null)}
            />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>+ Tambah TP Baru</span>
          </button>
        </div>
      </div>

      {tpImportFeedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold space-y-1 ${tpImportFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <p>{tpImportFeedback.summary}</p>
          {tpImportFeedback.details.length > 0 && (
            <ul className="list-disc list-inside font-normal opacity-90 max-h-24 overflow-y-auto">
              {tpImportFeedback.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau deskripsi TP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800/60 dark:text-white dark:border-slate-800"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-800"
        >
          <option value="ALL">Semua Mata Pelajaran</option>
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* TP List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Kode TP</th>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Tingkat</th>
              <th className="px-4 py-3">Uraian Tujuan Pembelajaran</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-900">
            {filteredTps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic dark:text-slate-500 dark:text-slate-400">
                  Belum ada Tujuan Pembelajaran (TP) terdaftar. Klik "+ Tambah TP Baru" di atas.
                </td>
              </tr>
            ) : (
              filteredTps.map(tp => (
                <tr key={tp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{tp.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{tp.subject}</td>
                  <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 dark:text-slate-500">Kelas {tp.grade}</td>
                  <td className="px-4 py-3 text-slate-700 leading-relaxed dark:text-slate-300">{tp.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteTp(tp.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer dark:text-slate-500 dark:text-slate-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-full max-w-lg space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 text-base dark:text-white">Tambah Tujuan Pembelajaran (TP)</h3>

            <form onSubmit={handleAddTp} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Mata Pelajaran</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Tingkat Kelas</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Kode TP (opsional)</label>
                <input
                  type="text"
                  placeholder="misal: TP.MAT.7.1"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 dark:text-white dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Uraian Deskripsi TP</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan tujuan pembelajaran secara spesifik..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 dark:text-white dark:border-slate-700"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
