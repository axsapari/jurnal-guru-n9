import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, Edit, Phone, Mail, Shield } from 'lucide-react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';

interface TeacherManagementProps {
  users: User[];
  onRefresh: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({ users, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      nip: nip.trim() || '19900101 202001 1 001',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@sekolah.sch.id`,
      phone: phone.trim() || '081234567890',
      role,
      subject,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
    };

    const currentUsers = await StorageService.getUsers();
    await StorageService.saveUsers([...currentUsers, newUser]);

    setName('');
    setNip('');
    setEmail('');
    setPhone('');
    setShowModal(false);
    onRefresh();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      await StorageService.deleteUser(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck size={20} className="text-indigo-600" />
            <span>Kelola Guru & Akun Pengguna</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen peran pengguna (Multi-User Guru & Admin/Kepala Sekolah).
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>+ Tambah Guru / Akun</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{u.name}</h3>
                  {u.role === 'admin' ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Admin</span>
                  ) : (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Guru</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{u.subject || 'Guru Kelas'}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIP: {u.nip}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
              <p className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {u.email}</p>
              <p className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> WA: {u.phone || '-'}</p>
            </div>

            {u.role !== 'admin' && (
              <div className="pt-2 text-right">
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Akun Guru / Admin Baru</h3>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Siti Rahmawati, S.Pd."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP</label>
                <input
                  type="text"
                  placeholder="19850412 200902 2 008"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran Akses</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="teacher">Guru</option>
                    <option value="admin">Admin / Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / Telp</label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
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
