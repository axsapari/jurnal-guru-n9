import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Edit3, UserPlus, Search, 
  CheckCircle, ChevronRight, X, School, FileDown, UploadCloud, UserRound
} from 'lucide-react';
import { ClassRoom, Student, User, JournalEntry } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImportUtils } from '../../utils/importUtils';
import { StudentProfileModal } from '../Students/StudentProfileModal';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ClassManagementProps {
  currentUser: User;
  classes: ClassRoom[];
  teachers: User[];
  journals: JournalEntry[];
  onRefresh: () => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  currentUser,
  classes,
  teachers,
  journals,
  onRefresh
}) => {
  const isAdmin = currentUser.role === 'admin';
  // Wali kelas (guru yang jadi homeroomTeacherId kelas tsb) juga boleh kelola kelas & siswanya sendiri.
  const canManageClass = (c: ClassRoom | undefined) => isAdmin || (!!c && c.homeroomTeacherId === currentUser.id);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  useEscapeKey(showAddClassModal, () => { setShowAddClassModal(false); setEditingClassId(null); });
  useEscapeKey(showAddStudentModal, () => { setShowAddStudentModal(false); setEditingStudentId(null); });
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // New/Edit Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('7');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // New/Edit Student Form
  const [newStudentNisn, setNewStudentNisn] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');

  const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const [students, setStudents] = useState<Student[]>([]);
  const [isImportingStudents, setIsImportingStudents] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; summary: string; details: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (selectedClassId) {
      StorageService.getStudents(selectedClassId).then(list => {
        if (!cancelled) setStudents(list);
      });
    } else {
      setStudents([]);
    }
    return () => { cancelled = true; };
  }, [selectedClassId]);

  const openAddClassModal = () => {
    setEditingClassId(null);
    setNewClassName('');
    setNewClassGrade('7');
    setNewClassTeacher(teachers[0]?.id || '');
    setShowAddClassModal(true);
  };

  const openEditClassModal = (c: ClassRoom) => {
    setEditingClassId(c.id);
    setNewClassName(c.name);
    setNewClassGrade(c.grade);
    setNewClassTeacher(c.homeroomTeacherId || '');
    setShowAddClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const currentClasses = await StorageService.getClasses();

    if (editingClassId) {
      const updated = currentClasses.map(c => c.id === editingClassId ? {
        ...c,
        name: newClassName.trim().toUpperCase(),
        grade: newClassGrade,
        homeroomTeacherId: newClassTeacher || c.homeroomTeacherId,
      } : c);
      await StorageService.saveClasses(updated);
    } else {
      const newClass: ClassRoom = {
        id: 'cls-' + Date.now(),
        name: newClassName.trim().toUpperCase(),
        grade: newClassGrade,
        academicYear: '2025/2026',
        homeroomTeacherId: newClassTeacher || teachers[0]?.id,
        studentCount: 0
      };
      await StorageService.saveClasses([...currentClasses, newClass]);
      setSelectedClassId(newClass.id);
    }

    setNewClassName('');
    setShowAddClassModal(false);
    setEditingClassId(null);
    onRefresh();
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Hapus kelas ${className}? Semua data siswa di kelas ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`)) return;
    await StorageService.deleteClass(classId);
    if (selectedClassId === classId) {
      setSelectedClassId(classes.find(c => c.id !== classId)?.id || '');
    }
    onRefresh();
  };

  const openAddStudentModal = () => {
    setEditingStudentId(null);
    setNewStudentName('');
    setNewStudentNisn('');
    setNewStudentGender('L');
    setNewStudentParentPhone('');
    setShowAddStudentModal(true);
  };

  const openEditStudentModal = (s: Student) => {
    setEditingStudentId(s.id);
    setNewStudentName(s.name);
    setNewStudentNisn(s.nisn);
    setNewStudentGender(s.gender);
    setNewStudentParentPhone(s.parentPhone || '');
    setShowAddStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedClassId) return;

    if (editingStudentId) {
      const updated: Student = {
        id: editingStudentId,
        classId: selectedClassId,
        nisn: newStudentNisn.trim(),
        name: newStudentName.trim(),
        gender: newStudentGender,
        parentPhone: newStudentParentPhone.trim(),
      };
      await StorageService.saveStudents([updated]);
      setStudents(prev => prev.map(s => s.id === editingStudentId ? updated : s));
    } else {
      const newStudent: Student = {
        id: 'std-' + Date.now(),
        classId: selectedClassId,
        nisn: newStudentNisn.trim() || `00${Math.floor(Math.random() * 899999 + 100000)}`,
        name: newStudentName.trim(),
        gender: newStudentGender,
        parentPhone: newStudentParentPhone.trim(),
      };

      await StorageService.addStudent(newStudent);

      // Update class student count
      const updatedClasses = classes.map(c => {
        if (c.id === selectedClassId) {
          return { ...c, studentCount: (c.studentCount || 0) + 1 };
        }
        return c;
      });
      await StorageService.saveClasses(updatedClasses);
    }

    setNewStudentName('');
    setNewStudentNisn('');
    setNewStudentParentPhone('');
    setShowAddStudentModal(false);
    setEditingStudentId(null);
    onRefresh();
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini dari member kelas?')) {
      await StorageService.deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      onRefresh();
    }
  };

  const handleImportStudents = async (file: File | null) => {
    if (!file || !selectedClassId) return;
    setIsImportingStudents(true);
    setImportFeedback(null);

    try {
      const { rows, errors } = await ImportUtils.parseStudents(file);

      if (rows.length === 0) {
        setImportFeedback({ type: 'error', summary: 'Tidak ada data siswa valid yang bisa diimpor dari file ini.', details: errors });
        return;
      }

      const newStudents: Student[] = rows.map(r => ({
        id: 'std-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        classId: selectedClassId,
        nisn: r.nisn || `00${Math.floor(Math.random() * 899999 + 100000)}`,
        name: r.name,
        gender: r.gender,
      }));

      await StorageService.saveStudents(newStudents);
      setStudents(prev => [...prev, ...newStudents]);

      const updatedClasses = classes.map(c =>
        c.id === selectedClassId ? { ...c, studentCount: (c.studentCount || 0) + newStudents.length } : c
      );
      await StorageService.saveClasses(updatedClasses);

      setImportFeedback({
        type: 'success',
        summary: `Berhasil mengimpor ${newStudents.length} siswa ke kelas ${activeClass?.name}.`,
        details: errors,
      });
      onRefresh();
    } catch (err: any) {
      setImportFeedback({ type: 'error', summary: `Gagal membaca file: ${err?.message || 'format file tidak dikenali'}`, details: [] });
    } finally {
      setIsImportingStudents(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-white">
            <School size={20} className="text-indigo-600" />
            <span>Kelola Kelas & Member Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400 dark:text-slate-500">
            Manajemen rombel kelas dan daftar siswa untuk catatan kehadiran serta kejadian.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddClassModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>+ Tambah Kelas Baru</span>
          </button>
        )}
      </div>

      {/* Class List Tabs & Student Detail Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Class Selection List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2 dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 dark:text-slate-500 dark:text-slate-400">
            Daftar Kelas ({classes.length})
          </p>

          <div className="space-y-1.5">
            {classes.map(c => {
              const isSelected = c.id === selectedClassId;
              const homeroom = teachers.find(t => t.id === c.homeroomTeacherId);
              return (
                <div
                  key={c.id}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-1 ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-bold shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <button onClick={() => setSelectedClassId(c.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                    <p className="text-sm">Kelas {c.name}</p>
                    <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      Tingkat {c.grade} • Wali: {homeroom?.name.split(',')[0] || 'Guru'}
                    </p>
                  </button>
                  {canManageClass(c) ? (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEditClassModal(c)}
                        title="Edit kelas"
                        className={`p-1 rounded cursor-pointer ${isSelected ? 'text-indigo-100 hover:text-white' : 'text-slate-400 hover:text-indigo-600 dark:text-slate-500'}`}
                      >
                        <Edit3 size={13} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          title="Hapus kelas"
                          className={`p-1 rounded cursor-pointer ${isSelected ? 'text-indigo-100 hover:text-white' : 'text-slate-400 hover:text-rose-600 dark:text-slate-500'}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <ChevronRight size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Class Member Students Table */}
        <div className="md:col-span-3 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 dark:bg-slate-900 dark:border-slate-800 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                <span>Daftar Siswa Member Kelas {activeClass?.name}</span>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {students.length} Siswa
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400 dark:text-slate-500">
                Mencakup NISN, Nama Lengkap, Jenis Kelamin untuk absensi
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManageClass(activeClass) && (
                <>
                  <button
                    onClick={() => ImportUtils.downloadStudentTemplate()}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800/60"
                    title="Download template Excel untuk diisi lalu diimpor"
                  >
                    <FileDown size={15} />
                    <span>Template</span>
                  </button>

                  <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
                    <UploadCloud size={15} />
                    <span>{isImportingStudents ? 'Mengimpor...' : 'Impor Siswa'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      disabled={isImportingStudents || !selectedClassId}
                      onChange={e => handleImportStudents(e.target.files?.[0] || null)}
                    />
                  </label>
                </>
              )}

              {canManageClass(activeClass) && (
                <button
                  onClick={openAddStudentModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus size={15} />
                  <span>+ Tambah Member Siswa</span>
                </button>
              )}
            </div>
          </div>

          {importFeedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold space-y-1 ${importFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <p>{importFeedback.summary}</p>
              {importFeedback.details.length > 0 && (
                <ul className="list-disc list-inside font-normal opacity-90 max-h-24 overflow-y-auto">
                  {importFeedback.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Students Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-3.5 py-3">No</th>
                  <th className="px-3.5 py-3">NISN</th>
                  <th className="px-3.5 py-3">Nama Lengkap Siswa</th>
                  <th className="px-3.5 py-3 text-center">L/P</th>
                  <th className="px-3.5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-900">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic dark:text-slate-500 dark:text-slate-400">
                      Belum ada siswa di kelas ini. Klik "+ Tambah Member Siswa" untuk menambah.
                    </td>
                  </tr>
                ) : (
                  students.map((std, idx) => (
                    <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-3.5 py-2.5 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600 dark:text-slate-400 dark:text-slate-500">{std.nisn}</td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                        <button onClick={() => setProfileStudent(std)} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-left">
                          {std.name}
                        </button>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          std.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {std.gender}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          onClick={() => setProfileStudent(std)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer dark:text-slate-500 mr-1"
                          title="Lihat profil siswa"
                        >
                          <UserRound size={15} />
                        </button>
                        {canManageClass(activeClass) && (
                          <>
                            <button
                              onClick={() => openEditStudentModal(std)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer dark:text-slate-500 mr-1"
                              title="Edit data siswa"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(std.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer dark:text-slate-500 dark:text-slate-400"
                              title="Hapus siswa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-full max-w-md space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-base dark:text-white">{editingClassId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
              <button onClick={() => { setShowAddClassModal(false); setEditingClassId(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer dark:text-slate-400 dark:text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Nama Kelas</label>
                <input
                  type="text"
                  placeholder="misal: 7A, 8B, 9C"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Tingkat Kelas</label>
                <select
                  value={newClassGrade}
                  onChange={e => setNewClassGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                >
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Wali Kelas</label>
                <select
                  value={newClassTeacher}
                  onChange={e => setNewClassTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddClassModal(false); setEditingClassId(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingClassId ? 'Simpan Perubahan' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-full max-w-md space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 text-base dark:text-white">
                {editingStudentId ? 'Edit Data Siswa' : `Tambah Member Siswa Ke Kelas ${activeClass?.name}`}
              </h3>
              <button onClick={() => { setShowAddStudentModal(false); setEditingStudentId(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer dark:text-slate-400 dark:text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  placeholder="misal: Muhammad Rizky"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">NISN (Nomor Induk Siswa Nasional)</label>
                <input
                  type="text"
                  placeholder="0098765432"
                  value={newStudentNisn}
                  onChange={e => setNewStudentNisn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 dark:text-white dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 dark:text-slate-300">Jenis Kelamin</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'L'}
                      onChange={() => setNewStudentGender('L')}
                    />
                    Laki-Laki (L)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="gender"
                      checked={newStudentGender === 'P'}
                      onChange={() => setNewStudentGender('P')}
                    />
                    Perempuan (P)
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddStudentModal(false); setEditingStudentId(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingStudentId ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentProfileModal
        student={profileStudent}
        journals={journals}
        onClose={() => setProfileStudent(null)}
      />
    </div>
  );
};
