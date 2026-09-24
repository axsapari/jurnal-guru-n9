import React from 'react';
import { Code2, X, Heart, School } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

const DEVELOPER_NAME = 'Agus Sugiharto Sapari, S.Pd.';

export const FooterCredit: React.FC = () => (
  <footer className="w-full py-4 px-4 text-center print:hidden">
    <p className="text-[11px] text-slate-400 dark:text-slate-600">
      Jurnal Guru — dikembangkan oleh <span className="font-semibold text-slate-500 dark:text-slate-500">{DEVELOPER_NAME}</span>
    </p>
  </footer>
);

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, schoolName }) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end -mb-2">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white">
          <Code2 size={26} />
        </div>

        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Jurnal Guru</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem Jurnal Harian, Absensi, Nilai & Kalender Akademik Terpadu
            {schoolName ? ` untuk ${schoolName}` : ''}.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <School size={12} /> Dikembangkan oleh
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{DEVELOPER_NAME}</p>
        </div>

        <p className="text-[10px] text-slate-300 dark:text-slate-600 flex items-center justify-center gap-1 pt-1">
          Dibuat dengan <Heart size={10} className="text-rose-400 fill-rose-400" /> untuk mendukung administrasi sekolah
        </p>
      </div>
    </div>
  );
};
