import React, { useState, useEffect } from 'react';
import { 
  X, Camera, Plus, Check, UserCheck, AlertCircle, 
  Trash2, Sparkles, BookOpen, Target, Calendar, Clock, FileText, Upload, Shield
} from 'lucide-react';
import { 
  User, ClassRoom, Student, LearningObjective, 
  JournalEntry, AttendanceStatus, IncidentRecord 
} from '../../types';
import { StorageService } from '../../services/storageService';

interface JournalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  classes: ClassRoom[];
  learningObjectives: LearningObjective[];
  onSaved: (entry: JournalEntry) => void;
}

export const JournalFormModal: React.FC<JournalFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  classes,
  learningObjectives,
  onSaved
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [subject, setSubject] = useState(currentUser.subject || 'Matematika');
  const [timeSlot, setTimeSlot] = useState('Jam ke 1-2 (07:30 - 09:00)');
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  
  // Attendance state: studentId -> status
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  
  // Incident notes state
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [newIncidentStudentId, setNewIncidentStudentId] = useState('');
  const [newIncidentCategory, setNewIncidentCategory] = useState<'catatan' | 'prestasi' | 'pelanggaran'>('catatan');
  const [newIncidentNote, setNewIncidentNote] = useState('');

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoDriveId, setPhotoDriveId] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('');

  // Inline TP creation
  const [showAddTpInline, setShowAddTpInline] = useState(false);
  const [newTpCode, setNewTpCode] = useState('');
  const [newTpDesc, setNewTpDesc] = useState('');

  const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);

  // Fetch students & initialize attendance whenever the selected class changes
  useEffect(() => {
    let cancelled = false;
    if (selectedClassId) {
      StorageService.getStudents(selectedClassId).then(list => {
        if (cancelled) return;
        setStudentsInClass(list);
        const initialAtt: Record<string, AttendanceStatus> = {};
        list.forEach(s => { initialAtt[s.id] = 'hadir'; });
        setAttendance(initialAtt);
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
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const driveId = `DRIVE_IMG_${activeClass?.name || 'CLS'}_${date.replace(/-/g, '')}_${Math.floor(Math.random() * 899 + 100)}`;
        const fileName = `JRNL_${date.replace(/-/g, '')}_${activeClass?.name || 'CLS'}_${subject.replace(/\s+/g, '')}.jpg`;
        
        setPhotoUrl(base64);
        setPhotoDriveId(driveId);
        setPhotoFileName(fileName);
      };
      reader.readAsDataURL(file);
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

    if (!selectedClassId || !summary.trim()) {
      alert('Mohon isi kelas dan ringkasan kegiatan pembelajaran.');
      return;
    }

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
      id: `JRNL-${date.replace(/-/g, '')}-${activeClass.name}-${Math.floor(Math.random() * 899 + 100)}`,
      date,
      timeSlot,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
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
      photoDriveId,
      photoFileName,
      syncStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    const saved = await StorageService.saveJournalEntry(newJournal);
    onSaved(saved.entry);
    onClose();
  };

  if (!isOpen) return null;

  // Filter TP for selected subject
  const availableTps = learningObjectives.filter(
    tp => tp.subject.toLowerCase() === subject.toLowerCase() || tp.grade === activeClass?.grade
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Input Jurnal Harian & Absensi Siswa</h3>
              <p className="text-xs text-slate-400">Pengisian terpadu kegiatan mengajar & catatan kelas</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-indigo-600" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <BookOpen size={13} className="text-indigo-600" /> Pilih Kelas
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name} ({c.studentCount || 30} Siswa)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock size={13} className="text-indigo-600" /> Jam Ke- / Waktu
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                placeholder="misal: Jam ke 1-2 (07:30 - 09:00)"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText size={13} className="text-indigo-600" /> Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Tujuan Pembelajaran (TP) Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
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

            {showAddTpInline && (
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2 text-xs animate-in fade-in duration-150">
                <p className="font-bold text-indigo-950">Tambah Tujuan Pembelajaran (TP) Baru</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Kode TP (misal: TP.MAT.7.3)"
                    value={newTpCode}
                    onChange={e => setNewTpCode(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Uraian Tujuan Pembelajaran..."
                    value={newTpDesc}
                    onChange={e => setNewTpDesc(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddTpInline(false)}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
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

            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {availableTps.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 text-center">
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
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-medium' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
            <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <FileText size={15} className="text-indigo-600" /> Uraian Kegiatan Pembelajaran / Ringkasan Materi
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Jelaskan metode pembelajaran, materi yang disampaikan, kendala kelas, serta tindak lanjut..."
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            ></textarea>
          </div>

          {/* Section 4: Absensi Siswa */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck size={16} className="text-emerald-600" />
                  <span>Absensi Siswa Kelas {activeClass?.name} ({studentsInClass.length} Siswa)</span>
                </h4>
                <p className="text-[11px] text-slate-500">Tandai status kehadiran siswa per pertemuan</p>
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
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">NISN</th>
                    <th className="px-3 py-2">Nama Siswa</th>
                    <th className="px-3 py-2 text-center">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {studentsInClass.map((student, idx) => {
                    const currentStatus = attendance[student.id] || 'hadir';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{student.nisn}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{student.name}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {[
                              { id: 'hadir', label: 'Hadir', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                              { id: 'sakit', label: 'Sakit', bg: 'bg-blue-50 text-blue-800 border-blue-300' },
                              { id: 'izin', label: 'Izin', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
                              { id: 'alpa', label: 'Alpa', bg: 'bg-rose-50 text-rose-800 border-rose-300' }
                            ].map(st => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleAttendanceChange(student.id, st.id as AttendanceStatus)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                  currentStatus === st.id 
                                    ? `${st.bg} ring-1 ring-slate-900 shadow-xs font-black` 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Catatan Kejadian / Kejadian Khusus Siswa */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-600" />
              <span>Catatan Kejadian / Kejadian Khusus Siswa</span>
            </h4>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <select
                  value={newIncidentStudentId}
                  onChange={e => setNewIncidentStudentId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {studentsInClass.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={newIncidentCategory}
                  onChange={e => setNewIncidentCategory(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
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
                  className="sm:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
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
                    <div key={inc.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{inc.studentName}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.category === 'prestasi' ? 'bg-emerald-100 text-emerald-800' :
                          inc.category === 'pelanggaran' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {inc.category.toUpperCase()}
                        </span>
                        <p className="text-slate-600 mt-0.5">{inc.note}</p>
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

          {/* Section 6: Foto Laporan Visual (Upload / Drive) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Camera size={15} className="text-rose-600" />
              <span>Foto Laporan Visual Mengajar (Otomatis Simpan ke Drive)</span>
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 bg-slate-50 text-center transition">
              {photoUrl ? (
                <div className="space-y-3">
                  <img 
                    src={photoUrl} 
                    alt="Preview Laporan" 
                    className="max-h-48 mx-auto rounded-xl border border-slate-200 object-cover shadow-xs" 
                  />
                  <div className="text-xs text-slate-600 font-mono bg-white p-2 rounded-xl border border-slate-200 max-w-md mx-auto">
                    <p className="font-bold text-slate-900">{photoFileName}</p>
                    <p className="text-[10px] text-slate-500">ID Drive: {photoDriveId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoDriveId('');
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
                  <p className="text-xs font-bold text-slate-800">
                    Klik untuk Ambil Foto / Pilih File
                  </p>
                  <p className="text-[11px] text-slate-500">
                    File foto akan secara otomatis diberi nama ID sesuai Kelas & Tanggal
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
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Shield size={14} className="text-emerald-600" />
              <span>Dukungan Mode Offline & Auto-Sync Google Sheets</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Check size={16} />
                <span>Simpan Jurnal & Absensi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
