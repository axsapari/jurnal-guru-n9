import React, { useState, useEffect } from 'react';
import { 
  Database, Code2, Copy, Check, ExternalLink, 
  Sparkles, FileCode, CheckCircle2, Globe, ShieldCheck, X
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface GasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedUrl: () => void;
}

export const GasExportModal: React.FC<GasExportModalProps> = ({
  isOpen,
  onClose,
  onSavedUrl
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'instructions'>('config');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) StorageService.getGasWebAppUrl().then(setWebAppUrl);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.setGasWebAppUrl(webAppUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onSavedUrl();
  };

  const gasBackendCode = `/**
 * GOOGLE APPS SCRIPT BACKEND & GOOGLE SHEETS DATABASE CONTROLLER
 * Aplikasi Jurnal Harian Guru & Absensi Terpadu
 * 
 * Silakan salin kode ini ke file 'Code.gs' di Editor Google Apps Script Anda.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Aplikasi Jurnal Harian Guru')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'SAVE_JOURNAL') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        result: saveJournalToSheet(data.payload)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveJournalToSheet(entry) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('JURNAL_HARIAN');
  
  if (!sheet) {
    sheet = ss.insertSheet('JURNAL_HARIAN');
    sheet.appendRow([
      'ID Jurnal', 'Tanggal', 'Jam Ke', 'Guru', 'Kelas', 'Mata Pelajaran',
      'Tujuan Pembelajaran', 'Ringkasan Kegiatan', 'Hadir', 'Sakit', 'Izin', 'Alpa',
      'Foto Drive ID', 'File Name Foto', 'Waktu Dibuat'
    ]);
  }

  sheet.appendRow([
    entry.id,
    entry.date,
    entry.timeSlot,
    entry.teacherName,
    entry.className,
    entry.subject,
    entry.tpDescriptions.join('; '),
    entry.summary,
    entry.attendanceSummary.hadir,
    entry.attendanceSummary.sakit,
    entry.attendanceSummary.izin,
    entry.attendanceSummary.alpa,
    entry.photoDriveId || '',
    entry.photoFileName || '',
    new Date()
  ]);

  return { id: entry.id, status: 'saved' };
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gasBackendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Integrasi Google Apps Script & Google Sheets</h3>
              <p className="text-xs text-slate-400">Database tersentralisasi & ekspor kode Apps Script</p>
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer ${
              activeTab === 'config' 
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 border-x border-slate-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hubungkan Web App URL
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer ${
              activeTab === 'code' 
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 border-x border-slate-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kode Google Apps Script (Code.gs)
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2.5 rounded-t-xl transition cursor-pointer ${
              activeTab === 'instructions' 
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 border-x border-slate-200 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panduan Deployment
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-600" />
                  <span>Sinkronisasi Otomatis Ke Google Sheets</span>
                </p>
                <p className="leading-relaxed">
                  Masukkan Web App Deployment URL yang dihasilkan dari Google Apps Script Anda. Seluruh input jurnal, absensi, dan foto akan disinkronkan secara aman ke spreadsheet sekolah Anda.
                </p>
              </div>

              {savedSuccess && (
                <div className="bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>URL Google Sheets Web App Berhasil Disimpan & Terhubung!</span>
                </div>
              )}

              <form onSubmit={handleSaveUrl} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Google Apps Script Web App Endpoint URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webAppUrl}
                    onChange={e => setWebAppUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Simpan & Hubungkan
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">
                  Kode Backend Google Apps Script (Salin ke Code.gs)
                </p>

                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800">
                {gasBackendCode}
              </pre>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <h4 className="font-bold text-slate-900 text-sm">Langkah Deploy Aplikasi ke Google Apps Script:</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Buka <strong>Google Sheets</strong> sekolah Anda atau buat Spreadsheet baru.</li>
                <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.</li>
                <li>Hapus kode default di <code className="bg-slate-100 px-1 rounded text-indigo-700 font-bold">Code.gs</code>, kemudian tempelkan kode Apps Script dari tab <em>Kode Google Apps Script</em> di atas.</li>
                <li>Klik tombol <strong>Deploy (Terapkan)</strong> &gt; pilih <strong>Deployment baru (New Deployment)</strong>.</li>
                <li>Pilih jenis deployment: <strong>Aplikasi Web (Web App)</strong>.</li>
                <li>Atur akses: <em>"Akses: Siapa saja (Anyone)"</em>.</li>
                <li>Salin <strong>URL Aplikasi Web</strong> yang dihasilkan dan paste pada tab <em>Hubungkan Web App URL</em> aplikasi ini.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
