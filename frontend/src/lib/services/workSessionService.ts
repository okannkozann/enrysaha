import { WorkSession } from "@/types";
import { teamService } from "./teamService";

// Mock database for work sessions
let mockWorkSessions: WorkSession[] = [
  {
    id: "WS-001",
    teamId: "TEAM-01",
    teamName: "Ekip 01",
    sector: "72200003",
    workType: "PE Ana Hat",
    notificationType: "COMPLETED",
    startDate: "2026-09-21",
    startTime: "08:15",
    endDate: "2026-09-21",
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
    sector: "72200011",
    workType: "Servis Hattı",
    notificationType: "START",
    startDate: "2026-09-21",
    startTime: "09:30",
    status: "IN_PROGRESS",
    latitude: 36.8923,
    longitude: 30.7104
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

  async createWorkSession(session: Omit<WorkSession, "id" | "status" | "notificationType">): Promise<WorkSession> {
    const newSession: WorkSession = {
      ...session,
      id: `WS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      status: "IN_PROGRESS",
      notificationType: "START"
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
