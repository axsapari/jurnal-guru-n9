import React, { useState } from 'react';
import { DatabaseBackup, Download, Upload, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose, onRestored }) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);
    try {
      const data = await StorageService.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Backup_JurnalGuru_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup berhasil didownload.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal membuat backup: ${err?.message || 'terjadi kesalahan'}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFile = async (file: File | null) => {
    if (!file) return;
    if (!confirmRestore) {
      setMessage({ type: 'error', text: 'Centang dulu kotak konfirmasi di bawah sebelum restore.' });
      return;
    }
    setIsRestoring(true);
    setMessage(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await StorageService.importBackup(data);
      setMessage({ type: 'success', text: 'Restore berhasil! Data sudah dipulihkan.' });
      onRestored();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal restore: ${err?.message || 'file tidak valid'}` });
    } finally {
      setIsRestoring(false);
      setConfirmRestore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <DatabaseBackup size={20} className="text-indigo-600 dark:text-indigo-400" />
            Backup & Restore Data
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-semibold ${message.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
            {message.type === 'error' ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Backup */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Backup (Download)</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download seluruh data aplikasi (guru, siswa, kelas, jurnal, nilai, keaktifan, dll) sebagai satu file JSON. Simpan file ini di tempat aman.
          </p>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Download size={14} /> {isBackingUp ? 'Menyiapkan...' : 'Download Backup'}
          </button>
        </div>

        {/* Restore */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Restore (Upload)</h4>
          <p className="text-xs text-amber-800 dark:text-amber-400">
            Upload file backup JSON untuk memulihkan data. Data yang ID-nya sama akan DITIMPA oleh isi file backup — pastikan file yang diupload benar.
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 cursor-pointer">
            <input type="checkbox" checked={confirmRestore} onChange={e => setConfirmRestore(e.target.checked)} className="cursor-pointer" />
            Saya paham dan yakin ingin melanjutkan restore.
          </label>
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${confirmRestore ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
            <Upload size={14} /> {isRestoring ? 'Memulihkan...' : 'Pilih File Backup'}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              disabled={!confirmRestore || isRestoring}
              onChange={e => handleRestoreFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
