import * as XLSX from 'xlsx';

export interface ImportResult<T> {
  rows: T[];
  errors: string[];
}

export class ImportUtils {
  // ---------- Template downloads ----------

  static downloadStudentTemplate(): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      { 'Nama Siswa': 'Ahmad Fauzan', 'NISN': '0081234567', 'Jenis Kelamin (L/P)': 'L' },
      { 'Nama Siswa': 'Siti Aminah', 'NISN': '0081234568', 'Jenis Kelamin (L/P)': 'P' },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Data Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  }

  static downloadTpTemplate(): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      { 'Mata Pelajaran': 'Matematika', 'Kelas/Fase': '7', 'Kode TP': 'TP.MAT.7.1', 'Deskripsi Tujuan Pembelajaran': 'Siswa mampu menjelaskan konsep bilangan bulat' },
      { 'Mata Pelajaran': 'Matematika', 'Kelas/Fase': '7', 'Kode TP': 'TP.MAT.7.2', 'Deskripsi Tujuan Pembelajaran': 'Siswa mampu menyelesaikan operasi hitung bilangan bulat' },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Data TP');
    XLSX.writeFile(wb, 'Template_Import_TP.xlsx');
  }

  // ---------- Parsing ----------

  private static async readSheetRows(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  // Case/whitespace-insensitive lookup of a column value from a row object,
  // since spreadsheet headers are easy to mistype or reorder.
  private static getCol(row: any, ...candidates: string[]): string {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedCandidate);
      if (match) return String(row[match] ?? '').trim();
    }
    return '';
  }

  static async parseStudents(file: File): Promise<ImportResult<{ name: string; nisn: string; gender: 'L' | 'P' }>> {
    const rawRows = await this.readSheetRows(file);
    const rows: { name: string; nisn: string; gender: 'L' | 'P' }[] = [];
    const errors: string[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 = header row + 1-indexed
      const name = this.getCol(row, 'Nama Siswa', 'Nama', 'Name');
      const nisn = this.getCol(row, 'NISN');
      const genderRaw = this.getCol(row, 'Jenis Kelamin (L/P)', 'Jenis Kelamin', 'Gender', 'JK').toUpperCase();

      if (!name) {
        errors.push(`Baris ${rowNum}: nama siswa kosong, dilewati.`);
        return;
      }
      const gender: 'L' | 'P' = genderRaw === 'P' ? 'P' : 'L';
      if (genderRaw !== 'L' && genderRaw !== 'P') {
        errors.push(`Baris ${rowNum}: jenis kelamin "${genderRaw || '(kosong)'}" tidak dikenali, diisi default "L".`);
      }
      rows.push({ name, nisn, gender });
    });

    return { rows, errors };
  }

  static async parseLearningObjectives(file: File): Promise<ImportResult<{ subject: string; grade: string; code: string; description: string }>> {
    const rawRows = await this.readSheetRows(file);
    const rows: { subject: string; grade: string; code: string; description: string }[] = [];
    const errors: string[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const subject = this.getCol(row, 'Mata Pelajaran', 'Subject');
      const grade = this.getCol(row, 'Kelas/Fase', 'Kelas', 'Grade');
      const code = this.getCol(row, 'Kode TP', 'Kode');
      const description = this.getCol(row, 'Deskripsi Tujuan Pembelajaran', 'Deskripsi', 'Description');

      if (!description) {
        errors.push(`Baris ${rowNum}: deskripsi TP kosong, dilewati.`);
        return;
      }
      if (!subject || !grade) {
        errors.push(`Baris ${rowNum}: mata pelajaran/kelas kosong, tetap diimpor tapi mohon dicek ulang.`);
      }
      rows.push({ subject: subject || '-', grade: grade || '-', code: code || '', description });
    });

    return { rows, errors };
  }

  static downloadScheduleTemplate(): void {
    const wb = XLSX.utils.book_new();
    const rows = [
      { 'Email Guru': 'guru@sekolah.sch.id', 'Kelas': '7A', 'Mata Pelajaran': 'Matematika', 'Hari': 'Senin', 'Jam Ke': 'Jam ke 1-2 (07:30 - 09:00)' },
      { 'Email Guru': 'guru@sekolah.sch.id', 'Kelas': '7A', 'Mata Pelajaran': 'Matematika', 'Hari': 'Rabu', 'Jam Ke': 'Jam ke 3-4 (09:15 - 10:45)' },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, 'Jadwal Mengajar');
    XLSX.writeFile(wb, 'Template_Import_Jadwal_Mengajar.xlsx');
  }

  static async parseSchedule(file: File): Promise<ImportResult<{ teacherEmail: string; className: string; subject: string; day: string; timeSlot: string }>> {
    const rawRows = await this.readSheetRows(file);
    const rows: { teacherEmail: string; className: string; subject: string; day: string; timeSlot: string }[] = [];
    const errors: string[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const teacherEmail = this.getCol(row, 'Email Guru', 'Email');
      const className = this.getCol(row, 'Kelas');
      const subject = this.getCol(row, 'Mata Pelajaran');
      const day = this.getCol(row, 'Hari');
      const timeSlot = this.getCol(row, 'Jam Ke', 'Jam ke-', 'Jam');

      if (!teacherEmail || !className || !subject || !day || !timeSlot) {
        errors.push(`Baris ${rowNum}: ada kolom kosong, baris dilewati.`);
        return;
      }
      rows.push({ teacherEmail, className, subject, day, timeSlot });
    });

    return { rows, errors };
  }

  static readonly DAY_NAME_TO_NUMBER: Record<string, number> = {
    'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, "jum'at": 5, 'sabtu': 6, 'minggu': 7,
  };
}
