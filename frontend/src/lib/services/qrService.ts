import { QRPackage, FieldWorkStatus } from '@/types';

const INITIAL_PACKAGES: QRPackage[] = [
  {
    id: 'QR-20260920-001',
    createdAt: '2026-09-20T10:00:00Z',
    filters: { lastStatus: 'EMPTY', districts: ['Kepez'], sort: 'DESC' },
    serviceBoxIds: ['1', '2', '3', '4', '5'],
    assignedTeamId: 'T1',
    status: 'VIEWED',
    sentAt: '2026-09-20T10:05:00Z',
    viewedAt: '2026-09-20T11:00:00Z'
  }
];

class QrService {
  private qrPackages: QRPackage[] = [];
  private completions: FieldWorkStatus[] = [];
  private initialized: boolean = false;

  private init() {
    if (this.initialized) return;
    if (typeof window !== 'undefined') {
      try {
        const storedPkgs = localStorage.getItem('enerya_qr_packages');
        if (storedPkgs) {
          const parsed = JSON.parse(storedPkgs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.qrPackages = parsed;
          } else {
            this.qrPackages = [...INITIAL_PACKAGES];
            this.savePkgs();
          }
        } else {
          this.qrPackages = [...INITIAL_PACKAGES];
          this.savePkgs();
        }

        const storedCompletions = localStorage.getItem('enerya_qr_completions');
        if (storedCompletions) {
          this.completions = JSON.parse(storedCompletions);
        }
      } catch (e) {
        this.qrPackages = [...INITIAL_PACKAGES];
      }
    } else {
      this.qrPackages = [...INITIAL_PACKAGES];
    }
    this.initialized = true;
  }

  private savePkgs() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('enerya_qr_packages', JSON.stringify(this.qrPackages));
      } catch (e) {}
    }
  }

  private saveCompletions() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('enerya_qr_completions', JSON.stringify(this.completions));
      } catch (e) {}
    }
  }

  async getQrPackages(): Promise<QRPackage[]> {
    this.init();
    return Promise.resolve([...this.qrPackages]);
  }

  async getQrPackageById(id: string): Promise<QRPackage | undefined> {
    this.init();
    let found = this.qrPackages.find(qr => qr.id === id);
    if (!found && id) {
      found = {
        id,
        createdAt: new Date().toISOString(),
        filters: { lastStatus: 'EMPTY', districts: ['Muratpaşa', 'Kepez'], sort: 'DESC' },
        serviceBoxIds: ['1', '2', '3', '4', '5'],
        assignedTeamId: 'T1',
        status: 'VIEWED',
        sentAt: new Date().toISOString(),
        viewedAt: new Date().toISOString()
      };
      this.qrPackages.unshift(found);
      this.savePkgs();
    }
    return Promise.resolve(found);
  }

  async createQrPackage(filters: QRPackage['filters'], serviceBoxIds: string[]): Promise<QRPackage> {
    this.init();
    const newQr: QRPackage = {
      id: `QR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      filters,
      serviceBoxIds,
      status: 'DRAFT'
    };
    this.qrPackages.unshift(newQr);
    this.savePkgs();
    return Promise.resolve(newQr);
  }

  async sendQrPackage(qrId: string, teamId: string): Promise<QRPackage> {
    this.init();
    let index = this.qrPackages.findIndex(qr => qr.id === qrId);
    if (index === -1) {
      const newPkg: QRPackage = {
        id: qrId,
        createdAt: new Date().toISOString(),
        filters: { lastStatus: 'EMPTY', districts: ['Kepez'], sort: 'DESC' },
        serviceBoxIds: ['1', '2', '3'],
        assignedTeamId: teamId,
        status: 'SENT',
        sentAt: new Date().toISOString()
      };
      this.qrPackages.unshift(newPkg);
      this.savePkgs();
      return Promise.resolve(newPkg);
    }

    const updated: QRPackage = {
      ...this.qrPackages[index],
      assignedTeamId: teamId,
      status: 'SENT',
      sentAt: new Date().toISOString()
    };
    this.qrPackages[index] = updated;
    this.savePkgs();
    return Promise.resolve(updated);
  }

  async markQrAsViewed(qrId: string): Promise<QRPackage> {
    this.init();
    let index = this.qrPackages.findIndex(qr => qr.id === qrId);
    if (index === -1) {
      const recoveredPkg: QRPackage = {
        id: qrId,
        createdAt: new Date().toISOString(),
        filters: { lastStatus: 'EMPTY', districts: ['Kepez'], sort: 'DESC' },
        serviceBoxIds: ['1', '2', '3', '4', '5'],
        assignedTeamId: 'T1',
        status: 'VIEWED',
        sentAt: new Date().toISOString(),
        viewedAt: new Date().toISOString()
      };
      this.qrPackages.unshift(recoveredPkg);
      this.savePkgs();
      return Promise.resolve(recoveredPkg);
    }

    if (this.qrPackages[index].status === 'SENT') {
      const updated: QRPackage = {
        ...this.qrPackages[index],
        status: 'VIEWED',
        viewedAt: new Date().toISOString()
      };
      this.qrPackages[index] = updated;
      this.savePkgs();
      return Promise.resolve(updated);
    }
    return Promise.resolve(this.qrPackages[index]);
  }

  // Saha Tamamlanma İşlemleri
  async getQrCompletions(qrId: string): Promise<FieldWorkStatus[]> {
    this.init();
    return Promise.resolve(this.completions.filter(c => c.qrPackageId === qrId));
  }

  async markServiceBoxCompleted(qrId: string, serviceBoxId: string, teamId: string, completed: boolean = true): Promise<FieldWorkStatus | null> {
    this.init();
    const existingIndex = this.completions.findIndex(c => c.qrPackageId === qrId && c.serviceBoxId === serviceBoxId);
    
    if (!completed) {
      if (existingIndex >= 0) {
        this.completions.splice(existingIndex, 1);
        this.saveCompletions();
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
    
    this.saveCompletions();
    return Promise.resolve(newStatus);
  }
}

export const qrService = new QrService();
