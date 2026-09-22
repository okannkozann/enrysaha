import { mockTeams, mockEneryaEmployees, mockControlCompanies, mockControlEmployees, mockLocations } from '../mock-data/teams';
import { FieldTeam, EneryaEmployee, ControlCompany, ControlEmployee } from '@/types';

class TeamService {
  private teams: FieldTeam[] = [...mockTeams];

  async getTeams(): Promise<FieldTeam[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...this.teams]), 400));
  }

  async getTeamById(id: string): Promise<FieldTeam | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.teams.find(t => t.id === id));
      }, 300);
    });
  }

  async createTeam(data: Omit<FieldTeam, 'id' | 'updatedAt'>): Promise<FieldTeam> {
    const newTeam: FieldTeam = {
      ...data,
      id: `T${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    this.teams.push(newTeam);
    return newTeam;
  }

  async updateTeam(id: string, data: Partial<FieldTeam>): Promise<FieldTeam | undefined> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index !== -1) {
      this.teams[index] = { ...this.teams[index], ...data, updatedAt: new Date().toISOString() };
      return this.teams[index];
    }
    return undefined;
  }

  async deleteTeam(id: string): Promise<void> {
    this.teams = this.teams.filter(t => t.id !== id);
  }

  async getEneryaEmployees(): Promise<EneryaEmployee[]> {
    return mockEneryaEmployees;
  }

  async getControlCompanies(): Promise<ControlCompany[]> {
    return mockControlCompanies;
  }

  async getControlEmployees(companyId: string): Promise<ControlEmployee[]> {
    return mockControlEmployees.filter(ce => ce.companyId === companyId);
  }

  async getLocations(): Promise<Record<string, string[]>> {
    return mockLocations;
  }
}

export const teamService = new TeamService();
