import React, { useState, useEffect, useMemo } from 'react';
import { CalendarClock, Clock, MapPin } from 'lucide-react';
import { User, ClassRoom, ScheduleEntry } from '../../types';
import { StorageService } from '../../services/storageService';

interface ScheduleListViewProps {
  currentUser: User;
  classes: ClassRoom[];
  teachers: User[];
}

const DAY_NAMES = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const ScheduleListView: React.FC<ScheduleListViewProps> = ({ currentUser, classes, teachers }) => {
  const isAdmin = currentUser.role === 'admin';
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [daysAhead, setDaysAhead] = useState(14);

  useEffect(() => {
    StorageService.getSchedule().then(list =>
      setSchedule(isAdmin ? list : list.filter(s => s.teacherId === currentUser.id))
    );
  }, [currentUser.id, isAdmin]);

  // Bangun daftar "upcoming" konkret: untuk setiap hari ke depan, cocokkan jadwal berulang mingguan
  const upcomingEntries = useMemo(() => {
    const today = new Date();
    const result: { date: string; dayName: string; entry: ScheduleEntry }[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const jsWeekday = d.getDay(); // 0=Minggu
      const dayOfWeek = jsWeekday === 0 ? 7 : jsWeekday;
      const dateStr = d.toISOString().slice(0, 10);

      schedule
        .filter(s => s.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
        .forEach(entry => {
          result.push({ date: dateStr, dayName: DAY_NAMES[dayOfWeek], entry });
        });
    }
    return result;
  }, [schedule, daysAhead]);

  // Kelompokkan per tanggal untuk tampilan
  const groupedByDate = useMemo(() => {
    const map = new Map<string, { dayName: string; entries: ScheduleEntry[] }>();
    upcomingEntries.forEach(({ date, dayName, entry }) => {
      const existing = map.get(date) || { dayName, entries: [] };
      existing.entries.push(entry);
      map.set(date, existing);
    });
    return [...map.entries()];
  }, [upcomingEntries]);

  const formatDate = (ds: string) => {
    const d = new Date(ds + 'T00:00:00');
    return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  };
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarClock size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>Jadwal Mengajar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? 'Jadwal mengajar seluruh guru yang akan datang.' : 'Jadwal mengajarmu yang akan datang.'}
            </p>
          </div>
          <select
            value={daysAhead}
            onChange={e => setDaysAhead(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value={7}>7 hari ke depan</option>
            <option value={14}>14 hari ke depan</option>
            <option value={30}>30 hari ke depan</option>
          </select>
        </div>
      </div>

      {groupedByDate.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center">
          <CalendarClock size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {schedule.length === 0
              ? 'Belum ada jadwal mengajar yang diimpor. Hubungi admin untuk mengimpor jadwal.'
              : 'Tidak ada jadwal dalam rentang waktu ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, { dayName, entries }]) => (
            <div key={date} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className={`px-4 py-2.5 flex items-center justify-between ${date === todayStr ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'}`}>
                <span className="text-xs font-bold">{dayName}, {formatDate(date)}</span>
                {date === todayStr && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">HARI INI</span>}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map(entry => (
                  <div key={entry.id} className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{entry.subject}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> Kelas {classes.find(c => c.id === entry.classId)?.name || '-'}
                        {isAdmin && (() => {
                          const t = teachers.find(t => t.id === entry.teacherId);
                          return t ? <span> • {t.name}</span> : null;
                        })()}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                      {entry.timeSlot}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
