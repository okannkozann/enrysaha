import { MetropolitanRoad } from '@/types';

/**
 * Normalizes text for Turkish character insensitive and case-insensitive search matching.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Searches a list of metropolitan roads with Turkish character normalization
 * and exact-match priority ranking.
 */
export function searchMetropolitanRoads(
  roads: MetropolitanRoad[],
  query: string
): MetropolitanRoad[] {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    return [...roads].sort((a, b) => a.roadName.localeCompare(b.roadName, 'tr'));
  }

  // Filter matching roads
  const matched = roads.filter((road) => {
    const normName = normalizeSearchText(road.roadName);
    const normDistrict = road.district ? normalizeSearchText(road.district) : '';
    return normName.includes(normQuery) || normDistrict.includes(normQuery);
  });

  // Sort with exact match priority
  return matched.sort((a, b) => {
    const normA = normalizeSearchText(a.roadName);
    const normB = normalizeSearchText(b.roadName);

    const isExactA = normA === normQuery;
    const isExactB = normB === normQuery;

    if (isExactA && !isExactB) return -1;
    if (!isExactA && isExactB) return 1;

    const startsA = normA.startsWith(normQuery);
    const startsB = normB.startsWith(normQuery);

    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;

    return a.roadName.localeCompare(b.roadName, 'tr');
  });
}

/**
 * Reusable utility to check if a road name belongs to Metropolitan Municipality list.
 * Can be imported in ServiceBoxes, FieldReports, or map popups in the future.
 */
export function isMetropolitanRoad(
  roadName: string,
  roadsList: MetropolitanRoad[]
): boolean {
  if (!roadName || !roadsList || roadsList.length === 0) return false;
  const normInput = normalizeSearchText(roadName);

  return roadsList.some((road) => {
    const normRoad = normalizeSearchText(road.roadName);
    return normRoad === normInput || normRoad.includes(normInput) || normInput.includes(normRoad);
  });
}
