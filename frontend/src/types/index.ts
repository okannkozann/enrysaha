export type ServiceStatus = 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'Bekliyor';
export type PriorityLevel = 'Kritik' | 'Yüksek Öncelik' | 'Takip' | 'Normal';
export type WorkType = 'PE Ana Hat' | 'ST Çelik Hat' | 'Servis Hattı' | 'Servis Kutusu' | 'Diğer';
export type TeamStatus = 'Aktif' | 'Tamamlandı' | 'Bekliyor';

export type UserRole = 'field' | 'engineer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
}

export interface WorkSession {
  id: string;
  teamId: string;
  teamName: string;
  sector: string;
  workType: WorkType;
  notificationType: "START" | "COMPLETED";
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  quantityMeters?: number;
  status: "IN_PROGRESS" | "COMPLETED";
  latitude?: number;
  longitude?: number;
}

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

export interface EneryaEmployee {
  id: string;
  name: string;
}

export interface ControlCompany {
  id: string;
  name: string;
}

export interface ControlEmployee {
  id: string;
  companyId: string;
  name: string;
}

export interface FieldTeam {
  id: string;
  code: string;
  eneryaEmployee: EneryaEmployee;
  controlCompany: ControlCompany;
  controlEmployee: ControlEmployee;
  district: string;
  neighborhood: string;
  workType: WorkType;
  serviceBoxIds: string[];
  status: TeamStatus;
  assignmentDate: string;
  updatedAt: string;
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

export interface QRPackage {
  id: string;
  createdAt: string;
  filters: {
    lastStatus: "EMPTY" | "OTHER";
    districts: string[];
    sort: "ASC" | "DESC";
  };
  serviceBoxIds: string[];
  assignedTeamId?: string;
  status: "DRAFT" | "SENT" | "VIEWED";
  sentAt?: string;
  viewedAt?: string;
}

export interface FieldWorkStatus {
  serviceBoxId: string;
  qrPackageId: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}
