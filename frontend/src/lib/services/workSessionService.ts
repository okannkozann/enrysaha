import { WorkSession } from "@/types";
import { teamService } from "./teamService";

// Mock database for work sessions
let mockWorkSessions: WorkSession[] = [
  {
    id: "WS-001",
    teamId: "TEAM-01",
    teamName: "Ekip 01",
    sector: "Kepez",
    workType: "PE Ana Hat",
    notificationType: "COMPLETED",
    startDate: "2026-09-25",
    startTime: "08:15",
    endDate: "2026-09-25",
    endTime: "15:45",
    quantityMeters: 240,
    status: "COMPLETED",
    latitude: 36.9081,
    longitude: 30.6955
  },
  {
    id: "WS-002",
    teamId: "TEAM-02",
    teamName: "Ekip 02",
    sector: "Muratpaşa",
    workType: "Servis Hattı",
    notificationType: "START",
    startDate: "2026-09-26",
    startTime: "09:30",
    status: "IN_PROGRESS",
    latitude: 36.8923,
    longitude: 30.7104
  },
  {
    id: "WS-003",
    teamId: "TEAM-03",
    teamName: "Ekip 03",
    sector: "Kepez",
    workType: "Servis Kutusu S700 (5 Adet)" as any,
    notificationType: "COMPLETED",
    startDate: "2026-09-26",
    startTime: "10:15",
    endDate: "2026-09-26",
    endTime: "11:30",
    quantityMeters: 5,
    status: "COMPLETED",
    latitude: 36.9120,
    longitude: 30.6800
  },
  {
    id: "WS-004",
    teamId: "TEAM-04",
    teamName: "Ekip 04",
    sector: "Konyaaltı",
    workType: "Servis Kutusu CES200 (12 Adet)" as any,
    notificationType: "COMPLETED",
    startDate: "2026-09-26",
    startTime: "13:00",
    endDate: "2026-09-26",
    endTime: "14:45",
    quantityMeters: 12,
    status: "COMPLETED",
    latitude: 36.8850,
    longitude: 30.6400
  }
];

class WorkSessionService {
  async getWorkSessions(): Promise<WorkSession[]> {
    return Promise.resolve([...mockWorkSessions]);
  }

  async getActiveWorkSessions(teamId?: string): Promise<WorkSession[]> {
    const sessions = mockWorkSessions.filter(ws => ws.status === "IN_PROGRESS");
    if (teamId) {
      return Promise.resolve(sessions.filter(ws => ws.teamId === teamId));
    }
    return Promise.resolve(sessions);
  }

  async createWorkSession(session: Partial<WorkSession> & Pick<WorkSession, "teamId" | "teamName" | "sector" | "workType" | "startDate" | "startTime">): Promise<WorkSession> {
    const newSession: WorkSession = {
      id: `WS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: "IN_PROGRESS",
      notificationType: "START",
      ...session
    };
    
    mockWorkSessions = [newSession, ...mockWorkSessions];
    
    // Saha ekibinin durumunu Aktif yap
    const team = await teamService.getTeamById(session.teamId);
    if (team) {
      await teamService.updateTeam(team.id, { status: 'Aktif' });
    }

    return Promise.resolve(newSession);
  }

  async completeWorkSession(id: string, quantityMeters: number, endDate: string, endTime: string): Promise<WorkSession> {
    const sessionIndex = mockWorkSessions.findIndex(ws => ws.id === id);
    if (sessionIndex === -1) throw new Error("Work session not found");

    const updatedSession: WorkSession = {
      ...mockWorkSessions[sessionIndex],
      quantityMeters,
      endDate,
      endTime,
      status: "COMPLETED",
      notificationType: "COMPLETED"
    };

    mockWorkSessions[sessionIndex] = updatedSession;
    
    // Saha ekibinin metrajı ve son bildirim saati zaten detaylarda ve dashboard'da
    // dinamik olarak sessions üzerinden hesaplanıyor. Sadece status'u tutarlı tutuyoruz.

    return Promise.resolve(updatedSession);
  }
}

export const workSessionService = new WorkSessionService();
