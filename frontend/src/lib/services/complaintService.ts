import { mockComplaints, INITIAL_COMPLAINT_TYPES } from '../mock-data/complaints';
import { Complaint } from '@/types';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'enerya_complaints';
const CUSTOM_TYPES_KEY = 'enerya_complaint_types';

function formatDateTR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

class ComplaintService {
  private getStorage(): Complaint[] {
    if (typeof window === 'undefined') return mockComplaints;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with mock dataset
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockComplaints));
    } catch (e) {
      console.error('LocalStorage read error:', e);
    }
    return mockComplaints;
  }

  private saveStorage(list: Complaint[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  async getComplaints(): Promise<Complaint[]> {
    return this.getStorage();
  }

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    const list = this.getStorage();
    return list.find((c) => c.id === id);
  }

  async createComplaint(data: Omit<Complaint, 'id'>): Promise<Complaint> {
    const list = this.getStorage();
    const newId = `SKT-2026-${(list.length + 1).toString().padStart(4, '0')}`;
    const newComplaint: Complaint = {
      id: newId,
      ...data,
      status: data.status || 'Planlandı',
    };

    const updated = [newComplaint, ...list];
    this.saveStorage(updated);

    // Track any custom complaint type
    if (data.complaintType) {
      this.addCustomType(data.complaintType);
    }

    return newComplaint;
  }

  async updateComplaint(id: string, data: Partial<Complaint>): Promise<Complaint> {
    const list = this.getStorage();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Şikayet bulunamadı.');
    }

    const updatedItem = { ...list[index], ...data };
    list[index] = updatedItem;
    this.saveStorage(list);

    if (data.complaintType) {
      this.addCustomType(data.complaintType);
    }

    return updatedItem;
  }

  async deleteComplaint(id: string): Promise<boolean> {
    const list = this.getStorage();
    const filtered = list.filter((c) => c.id !== id);
    this.saveStorage(filtered);
    return true;
  }

  getComplaintTypes(): string[] {
    if (typeof window === 'undefined') return INITIAL_COMPLAINT_TYPES;
    try {
      const stored = localStorage.getItem(CUSTOM_TYPES_KEY);
      if (stored) {
        const custom: string[] = JSON.parse(stored);
        const merged = Array.from(new Set([...INITIAL_COMPLAINT_TYPES, ...custom]));
        return merged;
      }
    } catch (e) {
      console.error('Custom types error:', e);
    }
    return INITIAL_COMPLAINT_TYPES;
  }

  private addCustomType(type: string): void {
    if (typeof window === 'undefined' || !type) return;
    try {
      const current = this.getComplaintTypes();
      if (!current.includes(type)) {
        const storedCustom = JSON.parse(localStorage.getItem(CUSTOM_TYPES_KEY) || '[]');
        storedCustom.push(type);
        localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(storedCustom));
      }
    } catch (e) {
      console.error('Add custom type error:', e);
    }
  }

  exportComplaintsToXls(complaints: Complaint[], customFilename?: string): void {
    const exportData = complaints.map((c) => ({
      'Bağlantı Nesnesi': c.connectionObject || '-',
      'Şikayet Türü': c.complaintType,
      'Adres': c.address,
      'İsim': c.name,
      'İletişim': c.contact,
      'Gelen Tarih': formatDateTR(c.receivedDate),
      'Planlanan Tarih': formatDateTR(c.plannedDate),
      'Tekrar Sayısı': c.repeatCount,
      'Durum': c.status || 'Planlandı',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Şikayet Listesi');

    // Generate filename with dynamic current date
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateFormatted = `${day}-${month}-${year}`;

    const filename = customFilename || `Enerya_Sikayet_Listesi_${dateFormatted}.xls`;

    // Export as BIFF8 .xls file
    XLSX.writeFile(workbook, filename, { bookType: 'biff8' });
  }
}

export const complaintService = new ComplaintService();
