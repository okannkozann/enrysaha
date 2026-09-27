import { MetropolitanRoad } from '@/types';
import {
  metropolitanRoads as mockRoads,
  EXPECTED_PDF_RECORD_COUNT,
  EXPECTED_DISTRICT_COUNTS,
} from '@/lib/mock-data/metropolitanRoads';
import {
  searchMetropolitanRoads as searchUtility,
  isMetropolitanRoad as checkUtility
} from '@/lib/utils/metropolitanRoadSearch';

export interface DataValidationResult {
  pdfSourceRecords: number;
  applicationRecords: number;
  missingRecords: number;
  duplicateRecords: number;
  districtMismatch: number;
  validationPassed: boolean;
  districtCounts: Record<string, number>;
}

let inMemoryRoads: MetropolitanRoad[] = [...mockRoads];

class MetropolitanRoadService {
  /**
   * Performs data validation against PDF source data expectations
   */
  validateData(): DataValidationResult {
    const appRecordsCount = inMemoryRoads.length;
    const missingRecords = Math.max(0, EXPECTED_PDF_RECORD_COUNT - appRecordsCount);

    // Check for duplicate district+roadName combinations
    const seen = new Set<string>();
    let duplicateCount = 0;
    inMemoryRoads.forEach((r) => {
      const key = `${r.district}::${r.roadName}`;
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
      }
    });

    // Check district counts mismatch
    let districtMismatchCount = 0;
    const appDistrictCounts: Record<string, number> = {};
    inMemoryRoads.forEach((r) => {
      const d = r.district || 'BİLİNMEYEN';
      appDistrictCounts[d] = (appDistrictCounts[d] || 0) + 1;
    });

    Object.entries(EXPECTED_DISTRICT_COUNTS).forEach(([dist, expectedCount]) => {
      const actualCount = appDistrictCounts[dist] || 0;
      if (actualCount !== expectedCount) {
        districtMismatchCount += Math.abs(actualCount - expectedCount);
      }
    });

    const passed =
      appRecordsCount === EXPECTED_PDF_RECORD_COUNT &&
      missingRecords === 0 &&
      duplicateCount === 0 &&
      districtMismatchCount === 0;

    const result: DataValidationResult = {
      pdfSourceRecords: EXPECTED_PDF_RECORD_COUNT,
      applicationRecords: appRecordsCount,
      missingRecords,
      duplicateRecords: duplicateCount,
      districtMismatch: districtMismatchCount,
      validationPassed: passed,
      districtCounts: appDistrictCounts,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.info('========== KAZI İZİNLERİ PDF VERİ DOĞRULAMA RAPORU ==========');
      console.info(`PDF Source Records: ${result.pdfSourceRecords}`);
      console.info(`Application Records: ${result.applicationRecords}`);
      console.info(`Missing Records: ${result.missingRecords}`);
      console.info(`Duplicate Records: ${result.duplicateRecords}`);
      console.info(`District Mismatch: ${result.districtMismatch}`);
      console.info(`Source Validation: ${result.validationPassed ? 'PASS' : 'FAIL'}`);
      console.info('================================================================');
    }

    return result;
  }

  /**
   * Fetches all registered Metropolitan Municipality roads
   */
  async getMetropolitanRoads(): Promise<MetropolitanRoad[]> {
    this.validateData();
    return Promise.resolve([...inMemoryRoads]);
  }

  /**
   * Returns list of unique districts preserving PDF original order
   */
  async getDistricts(): Promise<string[]> {
    const districts: string[] = [];
    inMemoryRoads.forEach((r) => {
      if (r.district && !districts.includes(r.district)) {
        districts.push(r.district);
      }
    });
    return Promise.resolve(districts);
  }

  /**
   * Searches roads by query string with Turkish character normalization
   */
  async searchMetropolitanRoads(query: string): Promise<MetropolitanRoad[]> {
    const results = searchUtility(inMemoryRoads, query);
    return Promise.resolve(results);
  }

  /**
   * Gets a single road detail by ID
   */
  async getMetropolitanRoadById(id: string): Promise<MetropolitanRoad | undefined> {
    const road = inMemoryRoads.find((r) => r.id === id);
    return Promise.resolve(road);
  }

  /**
   * Checks whether a road name is registered under Metropolitan Municipality jurisdiction
   */
  async isMetropolitanRoad(roadName: string): Promise<boolean> {
    return Promise.resolve(checkUtility(roadName, inMemoryRoads));
  }
}

export const metropolitanRoadService = new MetropolitanRoadService();
