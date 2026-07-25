import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, MessageSquare, Mail, CheckCircle2, 
  Clock, AlertTriangle, ShieldCheck, History
} from 'lucide-react';
import { User, JournalEntry, ReminderLog } from '../../types';
import { StorageService } from '../../services/storageService';

interface ReminderCenterModalProps {
  teachers: User[];
  journals: JournalEntry[];
}

export const ReminderCenterModal: React.FC<ReminderCenterModalProps> = ({ teachers, journals }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    StorageService.getReminders().then(setReminderLogs);
  }, []);

  // Active teaching teachers (excluding admin)
  const activeTeachers = teachers.filter(t => t.role === 'teacher');
  const todayJournals = journals.filter(j => j.date === todayStr);

  const submittedTeacherIds = new Set(todayJournals.map(j => j.teacherId));
  const pendingTeachers = activeTeachers.filter(t => !submittedTeacherIds.has(t.id));

  const handleSendReminder = async (teacher: User, channel: 'whatsapp' | 'email' | 'in_app') => {
    const message = `Yth. Bapak/Ibu ${teacher.name}, mohon untuk segera mengisikan Jurnal Harian Mengajar dan Absensi Siswa untuk hari ini (${new Date().toLocaleDateString('id-ID')}). Terima kasih.`;

    if (channel === 'whatsapp' && teacher.phone) {
      const cleanPhone = teacher.phone.replace(/^0/, '62').replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    const newLog: ReminderLog = {
      id: 'rem-' + Date.now(),
      teacherId: teacher.id,
      teacherName: teacher.name,
      date: todayStr,
      channel,
      message,
      sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    await StorageService.addReminder(newLog);
    setReminderLogs(await StorageService.getReminders());

    setSuccessToast(`Pengingat ${channel.toUpperCase()} berhasil dikirimkan ke ${teacher.name}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell size={20} className="text-rose-600" />
            <span>Sistem Notifikasi Pengingat Guru</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingatkan guru yang belum mencatat kegiatan mengajar dan absensi hari ini secara otomatis via WhatsApp & Notifikasi System.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-600" />
          <span>{pendingTeachers.length} Guru Belum Mengisi</span>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Grid: Pending List & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Pending Teachers */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <span>Daftar Guru Belum Mengisi Hari Ini ({pendingTeachers.length})</span>
          </h3>

          {pendingTeachers.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
              <p className="font-bold text-sm">Semua Guru Sudah Mengisi Jurnal!</p>
              <p className="text-xs text-emerald-700">Luar biasa! Seluruh guru telah melengkapi kegiatan mengajar dan absensi siswa hari ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {pendingTeachers.map(teacher => (
                <div key={teacher.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                  <div className="flex items-center gap-3">
                    <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{teacher.name}</p>
                      <p className="text-[11px] text-slate-500">{teacher.subject} • NIP: {teacher.nip}</p>
                      <p className="text-[10px] text-indigo-600 font-mono mt-0.5">WA: {teacher.phone || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReminder(teacher, 'whatsapp')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <MessageSquare size={13} />
                      <span>Ingatkan WA</span>
                    </button>

                    <button
                      onClick={() => handleSendReminder(teacher, 'in_app')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Bell size={13} />
                      <span>Notifikasi System</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Log Pengingat Sent */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History size={18} className="text-indigo-600" />
            <span>Riwayat Pengingat Terkirim</span>
          </h3>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {reminderLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed border-slate-200 rounded-xl">
                Belum ada pengingat dikirimkan hari ini.
              </p>
            ) : (
              reminderLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.teacherName}</span>
                    <span className="text-[10px] font-bold text-slate-500">{log.sentAt}</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 font-semibold uppercase">
                    Channel: {log.channel}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
