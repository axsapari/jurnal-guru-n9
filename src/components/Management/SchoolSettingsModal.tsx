import React, { useState } from 'react';
import { Building2, X, Check, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { SchoolConfig } from '../../types';
import { StorageService } from '../../services/storageService';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolConfig: SchoolConfig;
  onSaved: () => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  schoolConfig,
  onSaved
}) => {
  const [formData, setFormData] = useState<SchoolConfig>({ ...schoolConfig });
  const [successToast, setSuccessToast] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState<'school' | 'city' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.saveSchoolConfig(formData);
    setSuccessToast(true);
    onSaved();
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 1500);
  };

  const handleLogoFileChange = async (kind: 'school' | 'city', file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadingLogo(kind);
    try {
      const url = await StorageService.uploadLogo(file, kind);
      setFormData(prev => kind === 'school' ? { ...prev, logoUrl: url } : { ...prev, cityLogoUrl: url });
    } catch (err: any) {
      setUploadError(`Gagal mengupload logo: ${err?.message || 'terjadi kesalahan'}`);
    } finally {
      setUploadingLogo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">Pengaturan Sekolah & Kop Surat Laporan</h3>
              <p className="text-xs text-indigo-100">Ubah detail nama sekolah, logo, dan NIP kepala sekolah</p>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200">
          
          {successToast && (
            <div className="p-3 bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <Check size={18} />
              <span>Pengaturan Kop Surat & Identitas Sekolah Berhasil Disimpan!</span>
            </div>
          )}

          {/* Section 1: Logo Kop Surat */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
            <label className="block font-bold text-slate-900 dark:text-slate-100 text-xs">
              1. Logo Kop Surat (Kiri: Pemerintah Kota/Kab. — Kanan: Sekolah)
            </label>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] font-semibold">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo Kota/Kabupaten */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {formData.cityLogoUrl ? (
                    <img src={formData.cityLogoUrl} alt="Logo Kota/Kabupaten" className="w-16 h-16 object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={28} />
                  )}
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Logo Pemerintah Kota/Kabupaten (kiri)
                  </label>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-400 transition">
                    <Upload size={13} />
                    {uploadingLogo === 'city' ? 'Mengupload...' : 'Upload Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoFileChange('city', e.target.files?.[0] || null)}
                      disabled={uploadingLogo !== null}
                    />
                  </label>
                  <input
                    type="url"
                    value={formData.cityLogoUrl || ''}
                    onChange={e => setFormData({ ...formData, cityLogoUrl: e.target.value })}
                    placeholder="atau tempel URL gambar di sini"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[10px] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Logo Sekolah */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Sekolah" className="w-16 h-16 object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={28} />
                  )}
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Logo Sekolah (kanan)
                  </label>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-400 transition">
                    <Upload size={13} />
                    {uploadingLogo === 'school' ? 'Mengupload...' : 'Upload Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoFileChange('school', e.target.files?.[0] || null)}
                      disabled={uploadingLogo !== null}
                    />
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="atau tempel URL gambar di sini"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[10px] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Gambar yang diupload disimpan otomatis di Supabase Storage (bucket "logos") — tidak perlu hosting gambar terpisah.
            </p>
          </div>

          {/* Section 2: Identitas Sekolah */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 text-xs">
              2. Identitas Lembaga & Kop Surat
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="SMP NEGERI 1 NUSANTARA"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NPSN</label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                  placeholder="20234567"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Sekolah Lengkap</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Pendidikan No. 45, Kecamatan Cerdas"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Kota Pendidikan"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Provinsi</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Jawa Barat"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(021) 555-0199"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Sekolah</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@smpn1.sch.id"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Website Sekolah</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="www.smpn1.sch.id"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kepala Sekolah */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              3. Data Kepala Sekolah (Tanda Tangan Laporan)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kepala Sekolah & Gelar</label>
                <input
                  type="text"
                  required
                  value={formData.headmasterName}
                  onChange={e => setFormData({ ...formData, headmasterName: e.target.value })}
                  placeholder="Drs. H. Ahmad Wijaya, M.Pd."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.headmasterNip}
                  onChange={e => setFormData({ ...formData, headmasterNip: e.target.value })}
                  placeholder="19680315 199303 1 004"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              * Perubahan akan langsung berlaku pada seluruh halaman Kop Surat & Laporan Cetak.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
