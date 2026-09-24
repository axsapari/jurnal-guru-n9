import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface OfflineBannerProps {
  onSyncComplete?: () => void;
  connectionError?: string | null;
  usingCache?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncComplete, connectionError, usingCache }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const updateStatus = () => {
    setIsOnline(navigator.onLine);
    setPendingCount(StorageService.getPendingSyncCount());
  };

  useEffect(() => {
    updateStatus();

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
      if (onSyncComplete) onSyncComplete(); // also retry loading fresh data from Supabase
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updateStatus, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Menyinkronkan data jurnal ke database...');

    try {
      const result = await StorageService.syncAllPending();
      if (result.syncedCount > 0) {
        setSyncMessage(`Berhasil menyinkronkan ${result.syncedCount} jurnal!`);
      } else {
        setSyncMessage('Semua data sudah tersinkronisasi dengan aman.');
      }
      updateStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (e) {
      setSyncMessage('Gagal menyinkronkan data. Coba lagi nanti.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const hasIssue = !isOnline || !!connectionError || pendingCount > 0;

  // Nothing to report and nothing pending -> stay fully out of the way.
  if (!hasIssue && !syncMessage) return null;

  return (
    <div className="fixed top-3 left-3 z-[60] print:hidden max-w-xs">
      <button
        onClick={() => setExpanded(e => !e)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-md border cursor-pointer transition ${
          !isOnline || connectionError
            ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : pendingCount > 0
            ? 'bg-orange-50 dark:bg-orange-950/90 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
            : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        }`}
      >
        {!isOnline ? (
          <><WifiOff size={13} /> <span>Offline</span></>
        ) : connectionError ? (
          <><CloudOff size={13} /> <span>Gagal sinkron</span></>
        ) : pendingCount > 0 ? (
          <><AlertTriangle size={13} /> <span>{pendingCount} belum tersinkron</span></>
        ) : (
          <><Wifi size={13} /> <span>Online</span></>
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-2">
          {!isOnline && (
            <p className="text-slate-600 dark:text-slate-300">
              Perangkat kamu sedang offline. Aplikasi tetap bisa dipakai — jurnal yang disimpan akan otomatis tersinkron begitu koneksi kembali.
            </p>
          )}
          {isOnline && connectionError && (
            <p className="text-slate-600 dark:text-slate-300">
              Gagal terhubung ke server{usingCache ? ', menampilkan data terakhir yang tersimpan di perangkat ini' : ''}. Coba muat ulang halaman kalau masalah berlanjut.
            </p>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-300">{pendingCount} jurnal menunggu disinkronkan.</span>
              {isOnline && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
                </button>
              )}
            </div>
          )}
          {syncMessage && (
            <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} /> {syncMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
