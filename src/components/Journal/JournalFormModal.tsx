import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Plus, Check, UserCheck, AlertCircle, 
  Trash2, Sparkles, BookOpen, Target, Calendar, Clock, FileText, Upload, Shield
} from 'lucide-react';
import { 
  User, ClassRoom, Student, LearningObjective, 
  JournalEntry, AttendanceStatus, IncidentRecord, ScheduleEntry
} from '../../types';
import { StorageService } from '../../services/storageService';
import { SUBJECTS } from '../../data/subjects';
import { SuccessPopup, SavingSpinner } from '../SuccessPopup';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { compressImage } from '../../utils/imageUtils';

interface JournalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  classes: ClassRoom[];
  learningObjectives: LearningObjective[];
  editingEntry?: JournalEntry | null;
  onSaved: (entry: JournalEntry) => void;
}

export const JournalFormModal: React.FC<JournalFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  classes,
  learningObjectives,
  editingEntry,
  onSaved
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Guru hanya melihat kelas yang diampu (kalau daftar classIds-nya diisi admin);
  // kalau kosong (belum diset) atau role admin, tampilkan semua kelas.
  const scopedClasses = (currentUser.role === 'admin' || !currentUser.classIds || currentUser.classIds.length === 0)
    ? classes
    : classes.filter(c => currentUser.classIds!.includes(c.id));

  // Guru hanya bisa pilih mapel yang diampunya; admin bisa pilih semua mapel resmi sekolah.
  const subjectOptions = currentUser.role === 'admin'
    ? SUBJECTS
    : (currentUser.subjects && currentUser.subjects.length > 0 ? currentUser.subjects : (currentUser.subject ? [currentUser.subject] : SUBJECTS));

  const [date, setDate] = useState(todayStr);
  const [selectedClassId, setSelectedClassId] = useState(scopedClasses[0]?.id || '');
  const [subject, setSubject] = useState(subjectOptions[0] || '');
  const [timeSlot, setTimeSlot] = useState('Jam ke 1-2 (07:30 - 09:00)');
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [tpSearchQuery, setTpSearchQuery] = useState('');
  const [summary, setSummary] = useState('');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    StorageService.getSchedule().then(setSchedule);
  }, []);

  // Slot jam yang cocok dengan jadwal guru ini untuk kelas+mapel+hari yang dipilih
  const scheduledTimeSlots = React.useMemo(() => {
    const jsWeekday = new Date(date + 'T00:00:00').getDay(); // 0=Minggu
    const dayOfWeek = jsWeekday === 0 ? 7 : jsWeekday;
    return [...new Set(
      schedule
        .filter(s => s.teacherId === currentUser.id && s.classId === selectedClassId && s.subject === subject && s.dayOfWeek === dayOfWeek)
        .map(s => s.timeSlot)
    )];
  }, [schedule, date, selectedClassId, subject, currentUser.id]);

  // Gabungkan beberapa slot jam berurutan (mis. "Jam ke 1", "Jam ke 2", "Jam ke 3")
  // jadi satu rentang "Jam ke 1-3 (07:15 - 09:15)" untuk diisi otomatis ke kolom Jam Ke-.
  const mergedScheduleTimeSlot = React.useMemo(() => {
    if (scheduledTimeSlots.length === 0) return null;

    const parsed = scheduledTimeSlots
      .map(ts => {
        const m = ts.match(/Jam ke\s*(\d+)\s*\(([\d:]+)\s*-\s*([\d:]+)\)/i);
        if (!m) return null;
        return { period: parseInt(m[1], 10), start: m[2], end: m[3], raw: ts };
      })
      .filter((x): x is { period: number; start: string; end: string; raw: string } => !!x)
      .sort((a, b) => a.period - b.period);

    if (parsed.length === 0) return scheduledTimeSlots[0]; // format tidak dikenali, pakai apa adanya
    if (parsed.length === 1) return parsed[0].raw;

    // Cek apakah nomor jam berurutan (1,2,3,...) sebelum digabung jadi satu rentang
    const isContiguous = parsed.every((p, i) => i === 0 || p.period === parsed[i - 1].period + 1);
    if (!isContiguous) return parsed.map(p => p.raw).join(', ');

    const first = parsed[0];
    const last = parsed[parsed.length - 1];
    return `Jam ke ${first.period}-${last.period} (${first.start} - ${last.end})`;
  }, [scheduledTimeSlots]);

  // Isi otomatis kolom Jam Ke- setiap kali jadwal yang cocok berubah (kelas/mapel/tanggal diganti)
  useEffect(() => {
    if (mergedScheduleTimeSlot && !editingEntry) {
      setTimeSlot(mergedScheduleTimeSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedScheduleTimeSlot]);

  // Attendance state: studentId -> status
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  
  // Incident notes state
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [newIncidentStudentId, setNewIncidentStudentId] = useState('');
  const [newIncidentCategory, setNewIncidentCategory] = useState<'catatan' | 'prestasi' | 'pelanggaran'>('catatan');
  const [newIncidentNote, setNewIncidentNote] = useState('');

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('');

  // Inline TP creation
  const [showAddTpInline, setShowAddTpInline] = useState(false);
  const [newTpCode, setNewTpCode] = useState('');
  const [newTpDesc, setNewTpDesc] = useState('');

  const activeClass = scopedClasses.find(c => c.id === selectedClassId) || scopedClasses[0];
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const pendingEditAttendance = useRef<Record<string, AttendanceStatus> | null>(null);

  // Fetch students & initialize attendance whenever the selected class changes
  useEffect(() => {
    let cancelled = false;
    if (selectedClassId) {
      StorageService.getStudents(selectedClassId).then(list => {
        if (cancelled) return;
        setStudentsInClass(list);
        const initialAtt: Record<string, AttendanceStatus> = {};
        const savedAtt = pendingEditAttendance.current;
        list.forEach(s => { initialAtt[s.id] = savedAtt?.[s.id] || 'hadir'; });
        setAttendance(initialAtt);
        pendingEditAttendance.current = null; // hanya dipakai sekali saat buka mode edit
      });
    } else {
      setStudentsInClass([]);
    }
    return () => { cancelled = true; };
  }, [selectedClassId]);

  // Set all students as 'hadir'
  const handleMarkAllHadir = () => {
    const updatedAtt: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach(s => {
      updatedAtt[s.id] = 'hadir';
    });
    setAttendance(updatedAtt);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // Add Incident Note
  const handleAddIncident = () => {
    if (!newIncidentStudentId || !newIncidentNote.trim()) return;
    const student = studentsInClass.find(s => s.id === newIncidentStudentId);
    if (!student) return;

    const newRecord: IncidentRecord = {
      id: 'inc-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      category: newIncidentCategory,
      note: newIncidentNote.trim()
    };

    setIncidents(prev => [...prev, newRecord]);
    setNewIncidentNote('');
    setNewIncidentStudentId('');
  };

  const handleRemoveIncident = (id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  // Handle Image Upload Simulation / Camera File
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const hint = `${activeClass?.name || 'CLS'}_${date.replace(/-/g, '')}_${subject.replace(/\s+/g, '')}`;
      const { url, fileName } = await StorageService.uploadJournalPhoto(compressed, hint);
      setPhotoUrl(url);
      setPhotoFileName(fileName);
    } catch (err: any) {
      setPhotoError(`Gagal upload foto: ${err?.message || 'terjadi kesalahan'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };


  // Inline TP Add
  const handleSaveInlineTp = async () => {
    if (!newTpDesc.trim()) return;
    const code = newTpCode.trim() || `TP.${subject.slice(0,3).toUpperCase()}.${activeClass?.grade || '7'}.${learningObjectives.length + 1}`;
    
    const newTp: LearningObjective = {
      id: 'tp-' + Date.now(),
      subject: subject,
      grade: activeClass?.grade || '7',
      code: code,
      description: newTpDesc.trim()
    };

    await StorageService.addLearningObjective(newTp);
    setSelectedTpIds(prev => [...prev, newTp.id]);
    setNewTpCode('');
    setNewTpDesc('');
    setShowAddTpInline(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // cegah klik dobel yang bikin jurnal dobel
    if (!selectedClassId || !summary.trim()) {
      alert('Mohon isi kelas dan ringkasan kegiatan pembelajaran.');
      return;
    }

    setIsSubmitting(true);
    try {

    // Attendance summary count
    let hadir = 0, sakit = 0, izin = 0, alpa = 0;
    Object.values(attendance).forEach(status => {
      if (status === 'hadir') hadir++;
      else if (status === 'sakit') sakit++;
      else if (status === 'izin') izin++;
      else if (status === 'alpa') alpa++;
    });

    const selectedTps = learningObjectives.filter(tp => selectedTpIds.includes(tp.id));
    const tpDescriptions = selectedTps.map(tp => `${tp.code}: ${tp.description}`);

    const newJournal: JournalEntry = {
      id: editingEntry?.id || `JRNL-${date.replace(/-/g, '')}-${activeClass.name}-${Math.floor(Math.random() * 899 + 100)}`,
      date,
      timeSlot,
      teacherId: editingEntry?.teacherId || currentUser.id,
      teacherName: editingEntry?.teacherName || currentUser.name,
      classId: selectedClassId,
      className: activeClass ? activeClass.name : 'Kelas',
      subject,
      tpIds: selectedTpIds,
      tpDescriptions,
      summary,
      attendance,
      attendanceSummary: {
        hadir,
        sakit,
        izin,
        alpa,
        total: studentsInClass.length
      },
      incidents,
      photoUrl,
      photoFileName,
      syncStatus: 'pending',
      createdAt: editingEntry?.createdAt || new Date().toISOString()
    };

    const saved = await StorageService.saveJournalEntry(newJournal);
    onSaved(saved.entry);
    setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEscapeKey(isOpen && !isSubmitting, onClose);

  // Isi ulang form saat modal dibuka: mode edit -> isi dari editingEntry, mode tambah -> reset ke default
  useEffect(() => {
    if (!isOpen) return;
    if (editingEntry) {
      setDate(editingEntry.date);
      setSelectedClassId(editingEntry.classId);
      setSubject(editingEntry.subject);
      setTimeSlot(editingEntry.timeSlot);
      setSelectedTpIds(editingEntry.tpIds || []);
      setSummary(editingEntry.summary);
      setIncidents(editingEntry.incidents || []);
      setPhotoUrl(editingEntry.photoUrl || '');
      setPhotoFileName(editingEntry.photoFileName || '');
      pendingEditAttendance.current = editingEntry.attendance || {};
    } else {
      setDate(todayStr);
      setSelectedClassId(scopedClasses[0]?.id || '');
      setSubject(subjectOptions[0] || '');
      setTimeSlot('Jam ke 1-2 (07:30 - 09:00)');
      setSelectedTpIds([]);
      setSummary('');
      setIncidents([]);
      setPhotoUrl('');
      setPhotoFileName('');
      pendingEditAttendance.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingEntry]);

  if (!isOpen) return null;

  // TP hanya yang sesuai kelas (tingkat) DAN mata pelajaran yang dipilih,
  // supaya daftarnya tidak kepanjangan dan tidak salah pilih TP mapel lain.
  const availableTps = learningObjectives.filter(tp => {
    const matchesClassSubject = tp.subject.toLowerCase() === subject.toLowerCase() && tp.grade === activeClass?.grade;
    if (!matchesClassSubject) return false;
    if (!tpSearchQuery.trim()) return true;
    const q = tpSearchQuery.toLowerCase();
    return tp.code.toLowerCase().includes(q) || tp.description.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{editingEntry ? 'Edit Jurnal Harian & Absensi Siswa' : 'Input Jurnal Harian & Absensi Siswa'}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">{editingEntry ? 'Perbarui data jurnal yang sudah tersimpan' : 'Pengisian terpadu kegiatan mengajar & catatan kelas'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Tanggal, Kelas, Jam & Mapel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 dark:bg-slate-800/60 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1 dark:text-slate-300">
                <Calendar size={13} className="text-indigo-600" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1 dark:text-slate-300">
                <BookOpen size={13} className="text-indigo-600" /> Pilih Kelas
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer dark:bg-slate-900 dark:text-white dark:border-slate-700"
              >
                {scopedClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c.studentCount || 30} Siswa)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1 dark:text-slate-300">
                <Clock size={13} className="text-indigo-600" /> Jam Ke- / Waktu
              </label>
              <input
                type="text"
                list="schedule-timeslots"
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                placeholder="misal: Jam ke 1-2 (07:30 - 09:00)"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
              />
              <datalist id="schedule-timeslots">
                {scheduledTimeSlots.map(ts => <option key={ts} value={ts} />)}
              </datalist>
              {scheduledTimeSlots.length > 0 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Sesuai jadwal kamu hari ini: {scheduledTimeSlots.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1 dark:text-slate-300">
                <FileText size={13} className="text-indigo-600" /> Mata Pelajaran
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
              >
                {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Section 2: Tujuan Pembelajaran (TP) Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 dark:text-white">
                <Target size={15} className="text-indigo-600" />
                <span>Pilih Tujuan Pembelajaran (TP) Dituju</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowAddTpInline(!showAddTpInline)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> + Tambah TP Baru
              </button>
            </div>

            <input
              type="text"
              value={tpSearchQuery}
              onChange={e => setTpSearchQuery(e.target.value)}
              placeholder="Cari nomor TP atau kata kunci deskripsi..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />

            {showAddTpInline && (
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2 text-xs animate-in fade-in duration-150">
                <p className="font-bold text-indigo-950">Tambah Tujuan Pembelajaran (TP) Baru</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Kode TP (misal: TP.MAT.7.3)"
                    value={newTpCode}
                    onChange={e => setNewTpCode(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Uraian Tujuan Pembelajaran..."
                    value={newTpDesc}
                    onChange={e => setNewTpDesc(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs dark:bg-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddTpInline(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineTp}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Simpan TP
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
              {availableTps.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 text-center dark:text-slate-400 dark:text-slate-500">
                  Belum ada TP untuk mata pelajaran ini. Klik "+ Tambah TP Baru" di atas.
                </p>
              ) : (
                availableTps.map(tp => {
                  const isChecked = selectedTpIds.includes(tp.id);
                  return (
                    <label
                      key={tp.id}
                      className={`flex items-start gap-2.5 p-2 rounded-xl text-xs transition cursor-pointer border ${
                        isChecked 
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 font-medium' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedTpIds(prev => prev.filter(id => id !== tp.id));
                          } else {
                            setSelectedTpIds(prev => [...prev, tp.id]);
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-indigo-700 mr-1.5">{tp.code}</span>
                        <span>{tp.description}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Ringkasan Kegiatan Pembelajaran */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 dark:text-white">
              <FileText size={15} className="text-indigo-600" /> Uraian Kegiatan Pembelajaran / Ringkasan Materi
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Jelaskan metode pembelajaran, materi yang disampaikan, kendala kelas, serta tindak lanjut..."
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed dark:bg-slate-900 dark:text-white dark:border-slate-700"
            ></textarea>
          </div>

          {/* Section 4: Absensi Siswa */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 dark:text-white">
                  <UserCheck size={16} className="text-emerald-600" />
                  <span>Absensi Siswa Kelas {activeClass?.name} ({studentsInClass.length} Siswa)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Tandai status kehadiran siswa per pertemuan</p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Check size={14} /> Set Semua Hadir
              </button>
            </div>

            {/* Students Attendance Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto dark:border-slate-800">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {/* Header row - desktop only */}
                <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] sticky top-0">
                  <span className="w-8">No</span>
                  <span className="w-24">NISN</span>
                  <span className="flex-1">Nama Siswa</span>
                  <span className="w-64 text-center">Status Kehadiran</span>
                </div>

                {studentsInClass.map((student, idx) => {
                  const currentStatus = attendance[student.id] || 'hadir';
                  const statusOptions = [
                    { id: 'hadir', label: 'Hadir', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700' },
                    { id: 'sakit', label: 'Sakit', bg: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700' },
                    { id: 'izin', label: 'Izin', bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700' },
                    { id: 'alpa', label: 'Alpa', bg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700' },
                  ];
                  return (
                    <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="flex items-center gap-3 sm:contents">
                        <span className="w-8 shrink-0 font-semibold text-slate-500 dark:text-slate-400 text-xs">{idx + 1}</span>
                        <span className="hidden sm:inline w-24 shrink-0 text-slate-500 font-mono text-[11px] dark:text-slate-400">{student.nisn}</span>
                        <span className="flex-1 font-bold text-slate-900 dark:text-white text-xs min-w-0">
                          {student.name}
                          <span className="sm:hidden block font-normal text-slate-400 dark:text-slate-500 font-mono text-[10px]">{student.nisn}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:flex sm:w-64 items-center justify-center gap-1 shrink-0">
                        {statusOptions.map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleAttendanceChange(student.id, st.id as AttendanceStatus)}
                            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition cursor-pointer whitespace-nowrap ${
                              currentStatus === st.id 
                                ? `${st.bg} ring-1 ring-slate-900 dark:ring-slate-100 shadow-xs font-black` 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: Catatan Kejadian / Kejadian Khusus Siswa */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 dark:text-white">
              <AlertCircle size={15} className="text-amber-600" />
              <span>Catatan Kejadian / Kejadian Khusus Siswa</span>
            </h4>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3 dark:bg-slate-800/60 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <select
                  value={newIncidentStudentId}
                  onChange={e => setNewIncidentStudentId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {studentsInClass.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={newIncidentCategory}
                  onChange={e => setNewIncidentCategory(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="catatan">Catatan Umum / Kesehatan</option>
                  <option value="prestasi">Prestasi / Keaktifan</option>
                  <option value="pelanggaran">Pelanggaran / Kedisiplinan</option>
                </select>

                <input
                  type="text"
                  placeholder="Isi catatan kejadian..."
                  value={newIncidentNote}
                  onChange={e => setNewIncidentNote(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddIncident}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Catatan Siswa
                </button>
              </div>

              {incidents.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {incidents.map(inc => (
                    <div key={inc.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs dark:bg-slate-900 dark:border-slate-800">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{inc.studentName}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.category === 'prestasi' ? 'bg-emerald-100 text-emerald-800' :
                          inc.category === 'pelanggaran' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {inc.category.toUpperCase()}
                        </span>
                        <p className="text-slate-600 mt-0.5 dark:text-slate-400 dark:text-slate-500">{inc.note}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIncident(inc.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Foto Laporan Visual */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5 dark:text-white">
              <Camera size={15} className="text-rose-600" />
              <span>Foto Laporan Visual Mengajar (opsional)</span>
            </label>

            {photoError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
                {photoError}
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 bg-slate-50 text-center transition dark:bg-slate-800/60 dark:border-slate-700 text-slate-900 dark:text-slate-100">
              {isUploadingPhoto ? (
                <div className="py-6 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                  <SavingSpinner label="Mengompresi & mengupload foto..." />
                </div>
              ) : photoUrl ? (
                <div className="space-y-3">
                  <img 
                    src={photoUrl} 
                    alt="Preview Laporan" 
                    className="max-h-48 mx-auto rounded-xl border border-slate-200 object-cover shadow-xs dark:border-slate-800" 
                  />
                  <div className="text-xs text-slate-600 font-mono bg-white p-2 rounded-xl border border-slate-200 max-w-md mx-auto dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{photoFileName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoFileName('');
                    }}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Hapus / Ganti Foto
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Upload size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Klik untuk Ambil Foto / Pilih File
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    Foto otomatis dikompres sebelum disimpan agar hemat penyimpanan
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end dark:border-slate-800">
            <div className="flex gap-3">
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
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 disabled:opacity-60 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? <SavingSpinner /> : <><Check size={16} /><span>{editingEntry ? 'Simpan Perubahan' : 'Simpan Jurnal & Absensi'}</span></>}
              </button>
            </div>
          </div>
        </form>
      </div>

      <SuccessPopup
        isOpen={showSuccess}
        message={editingEntry ? "Perubahan jurnal berhasil disimpan." : "Jurnal harian & absensi berhasil disimpan."}
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    </div>
  );
};
