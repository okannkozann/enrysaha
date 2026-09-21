export type ServiceStatus = 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'Bekliyor';
export type PriorityLevel = 'Kritik' | 'Yüksek Öncelik' | 'Takip' | 'Normal';
export type WorkType = 'PE Ana Hat' | 'ST Çelik Hat' | 'Servis Hattı' | 'Servis Kutusu' | 'Diğer';
export type TeamStatus = 'Aktif' | 'Tamamlandı' | 'Bekliyor';

export interface ServiceBox {
  id: string;
  connectionObject: string;
  address: string;
  district: string;
  neighborhood: string;
  agreementDate: string; // YYYY-MM-DD
  waitingDays: number;
  lastStatus: ServiceStatus | '';
  name: string;
  phone: string;
  sectorInfo: string;
  sectorRegionInfo: string;
  lat?: number;
  lng?: number;
  extraFields?: Record<string, string>;
}

export interface FieldTeam {
  id: string;
  code: string;
  name: string;
  status: TeamStatus;
  sectorRegionInfo: string;
  todayProductionMeters: number;
  lastReportTime?: string;
  lat?: number;
  lng?: number;
}

export interface FieldReport {
  id: string;
  teamId: string;
  reportType: 'MORNING' | 'EVENING';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  sectorRegionInfo: string;
  district: string;
  neighborhood: string;
  address: string;
  workType: WorkType;
  productionMeters?: number;
  description?: string;
  status: ServiceStatus;
  lat?: number;
  lng?: number;
}

export interface SectorRegion {
  code: string;
  name: string;
}

export interface DashboardKPIs {
  totalServiceBoxes: number;
  criticalUnder7Days: number;
  under15Days: number;
  under30Days: number;
  activeTeams: number;
  todayProductionMeters: number;
}
