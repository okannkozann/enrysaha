'use client';

import { useState, useEffect, useMemo } from 'react';
import { MetropolitanRoad } from '@/types';
import { metropolitanRoadService } from '@/lib/services/metropolitanRoadService';
import { searchMetropolitanRoads } from '@/lib/utils/metropolitanRoadSearch';
import { RoadSearch } from '@/components/metropolitan-road/RoadSearch';
import { RoadSearchResult } from '@/components/metropolitan-road/RoadSearchResult';
import { RoadList } from '@/components/metropolitan-road/RoadList';
import { RoadDetailDrawer } from '@/components/metropolitan-road/RoadDetailDrawer';
import { FileCheck, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ExcavationPermitsPage() {
  const [roads, setRoads] = useState<MetropolitanRoad[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRoad, setSelectedRoad] = useState<MetropolitanRoad | null>(null);

  // Initial Data Load
  const fetchRoads = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRoads, distList] = await Promise.all([
        metropolitanRoadService.getMetropolitanRoads(),
        metropolitanRoadService.getDistricts(),
      ]);
      setRoads(allRoads);
      setDistricts(distList);
    } catch (err) {
      console.error('Error fetching metropolitan roads:', err);
      setError('Cadde listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoads();
  }, []);

  // Compute District Counts dynamically
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roads.forEach((r) => {
      if (r.district) {
        counts[r.district] = (counts[r.district] || 0) + 1;
      }
    });
    return counts;
  }, [roads]);

  // Synchronous filtering with search utility & Turkish character support
  const filteredRoads = useMemo(() => {
    let dataset = roads;

    // 1. District Chip Filter
    if (selectedDistrict !== 'ALL') {
      dataset = dataset.filter((r) => r.district === selectedDistrict);
    }

    // 2. Search Query Filter (with Exact Match Priority)
    if (searchQuery.trim()) {
      dataset = searchMetropolitanRoads(dataset, searchQuery);
    }

    return dataset;
  }, [roads, searchQuery, selectedDistrict]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 p-2.5 sm:p-3.5 overflow-hidden relative selection:bg-blue-500/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0 space-y-2 max-w-[1600px] w-full mx-auto overflow-hidden">
        {/* ══ HEADER BAR ═══════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-xl px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">
              <FileCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Büyükşehir Yetki Kontrolü
                <span className="text-[9.5px] font-bold text-emerald-400 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Resmi Cadde / Bulvar Listesi
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0">
                Büyükşehir Belediyesi'ne bağlı cadde ve yolları listeden sorgulayın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Büyükşehir Yetki Kontrolü</span>
            </div>
          </div>
        </div>

        {/* ══ ERROR STATE DISPLAY ══════════════════════════════════════════ */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchRoads}
              className="px-2.5 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold flex items-center gap-1 transition-colors text-[11px]"
            >
              <RefreshCw className="h-3 w-3" />
              Tekrar Dene
            </button>
          </div>
        )}

        {/* ══ SEARCH & FILTER BAR ══════════════════════════════════════════ */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-xl backdrop-blur-xl shrink-0">
          <RoadSearch
            value={searchQuery}
            onChange={setSearchQuery}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            districts={districts}
            districtCounts={districtCounts}
            resultCount={filteredRoads.length}
            totalCount={roads.length}
          />
        </div>

        {/* ══ FEATURED RESULT BANNER (Active Text Search Query) ════════════ */}
        {searchQuery.trim().length > 0 && (
          <div className="shrink-0">
            <RoadSearchResult
              query={searchQuery}
              results={filteredRoads}
              onSelectRoad={(road) => setSelectedRoad(road)}
            />
          </div>
        )}

        {/* ══ DENSE GROUPED LIST VIEW ══════════════════════════════════════ */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <RoadList
            roads={filteredRoads}
            onSelectRoad={(road) => setSelectedRoad(road)}
            query={searchQuery}
            hasDataLoaded={!loading && roads.length > 0}
          />
        </div>
      </div>

      {/* ══ DETAIL DRAWER MODAL ═════════════════════════════════════════════ */}
      {selectedRoad && (
        <RoadDetailDrawer
          road={selectedRoad}
          onClose={() => setSelectedRoad(null)}
        />
      )}
    </div>
  );
}
