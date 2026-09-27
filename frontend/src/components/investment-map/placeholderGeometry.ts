/**
 * placeholderGeometry.ts
 *
 * AŞAMA 1 — Placeholder geometry layer.
 *
 * District keys are taken verbatim from the existing InvestmentRecord.district
 * values so that map → data joins work correctly once real geometry is added.
 *
 * ⚠  NO real coordinates are present in this file.
 * ⚠  Replace this layer with HGM-PDF-derived GeoJSON in AŞAMA 4.
 */

import { AntalyaGeometryLayer } from './types';
import { investmentRecords } from '@/lib/mock-data/investmentData';

// Derive unique districts directly from the investment dataset —
// no hard-coded district list, no synthetic geography.
const uniqueDistricts = [...new Set(investmentRecords.map((r) => r.district))];

export const placeholderGeometryLayer: AntalyaGeometryLayer = {
  source: 'PLACEHOLDER — HGM Antalya PDF entegrasyonu bekleniyor',
  districts: uniqueDistricts.map((d) => ({
    key: d,
    label: d,
    geometry: undefined, // Will be populated from HGM PDF in AŞAMA 4
  })),
};
