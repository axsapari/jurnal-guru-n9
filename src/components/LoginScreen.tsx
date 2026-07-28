import React, { useState } from 'react';
import { BookOpen, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { User, SchoolConfig } from '../types';

interface LoginScreenProps {
  schoolConfig: SchoolConfig | null;
  onLoggedIn: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ schoolConfig, onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await StorageService.login(email, password);
      onLoggedIn(user);
    } catch (err: any) {
      setError(err?.message || 'Gagal login, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 dark:bg-slate-800">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm mb-3">
            {schoolConfig?.logoUrl ? (
              <img src={schoolConfig.logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white">
                <BookOpen size={26} />
              </div>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Jurnal Guru</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 dark:text-slate-500">
            {schoolConfig?.schoolName || 'Sistem Jurnal & Absensi Terpadu'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@sekolah.sch.id"
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 dark:text-slate-400">
              Login pertama kali? Ketik email kamu dan kata sandi BEBAS yang kamu inginkan — kata sandi itu akan otomatis tersimpan untuk login berikutnya.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            <span>{loading ? 'Memproses...' : 'Masuk'}</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4 dark:text-slate-400">
          Lupa kata sandi? Minta admin sekolah untuk mereset akun kamu.
        </p>
        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-2">
          Jurnal Guru — dikembangkan oleh <span className="font-semibold">Agus Sugiharto Sapari</span>
        </p>
      </div>
    </div>
  );
};
