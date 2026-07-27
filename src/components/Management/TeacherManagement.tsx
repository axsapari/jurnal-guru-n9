import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, Edit, Phone, Mail, X, KeyRound, Check, Upload } from 'lucide-react';
import { User, ClassRoom } from '../../types';
import { StorageService } from '../../services/storageService';
import { SUBJECTS } from '../../data/subjects';

interface TeacherManagementProps {
  users: User[];
  classes: ClassRoom[];
  onRefresh: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

const emptyForm = {
  id: '' as string | null,
  name: '',
  nip: '',
  email: '',
  phone: '',
  subjects: [] as string[],
  classIds: [] as string[],
  role: 'teacher' as 'admin' | 'teacher',
  avatar: '' as string,
};

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ users, classes, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const openAddModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setForm({
      id: u.id,
      name: u.name,
      nip: u.nip,
      email: u.email,
      phone: u.phone || '',
      subjects: u.subjects && u.subjects.length > 0 ? u.subjects : (u.subject ? [u.subject] : []),
      classIds: u.classIds || [],
      role: u.role,
      avatar: u.avatar || '',
    });
    setShowModal(true);
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      const url = await StorageService.uploadAvatar(file);
      setForm(prev => ({ ...prev, avatar: url }));
    } catch (err: any) {
      setAvatarError(`Gagal upload foto: ${err?.message || 'terjadi kesalahan'}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleSubject = (subj: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj) ? prev.subjects.filter(s => s !== subj) : [...prev.subjects, subj],
    }));
  };

  const toggleClass = (classId: string) => {
    setForm(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId) ? prev.classIds.filter(c => c !== classId) : [...prev.classIds, classId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const currentUsers = await StorageService.getUsers();

    if (form.id) {
      // Edit existing
      const updated = currentUsers.map(u => u.id === form.id ? {
        ...u,
        name: form.name.trim(),
        nip: form.nip.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        subjects: form.subjects,
        subject: form.subjects[0] || '',
        classIds: form.classIds,
        avatar: form.avatar || u.avatar || DEFAULT_AVATAR,
      } : u);
      await StorageService.saveUsers(updated);
    } else {
      // Add new — password starts unset; teacher sets it on first login.
      const newUser: User = {
        id: 'usr-' + Date.now(),
        name: form.name.trim(),
        nip: form.nip.trim() || '19900101 202001 1 001',
        email: form.email.trim() || `${form.name.toLowerCase().replace(/\s+/g, '.')}@sekolah.sch.id`,
        phone: form.phone.trim() || '081234567890',
        role: form.role,
        subjects: form.subjects,
        subject: form.subjects[0] || '',
        classIds: form.classIds,
        avatar: form.avatar || DEFAULT_AVATAR,
        passwordHash: 'CHANGE_ON_FIRST_LOGIN',
        mustChangePassword: true,
      };
      await StorageService.saveUsers([...currentUsers, newUser]);
    }

    setShowModal(false);
    onRefresh();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      await StorageService.deleteUser(id);
      onRefresh();
    }
  };

  const handleResetPassword = async (u: User) => {
    if (!confirm(`Reset kata sandi untuk ${u.name}? Guru ini harus membuat kata sandi baru saat login berikutnya.`)) return;
    await StorageService.resetPassword(u.id);
    setResetFeedback(`Kata sandi ${u.name} sudah direset.`);
    setTimeout(() => setResetFeedback(null), 3000);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>Kelola Guru & Akun Pengguna</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 dark:text-slate-500">
            Manajemen peran pengguna (Multi-User Guru & Admin/Kepala Sekolah).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>+ Tambah Guru / Akun</span>
        </button>
      </div>

      {resetFeedback && (
        <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <Check size={14} /> {resetFeedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const subjects = u.subjects && u.subjects.length > 0 ? u.subjects : (u.subject ? [u.subject] : []);
          return (
            <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</h3>
                    {u.role === 'admin' ? (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold shrink-0">Admin</span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold shrink-0">Guru</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subjects.length > 0 ? subjects.map(s => (
                      <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold dark:text-slate-400">{s}</span>
                    )) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium dark:text-slate-500">Guru Kelas</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1 dark:text-slate-400">NIP: {u.nip}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 dark:text-slate-400">
                <p className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400 dark:text-slate-500 dark:text-slate-400" /> {u.email}</p>
                <p className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400 dark:text-slate-500 dark:text-slate-400" /> WA: {u.phone || '-'}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleResetPassword(u)}
                  title="Reset kata sandi guru ini"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer dark:text-slate-500"
                >
                  <KeyRound size={13} /> Reset Sandi
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer dark:text-slate-400"
                    title="Edit data guru"
                  >
                    <Edit size={16} />
                  </button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer dark:text-slate-400"
                      title="Hapus akun"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {form.id ? 'Edit Akun Guru / Admin' : 'Tambah Akun Guru / Admin Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  <img src={form.avatar || DEFAULT_AVATAR} alt="Foto profil" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Foto Profil</label>
                  {avatarError && <p className="text-rose-600 dark:text-rose-400 text-[10px]">{avatarError}</p>}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-400 transition">
                    <Upload size={12} />
                    {isUploadingAvatar ? 'Mengupload...' : 'Upload Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={e => handleAvatarUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Siti Rahmawati, S.Pd."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIP</label>
                <input
                  type="text"
                  placeholder="19850412 200902 2 008"
                  value={form.nip}
                  onChange={e => setForm({ ...form, nip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran (boleh lebih dari satu)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-800/60">
                  {SUBJECTS.map(subj => {
                    const active = form.subjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => toggleSubject(subj)}
                        className={`text-[11px] px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas yang Diampu
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-xl max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-800/60">
                  {classes.length === 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Belum ada kelas dibuat.</span>
                  )}
                  {classes.map(c => {
                    const active = form.classIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleClass(c.id)}
                        className={`text-[11px] px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Kosongkan (jangan pilih kelas apapun) kalau guru ini boleh akses semua kelas.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Peran Akses</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                >
                  <option value="teacher">Guru</option>
                  <option value="admin">Admin / Kepala Sekolah</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email (dipakai untuk login)</label>
                <input
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp / Telp</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {!form.id && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  Kata sandi belum diset. Guru ini akan membuat kata sandinya sendiri saat login pertama kali.
                </p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
