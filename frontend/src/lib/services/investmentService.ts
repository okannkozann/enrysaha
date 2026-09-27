import { InvestmentRecord, investmentRecords } from '@/lib/mock-data/investmentData';

export interface InvestmentKPIs {
  totalPlannedPe: number;      // 232.444
  totalPe63: number;           // 205.160
  totalPe125: number;          // 27.284
  totalCompleted: number;      // 151.066
  totalRemaining: number;      // 81.378
  completionRate: number;      // 65.0%
}

export interface DistrictInvestmentSummary {
  district: string;
  pe63: number;
  pe125: number;
  totalPe: number;
  completed: number;
  remaining: number;
  completionRate: number;
  recordCount: number;
}

export interface NeighborhoodInvestmentSummary {
  district: string;
  neighborhood: string;
  pe63: number;
  pe125: number;
  totalPe: number;
  completed: number;
  remaining: number;
  completionRate: number;
}

/**
 * Normalize a district or neighborhood key for comparison (case-insensitive, trims whitespace).
 * Use this to match map polygon IDs with investment data labels without mutating display values.
 */
export function normalizeKey(value: string): string {
  return value.trim().toUpperCase();
}

class InvestmentService {
  /**
   * Fetches all investment records
   */
  async getInvestmentRecords(): Promise<InvestmentRecord[]> {
    return Promise.resolve([...investmentRecords]);
  }

  /**
   * Returns list of unique districts
   */
  async getDistricts(): Promise<string[]> {
    const districts = [...new Set(investmentRecords.map((r) => r.district))];
    return Promise.resolve(districts);
  }

  /**
   * Returns list of neighborhoods for a given district
   */
  async getNeighborhoods(district?: string): Promise<string[]> {
    let filtered = investmentRecords;
    if (district && district !== 'ALL') {
      filtered = filtered.filter((r) => r.district === district);
    }
    const neighborhoods = [...new Set(filtered.map((r) => r.neighborhood))];
    return Promise.resolve(neighborhoods);
  }

  /**
   * Calculates overall KPIs dynamically from dataset
   */
  calculateKPIs(records: InvestmentRecord[]): InvestmentKPIs {
    const totalPe63 = records.reduce((sum, r) => sum + r.pe63, 0);
    const totalPe125 = records.reduce((sum, r) => sum + r.pe125, 0);
    const totalPlannedPe = records.reduce((sum, r) => sum + r.totalPe, 0);
    const totalCompleted = records.reduce((sum, r) => sum + r.completed, 0);
    const totalRemaining = records.reduce((sum, r) => sum + r.remaining, 0);
    const completionRate = totalPlannedPe > 0 ? (totalCompleted / totalPlannedPe) * 100 : 0;

    return {
      totalPlannedPe,
      totalPe63,
      totalPe125,
      totalCompleted,
      totalRemaining,
      completionRate,
    };
  }

  /**
   * Group and summarize dataset by District
   */
  getDistrictSummaries(records: InvestmentRecord[]): DistrictInvestmentSummary[] {
    const map = new Map<string, DistrictInvestmentSummary>();

    records.forEach((r) => {
      const existing = map.get(r.district) || {
        district: r.district,
        pe63: 0,
        pe125: 0,
        totalPe: 0,
        completed: 0,
        remaining: 0,
        completionRate: 0,
        recordCount: 0,
      };

      existing.pe63 += r.pe63;
      existing.pe125 += r.pe125;
      existing.totalPe += r.totalPe;
      existing.completed += r.completed;
      existing.remaining += r.remaining;
      existing.recordCount += 1;

      map.set(r.district, existing);
    });

    const summaries = Array.from(map.values()).map((s) => ({
      ...s,
      completionRate: s.totalPe > 0 ? (s.completed / s.totalPe) * 100 : 0,
    }));


    // Sort by totalPe descending
    return summaries.sort((a, b) => b.totalPe - a.totalPe);
  }

  /**
   * Group and summarize dataset by Neighborhood within a district (or all)
   */
  getNeighborhoodSummaries(
    records: InvestmentRecord[],
    district?: string
  ): NeighborhoodInvestmentSummary[] {
    let filtered = records;
    if (district && district !== 'ALL') {
      filtered = filtered.filter((r) => normalizeKey(r.district) === normalizeKey(district));
    }
    return filtered.map((r) => ({
      district: r.district,
      neighborhood: r.neighborhood,
      pe63: r.pe63,
      pe125: r.pe125,
      totalPe: r.totalPe,
      completed: r.completed,
      remaining: r.remaining,
      completionRate: r.totalPe > 0 ? (r.completed / r.totalPe) * 100 : 0,
    }));
  }

  /**
   * Returns records filtered by optional district and/or neighborhood keys.
   * Uses normalizeKey for robust matching.
   */
  getRecordsBySelection(
    records: InvestmentRecord[],
    district?: string,
    neighborhood?: string
  ): InvestmentRecord[] {
    let filtered = records;
    if (district && district !== 'ALL') {
      filtered = filtered.filter((r) => normalizeKey(r.district) === normalizeKey(district));
    }
    if (neighborhood && neighborhood !== 'ALL') {
      filtered = filtered.filter((r) => normalizeKey(r.neighborhood) === normalizeKey(neighborhood));
    }
    return filtered;
  }
}

export const investmentService = new InvestmentService();
