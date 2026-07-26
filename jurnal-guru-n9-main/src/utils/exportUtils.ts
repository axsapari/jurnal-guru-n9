import * as XLSX from 'xlsx';
import { JournalEntry, SchoolConfig } from '../types';

export interface ExportFilterOptions {
  teacherId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}

export class ExportUtils {
  // Export Journals to Excel (.xlsx)
  static exportJournalsToExcel(
    journals: JournalEntry[], 
    schoolConfig: SchoolConfig,
    filename: string = 'Rekap_Jurnal_Harian_Guru.xlsx'
  ): void {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Jurnal Harian
    const journalRows = journals.map((j, idx) => ({
      'No': idx + 1,
      'ID Jurnal': j.id,
      'Tanggal': j.date,
      'Jam Ke': j.timeSlot,
      'Nama Guru': j.teacherName,
      'Kelas': j.className,
      'Mata Pelajaran': j.subject,
      'Tujuan Pembelajaran (TP)': j.tpDescriptions.join('; '),
      'Uraian Kegiatan / Ringkasan Materi': j.summary,
      'Hadir': j.attendanceSummary.hadir,
      'Sakit': j.attendanceSummary.sakit,
      'Izin': j.attendanceSummary.izin,
      'Alpa': j.attendanceSummary.alpa,
      'Total Siswa': j.attendanceSummary.total,
      'Ada Foto Drive': j.photoUrl ? 'Ya' : 'Tidak',
      'Drive File ID': j.photoDriveId || '-',
      'Nama File Foto': j.photoFileName || '-'
    }));

    const sheetJournal = XLSX.utils.json_to_sheet(journalRows);
    XLSX.utils.book_append_sheet(workbook, sheetJournal, 'Rekap Jurnal Harian');

    // Sheet 2: Catatan Kejadian Siswa
    const incidentRows: any[] = [];
    journals.forEach(j => {
      j.incidents.forEach(inc => {
        incidentRows.push({
          'Tanggal': j.date,
          'Kelas': j.className,
          'Mata Pelajaran': j.subject,
          'Guru': j.teacherName,
          'Nama Siswa': inc.studentName,
          'Kategori': inc.category.toUpperCase(),
          'Catatan Kejadian': inc.note
        });
      });
    });

    const sheetIncidents = XLSX.utils.json_to_sheet(
      incidentRows.length > 0 ? incidentRows : [{ 'Info': 'Tidak ada catatan kejadian' }]
    );
    XLSX.utils.book_append_sheet(workbook, sheetIncidents, 'Catatan Kejadian Siswa');

    // Download File
    XLSX.writeFile(workbook, filename);
  }

  // Format Date Indonesian (e.g. 25 Juli 2026)
  static formatDateIndonesian(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
