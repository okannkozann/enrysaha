import {
  GasSector,
  PaftaStatus,
  GasStatus,
  GasStreetDetail,
  StreetWorkStatus,
  ServiceBox,
} from '@/types';
import { serviceBoxService } from './serviceBoxService';

const OVERRIDES_STORAGE_KEY = 'enerya_gas_sector_overrides';

export function isStatusEmpty(status?: string | null): boolean {
  if (!status) return true;
  const s = status.trim().toLowerCase();
  return s === '' || s === 'boş' || s === 'bos' || s === '-';
}

export function extractStreetName(address: string, fallback: string = 'Ana Hat'): string {
  if (!address || address === '-') return fallback;

  if (address.includes('/')) {
    const parts = address.split('/').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return parts[2];
    }
  }

  let clean = address.replace(/^.*?(?:Mah\.|Mahallesi|Mah)\s*/i, '').trim();
  clean = clean.split(/No\s*[:\d]/i)[0].trim();
  if (clean && clean.length > 2) {
    return clean;
  }
  return fallback;
}

export interface SectorOverride {
  paftaStatus?: PaftaStatus;
  gasStatus?: GasStatus;
  actualGasDate?: string;
  targetDate?: string;
  notes?: string;
  streetStatuses?: Record<string, StreetWorkStatus>;
  streetGasStatuses?: Record<string, import('@/types').StreetGasStatus>;
  customStreets?: GasStreetDetail[];
}

class GasTrackingService {
  private getOverrides(): Record<string, SectorOverride> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('GasTrackingService overrides read error:', e);
    }
    return {};
  }

  private saveOverrides(overrides: Record<string, SectorOverride>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.error('GasTrackingService overrides write error:', e);
    }
  }

  /**
   * Derives all gas sectors directly from ServiceBox data (Servis Kutuları sayfasıyla entegre)
   */
  async getSectors(): Promise<GasSector[]> {
    const boxes: ServiceBox[] = await serviceBoxService.getServiceBoxes();
    const overrides = this.getOverrides();

    // Group boxes by sectorInfo
    const sectorGroups: Record<string, ServiceBox[]> = {};

    boxes.forEach((box) => {
      const code = (box.sectorInfo || box.sectorRegionInfo || '072200001SK10').trim().toUpperCase();
      if (!sectorGroups[code]) {
        sectorGroups[code] = [];
      }
      sectorGroups[code].push(box);
    });

    // Ensure 072200002SK35 is present even if not in uploaded dataset
    if (!sectorGroups['072200002SK35']) {
      sectorGroups['072200002SK35'] = [
        {
          id: 'SB-0722-01',
          connectionObject: '7010201',
          address: 'Fabrikalar Mah. Fikri Erten Caddesi No:12',
          district: 'Kepez',
          neighborhood: 'Fabrikalar',
          agreementDate: '2026-09-10',
          waitingDays: 14,
          lastStatus: 'Yapılabilir',
          name: 'Müşteri 1',
          phone: '05321000001',
          sectorInfo: '072200002SK35',
          sectorRegionInfo: '07220000',
        },
        {
          id: 'SB-0722-02',
          connectionObject: '7010202',
          address: 'Fabrikalar Mah. 3024. Sokak No:8',
          district: 'Kepez',
          neighborhood: 'Fabrikalar',
          agreementDate: '2026-09-12',
          waitingDays: 18,
          lastStatus: 'Tamamlandı',
          name: 'Müşteri 2',
          phone: '05321000002',
          sectorInfo: '072200002SK35',
          sectorRegionInfo: '07220000',
        },
        {
          id: 'SB-0722-03',
          connectionObject: '7010203',
          address: 'Fabrikalar Mah. 3028. Sokak No:15',
          district: 'Kepez',
          neighborhood: 'Fabrikalar',
          agreementDate: '2026-09-15',
          waitingDays: 22,
          lastStatus: 'Yapılabilir',
          name: 'Müşteri 3',
          phone: '05321000003',
          sectorInfo: '072200002SK35',
          sectorRegionInfo: '07220000',
        },
      ];
    }

    // Convert each group to GasSector
    const sectors: GasSector[] = Object.entries(sectorGroups).map(([code, sBoxes]) => {
      const first = sBoxes[0];
      const district = first.district || 'Merkez';
      const neighborhood = first.neighborhood || 'Merkez';

      // Determine initial default status:
      // USER SPECIFIC REQUIREMENT: 072200002SK35 gazlandı olarak alalım!
      const isGazlandiDefault = code === '072200002SK35';
      const override = overrides[code];

      let defaultGasStatus: GasStatus = isGazlandiDefault ? 'Gazlandı' : 'Gazlama Öncesi / Hazırlık';
      let defaultPaftaStatus: PaftaStatus = 'Hazır';
      let defaultActualDate: string | undefined = isGazlandiDefault ? '2026-10-24' : undefined;
      let defaultTargetDate = '2026-11-05';
      let defaultNotes = isGazlandiDefault
        ? 'Gazlama tamamlandı. Şebeke aktif olarak devreye alındı.'
        : undefined;

      const finalPaftaStatus: PaftaStatus = override?.paftaStatus ?? defaultPaftaStatus;
      const finalGasStatus: GasStatus = override?.gasStatus ?? defaultGasStatus;
      const finalActualDate: string | undefined =
        finalGasStatus === 'Gazlandı'
          ? (override?.actualGasDate ?? defaultActualDate ?? new Date().toISOString().slice(0, 10))
          : undefined;
      const finalTargetDate: string = override?.targetDate ?? defaultTargetDate;
      const finalNotes: string | undefined = override?.notes ?? defaultNotes;
      const isSectorGazlandi = finalGasStatus === 'Gazlandı';

      // Group street details inside this sector
      const streetGroups: Record<string, ServiceBox[]> = {};
      sBoxes.forEach((b) => {
        const street = extractStreetName(b.address);
        if (!streetGroups[street]) streetGroups[street] = [];
        streetGroups[street].push(b);
      });

      // Construct streets and calculate street-level gas status
      const streets: GasStreetDetail[] = Object.entries(streetGroups).map(
        ([streetName, stBoxes], idx) => {
          const streetId = `STR-${code}-${idx + 1}`;
          const bnos = Array.from(new Set(stBoxes.map((b) => b.connectionObject).filter(Boolean)));
          const allCompleted = stBoxes.every((b) => b.lastStatus === 'Tamamlandı');

          // Sokak bazlı gaz durumu:
          // Kullanıcı kuralı: Sektör gazlı olsa bile yeni abonelerden dolayı sokak sonradan gazlanabilir.
          // Override varsa onu kullan; yoksa sektörün gaz durumunu miras al.
          const defaultStreetGas: import('@/types').StreetGasStatus = isSectorGazlandi ? 'Gazlandı' : 'Gazlanmadı';
          const streetGasStatus: import('@/types').StreetGasStatus =
            override?.streetGasStatuses?.[streetId] ?? defaultStreetGas;

          const streetWorkStatus: StreetWorkStatus =
            override?.streetStatuses?.[streetId] ?? (allCompleted ? 'Tamam' : 'Tamam');

          // Bu sokaktaki BNO detayları:
          const streetBnoDetails: import('@/types').GasConnectionObjectDetail[] = stBoxes.map((b) => {
            const waitingDays = b.waitingDays || 0;
            const remainingDays = 90 - waitingDays;
            const isBoxInstalled = b.lastStatus === 'Tamamlandı' || b.lastStatus === 'Kutu Takıldı';
            const isGasGiven = streetGasStatus === 'Gazlandı';

            const emptyStatus = isStatusEmpty(b.lastStatus);
            const needsAttention = emptyStatus && (!isGasGiven || !isBoxInstalled);
            const isCritical = needsAttention && waitingDays >= 75;
            const isOverdue = needsAttention && waitingDays >= 90;

            return {
              connectionObject: b.connectionObject,
              agreementDate: b.agreementDate || '2026-09-01',
              waitingDays,
              remainingDays,
              boxStatus: emptyStatus ? 'Boş' : (b.lastStatus || 'Boş'),
              isStatusEmpty: emptyStatus,
              isBoxInstalled,
              isGasGiven,
              isCritical,
              isOverdue,
              streetGasStatus,
              sectorGasStatus: finalGasStatus,
              address: b.address,
              customerName: b.name,
              phone: b.phone,
              streetName,
              sectorCode: code,
              district,
              neighborhood,
            };
          });

          return {
            id: streetId,
            streetName,
            connectionObjects: bnos,
            connectionDetails: streetBnoDetails,
            boxCount: stBoxes.length,
            workStatus: streetWorkStatus,
            gasStatus: streetGasStatus,
          };
        }
      );

      // Sektör düzeyindeki tüm BNO detayları:
      const allBnoDetails: import('@/types').GasConnectionObjectDetail[] = streets.flatMap(
        (st) => st.connectionDetails || []
      );

      // Yalnızca son durumu BOŞ olan ve 90 güne yaklaşanlar
      const criticalBnos = allBnoDetails
        .filter((b) => b.isStatusEmpty && (b.isCritical || b.isOverdue))
        .sort((a, b) => b.waitingDays - a.waitingDays);

      const criticalSlaCount = criticalBnos.filter((b) => b.waitingDays >= 75 && b.waitingDays < 90).length;
      const overdueSlaCount = criticalBnos.filter((b) => b.waitingDays >= 90).length;
      const maxWaitingDays = allBnoDetails.reduce(
        (max, b) => (b.isStatusEmpty && (!b.isGasGiven || !b.isBoxInstalled) ? Math.max(max, b.waitingDays) : max),
        0
      );

      // Unique addresses count for building estimate
      const buildingCount = new Set(sBoxes.map((b) => b.address)).size;

      // Apply street status overrides
      const finalStreets = streets.map((st) => {
        if (override?.streetStatuses?.[st.id]) {
          return { ...st, workStatus: override.streetStatuses[st.id] };
        }
        return st;
      });

      return {
        id: code,
        sectorCode: code,
        sectorName: `${neighborhood} Sektör`,
        district,
        neighborhood,
        buildingCount: Math.max(1, buildingCount),
        totalConnectionObjects: sBoxes.length,
        paftaStatus: finalPaftaStatus,
        gasStatus: finalGasStatus,
        targetDate: finalTargetDate,
        actualGasDate: finalActualDate,
        streets: override?.customStreets ? [...finalStreets, ...override.customStreets] : finalStreets,
        notes: finalNotes,
        updatedAt: new Date().toISOString().slice(0, 10),
        criticalSlaCount,
        overdueSlaCount,
        maxWaitingDays,
        criticalBnos,
      };
    });

    // Sort: 072200002SK35 first or standard sort
    return sectors.sort((a, b) => {
      if (a.sectorCode === '072200002SK35') return -1;
      if (b.sectorCode === '072200002SK35') return 1;
      return a.sectorCode.localeCompare(b.sectorCode);
    });
  }

  async updateSectorPaftaStatus(code: string, paftaStatus: PaftaStatus): Promise<void> {
    const overrides = this.getOverrides();
    overrides[code] = {
      ...(overrides[code] || {}),
      paftaStatus,
    };
    this.saveOverrides(overrides);
  }

  async updateSectorTargetDate(code: string, targetDate: string, notes?: string): Promise<void> {
    const overrides = this.getOverrides();
    overrides[code] = {
      ...(overrides[code] || {}),
      targetDate,
      ...(notes !== undefined ? { notes } : {}),
    };
    this.saveOverrides(overrides);
  }

  async updateSectorGasStatus(code: string, gasStatus: GasStatus, actualDate?: string): Promise<void> {
    const overrides = this.getOverrides();
    const today = new Date().toISOString().slice(0, 10);
    overrides[code] = {
      ...(overrides[code] || {}),
      gasStatus,
      actualGasDate: gasStatus === 'Gazlandı' ? (actualDate || today) : undefined,
    };
    this.saveOverrides(overrides);
  }

  async bulkUpdateGasStatus(codes: string[], gasStatus: GasStatus, actualDate?: string): Promise<void> {
    const overrides = this.getOverrides();
    const today = new Date().toISOString().slice(0, 10);

    codes.forEach((code) => {
      overrides[code] = {
        ...(overrides[code] || {}),
        gasStatus,
        actualGasDate: gasStatus === 'Gazlandı' ? (actualDate || today) : undefined,
      };
    });

    this.saveOverrides(overrides);
  }

  async toggleStreetWorkStatus(sectorCode: string, streetId: string): Promise<GasSector | undefined> {
    const overrides = this.getOverrides();
    const secOverride = overrides[sectorCode] || {};
    const streetStatuses = secOverride.streetStatuses || {};

    const current = streetStatuses[streetId] || 'Tamam';
    streetStatuses[streetId] = current === 'Tamam' ? 'Eksik' : 'Tamam';

    overrides[sectorCode] = {
      ...secOverride,
      streetStatuses,
    };
    this.saveOverrides(overrides);

    const all = await this.getSectors();
    return all.find((s) => s.sectorCode === sectorCode);
  }

  async toggleStreetGasStatus(sectorCode: string, streetId: string): Promise<GasSector | undefined> {
    const overrides = this.getOverrides();
    const secOverride = overrides[sectorCode] || {};
    const streetGasStatuses = secOverride.streetGasStatuses || {};

    const all = await this.getSectors();
    const sec = all.find((s) => s.sectorCode === sectorCode);
    const street = sec?.streets.find((st) => st.id === streetId);
    const current = streetGasStatuses[streetId] || street?.gasStatus || 'Gazlanmadı';
    streetGasStatuses[streetId] = current === 'Gazlandı' ? 'Gazlanmadı' : 'Gazlandı';

    overrides[sectorCode] = {
      ...secOverride,
      streetGasStatuses,
    };
    this.saveOverrides(overrides);

    const reloaded = await this.getSectors();
    return reloaded.find((s) => s.sectorCode === sectorCode);
  }

  async addStreetToSector(
    sectorCode: string,
    street: Omit<GasStreetDetail, 'id'>
  ): Promise<GasSector | undefined> {
    const overrides = this.getOverrides();
    const secOverride = overrides[sectorCode] || {};
    const customStreets = secOverride.customStreets || [];

    const newStreet: GasStreetDetail = {
      ...street,
      id: `STR-${sectorCode}-CUSTOM-${Date.now()}`,
    };
    customStreets.push(newStreet);

    overrides[sectorCode] = {
      ...secOverride,
      customStreets,
    };
    this.saveOverrides(overrides);

    const all = await this.getSectors();
    return all.find((s) => s.sectorCode === sectorCode);
  }

  async addSector(data: Omit<GasSector, 'id' | 'createdAt' | 'updatedAt'>): Promise<GasSector> {
    const overrides = this.getOverrides();
    overrides[data.sectorCode] = {
      paftaStatus: data.paftaStatus,
      gasStatus: data.gasStatus,
      actualGasDate: data.actualGasDate,
      targetDate: data.targetDate,
      notes: data.notes,
      customStreets: data.streets,
    };
    this.saveOverrides(overrides);

    const all = await this.getSectors();
    return all.find((s) => s.sectorCode === data.sectorCode) || {
      ...data,
      id: data.sectorCode,
    };
  }

  async deleteSector(sectorCode: string): Promise<boolean> {
    const overrides = this.getOverrides();
    delete overrides[sectorCode];
    this.saveOverrides(overrides);
    return true;
  }
}

export const gasTrackingService = new GasTrackingService();
