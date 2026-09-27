/**
 * investment-map/types.ts
 *
 * Shared types for the Yatırım İzleme (Harita) module.
 *
 * Architecture note:
 *   MapGeometryLayer  —  future GeoJSON / SVG layer (HGM PDF-derived)
 *   MapSelection      —  drives both the map highlight and the investment panel
 */

// ─── Selection State ─────────────────────────────────────────────────────────

export interface MapSelection {
  district?: string;   // e.g. "KEPEZ"  — matches InvestmentRecord.district
  neighborhood?: string; // e.g. "ÇANKAYA" — matches InvestmentRecord.neighborhood
}

// ─── Geometry Layer (future) ──────────────────────────────────────────────────

/**
 * A single district geometry item.
 * In AŞAMA 4+ this will carry a GeoJSON Feature or SVG path string derived
 * from the HGM Antalya PDF.  For now the geometry field is intentionally
 * left as `unknown` so the rest of the app compiles without a real shape.
 */
export interface DistrictGeometry {
  /** Normalized key — used to join with InvestmentRecord.district */
  key: string;
  /** Display label exactly as it appears in the investment dataset */
  label: string;
  /**
   * Future: GeoJSON Feature | SVG path string | MapLibre source data.
   * Undefined until HGM PDF processing (AŞAMA 4).
   */
  geometry?: unknown;
}

/**
 * Complete geometry layer for Antalya.
 * Swap `districts` from placeholder ↔ real data when HGM PDF is processed.
 */
export interface AntalyaGeometryLayer {
  /** Data source version / tag (e.g. "HGM-2024-v1" or "PLACEHOLDER") */
  source: string;
  districts: DistrictGeometry[];
}

// ─── Map Engine Contract ──────────────────────────────────────────────────────

/**
 * Props that any concrete map engine component must accept.
 * Swap AntalyaInvestmentMap internals (SVG → MapLibre → Leaflet) without
 * changing the parent page API.
 */
export interface MapEngineProps {
  geometryLayer: AntalyaGeometryLayer;
  selection: MapSelection;
  onDistrictClick: (districtKey: string) => void;
  onNeighborhoodClick: (neighborhoodKey: string) => void;
  onReset: () => void;
}
