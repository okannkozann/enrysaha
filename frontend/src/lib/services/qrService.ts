import { QRPackage, FieldWorkStatus } from '@/types';

class QrService {
  private qrPackages: QRPackage[] = [
    {
      id: 'QR-20260920-001',
      createdAt: '2026-09-20T10:00:00Z',
      filters: { lastStatus: 'EMPTY', districts: ['Kepez'], sort: 'DESC' },
      serviceBoxIds: ['1', '2', '3'],
      assignedTeamId: 'T1',
      status: 'VIEWED',
      sentAt: '2026-09-20T10:05:00Z',
      viewedAt: '2026-09-20T11:00:00Z'
    }
  ];

  private completions: FieldWorkStatus[] = [];

  async getQrPackages(): Promise<QRPackage[]> {
    return Promise.resolve([...this.qrPackages]);
  }

  async getQrPackageById(id: string): Promise<QRPackage | undefined> {
    return Promise.resolve(this.qrPackages.find(qr => qr.id === id));
  }

  async createQrPackage(filters: QRPackage['filters'], serviceBoxIds: string[]): Promise<QRPackage> {
    const newQr: QRPackage = {
      id: `QR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      filters,
      serviceBoxIds,
      status: 'DRAFT'
    };
    this.qrPackages.unshift(newQr);
    return Promise.resolve(newQr);
  }

  async sendQrPackage(qrId: string, teamId: string): Promise<QRPackage> {
    const index = this.qrPackages.findIndex(qr => qr.id === qrId);
    if (index === -1) throw new Error('QR not found');

    const updated: QRPackage = {
      ...this.qrPackages[index],
      assignedTeamId: teamId,
      status: 'SENT',
      sentAt: new Date().toISOString()
    };
    this.qrPackages[index] = updated;
    return Promise.resolve(updated);
  }

  async markQrAsViewed(qrId: string): Promise<QRPackage> {
    const index = this.qrPackages.findIndex(qr => qr.id === qrId);
    if (index === -1) throw new Error('QR not found');

    if (this.qrPackages[index].status === 'SENT') {
      const updated: QRPackage = {
        ...this.qrPackages[index],
        status: 'VIEWED',
        viewedAt: new Date().toISOString()
      };
      this.qrPackages[index] = updated;
      return Promise.resolve(updated);
    }
    return Promise.resolve(this.qrPackages[index]);
  }

  // Saha Tamamlanma İşlemleri
  async getQrCompletions(qrId: string): Promise<FieldWorkStatus[]> {
    return Promise.resolve(this.completions.filter(c => c.qrPackageId === qrId));
  }

  async markServiceBoxCompleted(qrId: string, serviceBoxId: string, teamId: string, completed: boolean = true): Promise<FieldWorkStatus | null> {
    const existingIndex = this.completions.findIndex(c => c.qrPackageId === qrId && c.serviceBoxId === serviceBoxId);
    
    if (!completed) {
      if (existingIndex >= 0) {
        this.completions.splice(existingIndex, 1);
      }
      return Promise.resolve(null);
    }

    const newStatus: FieldWorkStatus = {
      qrPackageId: qrId,
      serviceBoxId,
      completed: true,
      completedAt: new Date().toISOString(),
      completedBy: teamId
    };

    if (existingIndex >= 0) {
      this.completions[existingIndex] = newStatus;
    } else {
      this.completions.push(newStatus);
    }
    
    return Promise.resolve(newStatus);
  }
}

export const qrService = new QrService();
