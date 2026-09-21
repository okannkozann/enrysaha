import { mockFieldReports } from '../mock-data/fieldReports';
import { FieldReport } from '@/types';

class FieldReportService {
  // In-memory store for the session
  private reports: FieldReport[] = [...mockFieldReports];

  async getFieldReports(): Promise<FieldReport[]> {
    return new Promise((resolve) => setTimeout(() => resolve(this.reports), 400));
  }

  async createFieldReport(report: Omit<FieldReport, 'id'>): Promise<FieldReport> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newReport = {
          ...report,
          id: `rep-new-${Date.now()}`
        };
        this.reports = [newReport, ...this.reports];
        resolve(newReport);
      }, 600);
    });
  }
}

export const fieldReportService = new FieldReportService();
