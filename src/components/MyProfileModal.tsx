import React, { useState } from 'react';
import { X, User as UserIcon, Upload, Check, KeyRound } from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { sha256 } from '../utils/authUtils';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaved: (user: User) => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({ isOpen, onClose, currentUser, onSaved }) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password section
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setMessage(null);
    try {
      const url = await StorageService.uploadAvatar(file);
      setAvatar(url);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal upload foto: ${err?.message || 'terjadi kesalahan'}` });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const users = await StorageService.getUsers();
      const updated: User = { ...currentUser, name: name.trim(), phone: phone.trim(), avatar };
      await StorageService.saveUsers(users.map(u => u.id === currentUser.id ? updated : u));
      onSaved(updated);
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }
    setIsChangingPassword(true);
    setMessage(null);
    try {
      const hash = await sha256(newPassword);
      const users = await StorageService.getUsers();
      await StorageService.saveUsers(
        users.map(u => u.id === currentUser.id ? { ...u, passwordHash: hash, mustChangePassword: false } : u)
      );
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Kata sandi berhasil diganti.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <UserIcon size={18} className="text-indigo-600 dark:text-indigo-400" /> Profil Saya
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {message && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold ${message.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                <img src={avatar} alt="Foto profil" className="w-full h-full object-cover" />
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-400 transition">
                <Upload size={12} />
                {isUploadingAvatar ? 'Mengupload...' : 'Ganti Foto'}
                <input type="file" accept="image/*" className="hidden" disabled={isUploadingAvatar} onChange={handleAvatarUpload} />
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp / Telp</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400">
              Email login, mata pelajaran, dan kelas yang diampu hanya bisa diubah oleh admin.
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={15} /> {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-3 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound size={13} /> Ganti Kata Sandi
            </h4>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound size={15} /> {isChangingPassword ? 'Menyimpan...' : 'Ganti Kata Sandi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
