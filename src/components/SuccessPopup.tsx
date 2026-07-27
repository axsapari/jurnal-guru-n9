import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface SuccessPopupProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

// Center-screen popup confirming a save succeeded. Auto-closes after a delay
// but can also be dismissed manually.
export const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, message, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 max-w-xs text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
          <CheckCircle2 size={30} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">Berhasil Disimpan!</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
};

// Spinner + label for a save button's in-progress state. Use alongside a
// `disabled={isSaving}` on the button itself to block double-clicks.
export const SavingSpinner: React.FC<{ label?: string }> = ({ label = 'Menyimpan...' }) => (
  <>
    <Loader2 size={15} className="animate-spin" />
    <span>{label}</span>
  </>
);
