import React, { useState, useEffect } from 'react';
import { X, Briefcase, Check, Camera, Calendar } from 'lucide-react';
import { User, JournalEntry } from '../../types';
import { StorageService } from '../../services/storageService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { compressImage } from '../../utils/imageUtils';
import { SuccessPopup, SavingSpinner } from '../SuccessPopup';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  editingEntry?: JournalEntry | null;
  onSaved: (entry: JournalEntry) => void;
}

const ACTIVITY_TYPES = [
  'Administrasi',
  'Tugas Dinas Luar',
  'Pelatihan / Workshop',
  'Rapat',
  'Piket',
  'Lainnya',
];

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, currentUser, editingEntry, onSaved }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEscapeKey(isOpen && !isSubmitting, onClose);

  useEffect(() => {
    if (!isOpen) return;
    if (editingEntry) {
      setDate(editingEntry.date);
      setActivityType(ACTIVITY_TYPES.includes(editingEntry.subject) ? editingEntry.subject : ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]);
      setDescription(editingEntry.summary);
      setPhotoUrl(editingEntry.photoUrl || '');
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setActivityType(ACTIVITY_TYPES[0]);
      setDescription('');
      setPhotoUrl('');
    }
  }, [isOpen, editingEntry]);

  if (!isOpen) return null;

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setActivityType(ACTIVITY_TYPES[0]);
    setDescription('');
    setPhotoUrl('');
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const { url } = await StorageService.uploadJournalPhoto(compressed, `kegiatan_${date.replace(/-/g, '')}`);
      setPhotoUrl(url);
    } catch (err: any) {
      setPhotoError(`Gagal upload foto: ${err?.message || 'terjadi kesalahan'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!description.trim()) {
      alert('Mohon isi keterangan kegiatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const entry: JournalEntry = {
        id: editingEntry?.id || 'act-' + Date.now(),
        entryType: 'kegiatan_lain',
        date,
        timeSlot: activityType,
        teacherId: editingEntry?.teacherId || currentUser.id,
        teacherName: editingEntry?.teacherName || currentUser.name,
        classId: '',
        className: '',
        subject: activityType,
        tpIds: [],
        tpDescriptions: [],
        summary: description.trim(),
        attendance: {},
        attendanceSummary: { hadir: 0, sakit: 0, izin: 0, alpa: 0, total: 0 },
        incidents: [],
        photoUrl: photoUrl || undefined,
        syncStatus: 'pending',
        createdAt: editingEntry?.createdAt || new Date().toISOString(),
      };

      const saved = await StorageService.saveJournalEntry(entry);
      onSaved(saved.entry);
      resetForm();
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{editingEntry ? 'Edit Kegiatan' : 'Catat Kegiatan Lain'}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Untuk aktivitas selain mengajar di kelas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-amber-600" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jenis Kegiatan</label>
              <select
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Keterangan Kegiatan</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="Jelaskan kegiatan yang dilakukan..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Camera size={13} className="text-amber-600" /> Foto Bukti (opsional)
            </label>
            {photoError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mb-1.5">{photoError}</p>
            )}
            {isUploadingPhoto ? (
              <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400">
                <SavingSpinner label="Mengupload foto..." />
              </div>
            ) : photoUrl ? (
              <div className="flex items-center gap-3 p-2 border border-slate-200 dark:border-slate-700 rounded-xl">
                <img src={photoUrl} alt="Bukti" className="w-16 h-16 rounded-lg object-cover" />
                <button type="button" onClick={() => setPhotoUrl('')} className="text-xs text-rose-600 font-semibold cursor-pointer">Hapus foto</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:border-amber-400">
                <Camera size={14} /> Upload Foto
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer dark:bg-slate-800 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? <SavingSpinner /> : <><Check size={16} /><span>{editingEntry ? 'Simpan Perubahan' : 'Simpan Kegiatan'}</span></>}
            </button>
          </div>
        </form>
      </div>

      <SuccessPopup
        isOpen={showSuccess}
        message={editingEntry ? "Perubahan kegiatan berhasil disimpan." : "Kegiatan berhasil dicatat."}
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    </div>
  );
};
