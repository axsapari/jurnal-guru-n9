import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FileDown, UploadCloud, X, Clock } from 'lucide-react';
import { User, ClassRoom, JournalEntry, ScheduleEntry } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImportUtils } from '../../utils/importUtils';

interface CalendarViewProps {
  currentUser: User;
  classes: ClassRoom[];
  journals: JournalEntry[];
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, classes, journals }) => {
  const isAdmin = currentUser.role === 'admin';
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; summary: string; details: string[] } | null>(null);

  useEffect(() => {
    StorageService.getSchedule().then(setSchedule);
  }, []);

  // Jurnal yang relevan: guru hanya lihat miliknya sendiri, admin lihat semua
  const relevantJournals = isAdmin ? journals : journals.filter(j => j.teacherId === currentUser.id);
  const myScheduleThisView = isAdmin ? schedule : schedule.filter(s => s.teacherId === currentUser.id);

  const journalsByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    relevantJournals.forEach(j => {
      const list = map.get(j.date) || [];
      list.push(j);
      map.set(j.date, list);
    });
    return map;
  }, [relevantJournals]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay(); // 0=Minggu

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  };

  const dateStr = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Hari sekolah (Senin-Sabtu) yang seharusnya ada jadwal mengajar tapi belum ada jurnal
  const isSchoolDayMissingJournal = (day: number) => {
    const jsDate = new Date(viewYear, viewMonth, day);
    const weekday = jsDate.getDay(); // 0=Minggu
    if (weekday === 0) return false; // Minggu bukan hari sekolah
    if (jsDate > today) return false; // jangan tandai hari yang belum terjadi
    const hasScheduleToday = myScheduleThisView.some(s => s.dayOfWeek === (weekday === 0 ? 7 : weekday));
    const hasJournalToday = (journalsByDate.get(dateStr(day)) || []).length > 0;
    return hasScheduleToday && !hasJournalToday;
  };

  const handleImportSchedule = async (file: File | null) => {
    if (!file) return;
    setIsImporting(true);
    setImportFeedback(null);
    try {
      const { rows, errors } = await ImportUtils.parseSchedule(file);
      const users = await StorageService.getUsers();
      const newEntries: ScheduleEntry[] = [];
      const rowErrors = [...errors];

      rows.forEach((r, i) => {
        const teacher = users.find(u => u.email.toLowerCase() === r.teacherEmail.toLowerCase());
        const cls = classes.find(c => c.name.toLowerCase() === r.className.toLowerCase());
        const dayNum = ImportUtils.DAY_NAME_TO_NUMBER[r.day.toLowerCase().trim()];

        if (!teacher) { rowErrors.push(`Baris ${i + 2}: email guru "${r.teacherEmail}" tidak ditemukan, dilewati.`); return; }
        if (!cls) { rowErrors.push(`Baris ${i + 2}: kelas "${r.className}" tidak ditemukan, dilewati.`); return; }
        if (!dayNum) { rowErrors.push(`Baris ${i + 2}: hari "${r.day}" tidak dikenali, dilewati.`); return; }

        newEntries.push({
          id: 'sch-' + Date.now() + '-' + i,
          teacherId: teacher.id,
          classId: cls.id,
          subject: r.subject,
          dayOfWeek: dayNum,
          timeSlot: r.timeSlot,
          academicYear: '2025/2026',
        });
      });

      if (newEntries.length === 0) {
        setImportFeedback({ type: 'error', summary: 'Tidak ada jadwal valid yang bisa diimpor.', details: rowErrors });
        return;
      }

      await StorageService.saveSchedule(newEntries);
      setSchedule(await StorageService.getSchedule());
      setImportFeedback({ type: 'success', summary: `Berhasil mengimpor ${newEntries.length} slot jadwal.`, details: rowErrors });
    } catch (err: any) {
      setImportFeedback({ type: 'error', summary: `Gagal membaca file: ${err?.message || 'format tidak dikenali'}`, details: [] });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedJournals = selectedDate ? (journalsByDate.get(selectedDate) || []) : [];

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>Kalender Akademik</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hijau = jurnal sudah diisi. Merah = ada jadwal mengajar tapi jurnal belum diisi.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => ImportUtils.downloadScheduleTemplate()}
                className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <FileDown size={14} /> Template Jadwal
              </button>
              <label className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5">
                <UploadCloud size={14} /> {isImporting ? 'Mengimpor...' : 'Impor Jadwal'}
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={isImporting} onChange={e => handleImportSchedule(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>

        {importFeedback && (
          <div className={`p-3 rounded-xl text-xs font-semibold space-y-1 ${importFeedback.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
            <p>{importFeedback.summary}</p>
            {importFeedback.details.length > 0 && (
              <ul className="list-disc list-inside font-normal opacity-90 max-h-24 overflow-y-auto">
                {importFeedback.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={goPrevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{MONTH_LABELS[viewMonth]} {viewYear}</h3>
          <button onClick={goNextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const ds = dateStr(day);
            const dayJournals = journalsByDate.get(ds) || [];
            const hasEntries = dayJournals.length > 0;
            const missing = isSchoolDayMissingJournal(day);
            const isToday = ds === today.toISOString().slice(0, 10);
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer border ${
                  hasEntries
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                    : missing
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <span>{day}</span>
                {hasEntries && <span className="text-[9px] font-normal">{dayJournals.length} jurnal</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {selectedJournals.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-6">Belum ada jurnal terisi tanggal ini.</p>
            ) : (
              <div className="space-y-2">
                {selectedJournals.map(j => (
                  <div key={j.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock size={12} /> {j.timeSlot}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{j.className} — {j.subject} ({j.teacherName})</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{j.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
