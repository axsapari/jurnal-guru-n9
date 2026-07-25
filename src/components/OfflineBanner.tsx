import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface OfflineBannerProps {
  onSyncComplete?: () => void;
  onOpenGasModal?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncComplete, onOpenGasModal }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [gasUrl, setGasUrl] = useState<string>('');

  const updateStatus = () => {
    setIsOnline(navigator.onLine);
    setPendingCount(StorageService.getPendingSyncCount());
  };

  useEffect(() => {
    updateStatus();
    StorageService.getGasWebAppUrl().then(setGasUrl);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync on reconnect
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh count periodically
    const interval = setInterval(updateStatus, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
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

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Connection status badge */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-medium border border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Wifi size={13} /> Status: Terhubung Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 font-medium border border-amber-800/50">
              <WifiOff size={13} /> Mode Offline (Tersimpan Lokal)
            </span>
          )}

          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-900/60 text-orange-200 border border-orange-700/50">
              <AlertTriangle size={13} className="text-orange-400" />
              {pendingCount} Jurnal Menunggu Sinkronisasi
            </span>
          )}

          {syncMessage && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-slate-300 bg-slate-800 rounded">
              <CheckCircle2 size={13} className="text-emerald-400" />
              {syncMessage}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 && isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </button>
          )}

          <button
            onClick={onOpenGasModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Pengaturan Google Sheets & Google Apps Script"
          >
            <Database size={13} className="text-amber-400" />
            <span>{gasUrl ? 'Google Sheets Terhubung' : 'Integrasi Google Sheets / GAS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
