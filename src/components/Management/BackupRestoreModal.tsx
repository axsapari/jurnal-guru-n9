import React, { useState } from 'react';
import { DatabaseBackup, Download, Upload, AlertTriangle, CheckCircle2, X, ImageDown } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { compressDataUrl } from '../../utils/imageUtils';

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

  const [isMigratingPhotos, setIsMigratingPhotos] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState<{ done: number; total: number } | null>(null);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleMigratePhotos = async () => {
    if (isMigratingPhotos) return;
    if (!confirm('Pindahkan semua foto jurnal lama (yang masih tersimpan sebagai teks di database) ke Supabase Storage? Proses ini aman dan tidak akan menghapus foto, hanya memindahkan tempat penyimpanannya.')) return;

    setIsMigratingPhotos(true);
    setMigrateResult(null);
    try {
      const journals = await StorageService.getJournals();
      const toMigrate = journals.filter(j => j.photoUrl && j.photoUrl.startsWith('data:image'));
      setMigrateProgress({ done: 0, total: toMigrate.length });

      let success = 0;
      let failed = 0;

      for (let i = 0; i < toMigrate.length; i++) {
        const entry = toMigrate[i];
        try {
          const compressed = await compressDataUrl(entry.photoUrl!);
          const { url, fileName } = await StorageService.uploadJournalPhoto(compressed, entry.id);
          await StorageService.saveJournalEntry({ ...entry, photoUrl: url, photoFileName: fileName });
          success++;
        } catch {
          failed++;
        }
        setMigrateProgress({ done: i + 1, total: toMigrate.length });
      }

      setMigrateResult(
        toMigrate.length === 0
          ? 'Tidak ada foto lama yang perlu dipindahkan — semua foto sudah tersimpan di Storage.'
          : `Selesai! ${success} foto berhasil dipindahkan ke Storage${failed > 0 ? `, ${failed} gagal (coba lagi nanti)` : ''}.`
      );
      onRestored();
    } finally {
      setIsMigratingPhotos(false);
    }
  };


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

        {/* Migrasi Foto ke Storage */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <ImageDown size={15} /> Migrasi Foto Lama ke Storage
          </h4>
          <p className="text-xs text-emerald-800 dark:text-emerald-400">
            Foto jurnal yang diupload sebelum update ini masih tersimpan langsung di database (boros kuota). Klik tombol ini untuk memindahkannya ke Supabase Storage secara otomatis — aman, tidak ada foto yang hilang.
          </p>
          {migrateProgress && isMigratingPhotos && (
            <div className="space-y-1">
              <div className="w-full bg-emerald-100 dark:bg-emerald-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${migrateProgress.total > 0 ? (migrateProgress.done / migrateProgress.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                Memproses {migrateProgress.done} dari {migrateProgress.total} foto...
              </p>
            </div>
          )}
          {migrateResult && (
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {migrateResult}
            </p>
          )}
          <button
            onClick={handleMigratePhotos}
            disabled={isMigratingPhotos}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <ImageDown size={14} /> {isMigratingPhotos ? 'Memproses...' : 'Mulai Migrasi Foto'}
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
