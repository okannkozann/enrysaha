import { mockTeams } from '../mock-data/teams';
import { FieldTeam } from '@/types';

class TeamService {
  async getTeams(): Promise<FieldTeam[]> {
    return new Promise((resolve) => setTimeout(() => resolve(mockTeams), 400));
  }

  async getTeamById(id: string): Promise<FieldTeam | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTeams.find(t => t.id === id));
      }, 300);
    });
  }
}

export const teamService = new TeamService();
